<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CitizenController;
use App\Http\Controllers\Api\LearnerLicenseController;
use App\Http\Controllers\Api\DrivingLicenseController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\UserAdminController;
use App\Http\Controllers\Api\VehicleTaxController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ServiceRequestController;
use App\Http\Controllers\Api\GlobalSearchController;
use App\Http\Controllers\Api\VehicleInsuranceController;
use App\Http\Controllers\Api\VehiclePuccController;
use App\Http\Controllers\Api\VehicleFitnessController;
use App\Http\Controllers\Api\VehicleVltdController;
use App\Http\Controllers\Api\VehiclePermitController;
use App\Http\Controllers\Api\VehicleSpeedGovernorController;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Controllers\Api\ExpiryReportController;
use App\Http\Controllers\Api\DataExportController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\CitizenExportController;
use App\Http\Controllers\Api\DatabaseBackupController;
use App\Http\Controllers\Api\DocumentInquiryController;
use App\Http\Controllers\Api\LlRegistryController;

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::post('/password/forgot', [PasswordResetController::class, 'requestLink']);
Route::post('/password/reset', [PasswordResetController::class, 'resetPassword']);

Route::post('/service-requests', [ServiceRequestController::class, 'store']);
Route::post('/document-inquiries', [DocumentInquiryController::class, 'store']);

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'throttle:api_high'])->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- START: NEW ROUTE ---
    // Only 'admin' role can access this endpoint to logout from all devices
    Route::post('/logout-all', [AuthController::class, 'logoutAll'])
        ->middleware(RoleMiddleware::class . ':admin');
    // --- END: NEW ROUTE ---

    // Current user
    Route::get('/me', function (Request $request) {
        return $request->user()->load('primaryCitizen', 'branch');
    });

    // Dashboard, Search & Reports
    Route::get('/dashboard/user-stats', [DashboardController::class, 'getUserStats']);
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats'])
        ->middleware(RoleMiddleware::class . ':admin,manager');

    Route::get('/global-search', [GlobalSearchController::class, 'search']);

    Route::get('/reports/expiries', [ExpiryReportController::class, 'index'])
        ->middleware(RoleMiddleware::class . ':admin,manager');

    Route::post('/reports/expiries/send-notification', [ExpiryReportController::class, 'sendManualNotification'])
        ->middleware(RoleMiddleware::class . ':admin,manager');

    // Export & Backups
    Route::get('/database-backups/download', [DatabaseBackupController::class, 'download']);
    Route::get('/export/tables', [DataExportController::class, 'index']);
    Route::get('/export/table/{tableName}', [DataExportController::class, 'exportTable']);
    Route::get('/export/all-as-zip', [DataExportController::class, 'exportAllAsZip']);

    // Authenticated Service Requests
    Route::get('/service-requests', [ServiceRequestController::class, 'index']);
    Route::get('/my-service-requests', [ServiceRequestController::class, 'myRequests']);
    Route::patch('/service-requests/{serviceRequest}/status', [ServiceRequestController::class, 'updateStatus']);

    // Profile
    Route::put('/me', [ProfileController::class, 'updateProfile']);
    Route::put('/me/password', [ProfileController::class, 'changePassword']);
    Route::put('/me/phone', [ProfileController::class, 'changePhone']);

    // Citizens
    Route::get('/citizens/export', CitizenExportController::class);
    Route::get('/citizens/{citizen}/all-details', [CitizenController::class, 'getAllDetails']);
    Route::post('/citizens/{citizen}/send-message', [CitizenController::class, 'sendMessage'])
        ->middleware(RoleMiddleware::class . ':admin,manager');
    Route::get('/citizens/{citizen}/expired-documents', [CitizenController::class, 'getExpiredDocuments'])
        ->middleware(RoleMiddleware::class . ':admin,manager');

    // Core resources
    Route::resource('citizens', CitizenController::class)->except(['create', 'edit']);
    Route::resource('ll', LearnerLicenseController::class)->except(['index', 'create', 'edit', 'store']);
    Route::resource('dl', DrivingLicenseController::class)->except(['index', 'create', 'edit', 'store']);
    Route::resource('vehicles', VehicleController::class)->except(['index', 'create', 'edit', 'store']);

    // Nested by Citizen
    Route::get('/citizens/{citizen}/ll', [LearnerLicenseController::class, 'indexByCitizen']);
    Route::post('/citizens/{citizen}/ll', [LearnerLicenseController::class, 'storeForCitizen']);

    Route::get('/citizens/{citizen}/dl', [DrivingLicenseController::class, 'indexByCitizen']);
    Route::post('/citizens/{citizen}/dl', [DrivingLicenseController::class, 'storeForCitizen']);

    Route::get('/citizens/{citizen}/vehicles', [VehicleController::class, 'indexByCitizen']);
    Route::post('/citizens/{citizen}/vehicles', [VehicleController::class, 'storeForCitizen']);

    // Search
    Route::get('/search/ll', [LearnerLicenseController::class, 'search']);
    Route::get('/search/dl', [DrivingLicenseController::class, 'search']);
    Route::get('/search/vehicle', [VehicleController::class, 'search']);

    // Vehicle sub-resources (by Vehicle)
    Route::resource('taxes', VehicleTaxController::class)->except(['index', 'create', 'edit', 'store']);
    Route::get('/vehicles/{vehicle}/taxes', [VehicleTaxController::class, 'indexByVehicle']);
    Route::post('/vehicles/{vehicle}/taxes', [VehicleTaxController::class, 'storeForVehicle']);

    Route::resource('insurances', VehicleInsuranceController::class)->except(['index', 'create', 'edit', 'store']);
    Route::get('/vehicles/{vehicle}/insurances', [VehicleInsuranceController::class, 'indexByVehicle']);
    Route::post('/vehicles/{vehicle}/insurances', [VehicleInsuranceController::class, 'storeForVehicle']);

    Route::resource('puccs', VehiclePuccController::class)->except(['index', 'create', 'edit', 'store']);
    Route::get('/vehicles/{vehicle}/puccs', [VehiclePuccController::class, 'indexByVehicle']);
    Route::post('/vehicles/{vehicle}/puccs', [VehiclePuccController::class, 'storeForVehicle']);

    Route::resource('fitnesses', VehicleFitnessController::class)->except(['index', 'create', 'edit', 'store']);
    Route::get('/vehicles/{vehicle}/fitnesses', [VehicleFitnessController::class, 'indexByVehicle']);
    Route::post('/vehicles/{vehicle}/fitnesses', [VehicleFitnessController::class, 'storeForVehicle']);

    Route::resource('vltds', VehicleVltdController::class)->except(['index', 'create', 'edit', 'store']);
    Route::get('/vehicles/{vehicle}/vltds', [VehicleVltdController::class, 'indexByVehicle']);
    Route::post('/vehicles/{vehicle}/vltds', [VehicleVltdController::class, 'storeForVehicle']);

    Route::resource('permits', VehiclePermitController::class)->except(['index', 'create', 'edit', 'store']);
    Route::get('/vehicles/{vehicle}/permits', [VehiclePermitController::class, 'indexByVehicle']);
    Route::post('/vehicles/{vehicle}/permits', [VehiclePermitController::class, 'storeForVehicle']);

    Route::resource('speed-governors', VehicleSpeedGovernorController::class)->except(['index', 'create', 'edit', 'store']);
    Route::get('/vehicles/{vehicle}/speed-governors', [VehicleSpeedGovernorController::class, 'indexByVehicle']);
    Route::post('/vehicles/{vehicle}/speed-governors', [VehicleSpeedGovernorController::class, 'storeForVehicle']);

    // LL Registry Routes
    Route::get('/ll-registry', [LlRegistryController::class, 'index']);
    Route::post('/ll-registry', [LlRegistryController::class, 'store']);
    Route::put('/ll-registry/{id}', [LlRegistryController::class, 'update']);
    Route::delete('/ll-registry/{id}', [LlRegistryController::class, 'destroy']);
    Route::post('/ll-registry/{id}/send-message', [LlRegistryController::class, 'sendMessage']);

    // Admin
    Route::prefix('admin')->middleware(RoleMiddleware::class . ':admin,manager')->group(function () {
        Route::get('/users', [UserAdminController::class, 'index']);
        Route::post('/users', [UserAdminController::class, 'store']);
        Route::patch('/users/{user}/role', [UserAdminController::class, 'updateRole']);
        Route::put('/users/{user}', [UserAdminController::class, 'update']);
        Route::delete('/users/{user}', [UserAdminController::class, 'destroy']);
        Route::post('/users/{user}/send-reset-link', [UserAdminController::class, 'sendResetLink']);

        Route::get('/branches', [BranchController::class, 'index']);
        Route::get('/document-inquiries', [DocumentInquiryController::class, 'index']);
        Route::patch('/document-inquiries/{inquiry}/status', [DocumentInquiryController::class, 'updateStatus']);
        Route::get('/document-inquiries/export', [DocumentInquiryController::class, 'exportCsv']);
    });
});
