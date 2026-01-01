<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Citizen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Register a new user with either email or phone (at least one required).
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'required_without:phone', Rule::unique('users', 'email')],
            'phone' => ['nullable', 'string', 'max:20', 'required_without:email', Rule::unique('users', 'phone')],
            'password' => ['required', Password::min(6)],
        ]);

        return DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make($validated['password']),
                'role' => 'user',
            ]);

            // Create a linked Citizen profile
            $citizen = Citizen::create([
                'user_id' => $user->id,
                'name' => $user->name,
                'mobile' => $user->phone,
            ]);

            $user->citizen_id = $citizen->id;
            $user->save();

            $token = $user->createToken('api')->plainTextToken;

            return response()->json([
                'message' => 'User created successfully.',
                'user' => $user,
                'token' => $token,
            ], 201);
        });
    }

    /**
     * Login with email OR phone OR login_identifier.
     */
    public function login(Request $request)
    {
        $request->validate([
            'password' => ['required', 'string'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string'],
            'login_identifier' => ['nullable', 'string'],
        ]);

        $identifier = $request->input('email')
            ?? $request->input('phone')
            ?? $request->input('login_identifier');

        if (!$identifier) {
            return response()->json(['message' => 'The login identifier field is required.'], 422);
        }

        $identifier = trim($identifier);
        $column = filter_var($identifier, FILTER_VALIDATE_EMAIL) ? 'email' : 'phone';

        $user = User::where($column, $identifier)->first();

        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 422);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Logout current token.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    // --- START: NEW METHOD ---
    /**
     * Logout from ALL devices (Revoke all tokens).
     */
    public function logoutAll(Request $request)
    {
        // This deletes every token associated with this user ID from the database.
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Logged out from all devices successfully.']);
    }
    // --- END: NEW METHOD ---
}
