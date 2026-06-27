<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\RoleMiddleware;
use App\Services\DatabaseExporter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DatabaseBackupController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware(RoleMiddleware::class . ':admin');
    }

    /**
     * Create a new database backup, save both .sql and .zip to storage, and stream the .zip for download.
     */
    public function download(DatabaseExporter $exporter)
    {
        // Define the storage disk and directory
        $disk = 'local'; // Corresponds to storage/app
        $backupDir = 'backups';

        try {
            // 1. Generate the SQL content
            $sqlContent = $exporter->export();
            $baseName = 'backup-' . now()->format('Y-m-d_H-i-s');
            $sqlFileName = $baseName . '.sql';
            $zipFileName = $baseName . '.zip';

            // Ensure the final backup directory exists
            if (!Storage::disk($disk)->exists($backupDir)) {
                Storage::disk($disk)->makeDirectory($backupDir);
            }

            // --- START OF MODIFIED CODE ---
            // 2. Save the .sql file directly to the final backup directory.
            Storage::disk($disk)->put("{$backupDir}/{$sqlFileName}", $sqlContent);
            $sqlFilePath = Storage::disk($disk)->path("{$backupDir}/{$sqlFileName}");

            // 3. Create the .zip archive in the same directory.
            $zip = new \ZipArchive();
            $zipFilePath = Storage::disk($disk)->path("{$backupDir}/{$zipFileName}");

            if ($zip->open($zipFilePath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== TRUE) {
                throw new \Exception("Cannot open zip file for writing: {$zipFilePath}");
            }

            // 4. Add the newly saved .sql file to the .zip archive.
            $zip->addFile($sqlFilePath, $sqlFileName);
            $zip->close();
            // --- END OF MODIFIED CODE ---

            // 5. Send the newly created .zip file to the browser for download.
            return Storage::disk($disk)->download("{$backupDir}/{$zipFileName}");

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('PHP-based sql/zip backup failed: ' . $e->getMessage());

            // Clean up any partial files in case of an error
            if (isset($sqlFileName)) {
                Storage::disk($disk)->delete("{$backupDir}/{$sqlFileName}");
            }
            if (isset($zipFileName)) {
                Storage::disk($disk)->delete("{$backupDir}/{$zipFileName}");
            }

            return response()->json(['message' => 'Failed to create backup files. Please check the server logs.'], 500);
        }
    }

    /**
     * Import database from a SQL file or a ZIP file containing a SQL file.
     */
    public function import(Request $request)
    {
        $request->validate([
            'import_file' => 'required|file|max:20480', // limit to 20MB
        ]);

        $file = $request->file('import_file');
        $extension = strtolower($file->getClientOriginalExtension());
        $sqlContent = '';

        try {
            if ($extension === 'zip') {
                $zip = new \ZipArchive();
                if ($zip->open($file->getRealPath()) === true) {
                    // Find the first SQL file in the ZIP archive
                    $sqlFileName = null;
                    for ($i = 0; $i < $zip->numFiles; $i++) {
                        $filename = $zip->getNameIndex($i);
                        if (strtolower(pathinfo($filename, PATHINFO_EXTENSION)) === 'sql') {
                            $sqlFileName = $filename;
                            break;
                        }
                    }

                    if (!$sqlFileName) {
                        return response()->json(['message' => 'No SQL file found in the ZIP archive.'], 422);
                    }

                    $sqlContent = $zip->getFromName($sqlFileName);
                    $zip->close();
                } else {
                    return response()->json(['message' => 'Failed to open ZIP file.'], 422);
                }
            } elseif ($extension === 'sql') {
                $sqlContent = file_get_contents($file->getRealPath());
            } else {
                return response()->json(['message' => 'Invalid file format. Please upload a .sql or .zip file.'], 422);
            }

            if (empty(trim($sqlContent))) {
                return response()->json(['message' => 'The SQL file is empty.'], 422);
            }

            // Disable foreign keys, run restore, enable foreign keys
            \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            \Illuminate\Support\Facades\DB::unprepared($sqlContent);
            \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            return response()->json(['message' => 'Database imported and restored successfully!']);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Database import failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to import database. Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export all database tables as a single JSON file.
     */
    public function downloadJson(Request $request)
    {
        try {
            $data = [];
            // Get all tables in database
            $tables = array_map('current', \Illuminate\Support\Facades\DB::select('SHOW TABLES'));
            
            foreach ($tables as $table) {
                $data[$table] = \Illuminate\Support\Facades\DB::table($table)->get()->toArray();
            }

            $jsonString = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            $fileName = 'backup-' . now()->format('Y-m-d_H-i-s') . '.json';

            return response($jsonString)
                ->header('Content-Type', 'application/json')
                ->header('Content-Disposition', 'attachment; filename="' . $fileName . '"');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('JSON backup download failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to export JSON database. ' . $e->getMessage()], 500);
        }
    }

    /**
     * Import database tables from a JSON file.
     */
    public function importJson(Request $request)
    {
        $request->validate([
            'import_file' => 'required|file|max:20480', // limit to 20MB
        ]);

        $file = $request->file('import_file');
        
        try {
            $jsonContent = file_get_contents($file->getRealPath());
            $data = json_decode($jsonContent, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json(['message' => 'Invalid JSON file. JSON parse error: ' . json_last_error_msg()], 422);
            }

            if (!is_array($data)) {
                return response()->json(['message' => 'Invalid JSON structure. Root element must be an object/array.'], 422);
            }

            // Disable foreign key checks
            \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            foreach ($data as $table => $rows) {
                if (!\Illuminate\Support\Facades\Schema::hasTable($table)) {
                    continue; // Skip tables that do not exist in current schema
                }

                // Truncate existing data
                \Illuminate\Support\Facades\DB::table($table)->truncate();

                if (!empty($rows) && is_array($rows)) {
                    // Convert each row object to an array
                    $insertData = array_map(function ($row) {
                        return (array) $row;
                    }, $rows);

                    // Insert rows in chunks of 500
                    foreach (array_chunk($insertData, 500) as $chunk) {
                        \Illuminate\Support\Facades\DB::table($table)->insert($chunk);
                    }
                }
            }

            // Enable foreign key checks
            \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            return response()->json(['message' => 'Database successfully restored from JSON backup!']);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('JSON database import failed: ' . $e->getMessage());
            // Make sure foreign keys are re-enabled in case of exception
            try {
                \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            } catch (\Exception $ex) {}

            return response()->json([
                'message' => 'Failed to import JSON database. Error: ' . $e->getMessage()
            ], 500);
        }
    }
}

