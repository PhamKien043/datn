<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Exception;

class GoogleAuthController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            $user = User::where('google_id', $googleUser->id)
                ->orWhere('email', $googleUser->email)
                ->first();

            if ($user) {
                $user->update([
                    'google_id' => $googleUser->id, // ✅ chỉ dùng google_id
                    'provider'  => 'google',
                    'avatar'    => $googleUser->avatar,
                ]);
            } else {
                $username = $this->generateUsernameFromEmail($googleUser->email);

                $user = User::create([
                    'name'      => $googleUser->name,
                    'username'  => $username,
                    'email'     => $googleUser->email,
                    'google_id' => $googleUser->id, // ✅
                    'provider'  => 'google',
                    'avatar'    => $googleUser->avatar,
                    'role_id'   => 2,
                    'password'  => Hash::make(uniqid()),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Đăng nhập thành công',
                'user'    => $user->load('role'),
                'redirect_url' => env('FRONTEND_URL', 'http://localhost:5173')
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đăng nhập thất bại: ' . $e->getMessage(),
            ], 400);
        }
    }

    public function loginWithGoogleToken(Request $request)
    {
        $request->validate(['id_token' => 'required|string']);

        try {
            $client = new \Google_Client(['client_id' => env('GOOGLE_CLIENT_ID')]);

            $ca = env('GOOGLE_VERIFIER_CA') ?: (ini_get('curl.cainfo') ?: ini_get('openssl.cafile') ?: null);
            $guzzleOpts = ['timeout' => 10];
            if ($ca && file_exists($ca)) {
                $guzzleOpts['verify'] = $ca;
            } else {
                $guzzleOpts['verify'] = true; // dùng mặc định php.ini
            }
            $client->setHttpClient(new \GuzzleHttp\Client($guzzleOpts));

            $payload = $client->verifyIdToken($request->id_token);
            if (!$payload) {
                throw new \Exception('Token không hợp lệ');

            }
            $user = User::where('google_id', $payload['sub'])
                ->orWhere('email', $payload['email'])
                ->first();

            if ($user) {
                $user->update([
                    'google_id' => $payload['sub'], // ✅
                    'provider'  => 'google',
                    'avatar'    => $payload['picture'] ?? null,
                ]);
            } else {
                $username = $this->generateUsernameFromEmail($payload['email']);

                $user = User::create([
                    'name'      => $payload['name'] ?? $username,
                    'username'  => $username,
                    'email'     => $payload['email'],
                    'google_id' => $payload['sub'], // ✅
                    'provider'  => 'google',
                    'avatar'    => $payload['picture'] ?? null,
                    'role_id'   => 2,
                    'password'  => Hash::make(uniqid()),
                ]);
            }


            $token = $user->createToken('auth')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Đăng nhập Google thành công',
                'user'    => $user,
                'token'   => $token,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đăng nhập thất bại: ' . $e->getMessage(),
            ], 400);
        }
    }

    private function generateUsernameFromEmail($email)
    {
        $base = preg_replace('/[^a-zA-Z0-9]/', '', strstr($email, '@', true));
        $username = $base; $i = 1;
        while (User::where('username', $username)->exists()) {
            $username = $base . $i++;
        }
        return $username;
    }
}
