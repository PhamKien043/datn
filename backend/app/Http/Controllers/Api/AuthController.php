<?php
//
//namespace App\Http\Controllers\Api;
//
//use App\Http\Controllers\Controller;
//use App\Models\User;
//use Illuminate\Http\Request;
//use Illuminate\Support\Facades\Http;   // ✅ thêm
//use Illuminate\Support\Facades\Auth;
//use Illuminate\Support\Facades\DB;
//use Illuminate\Support\Facades\Hash;
//use Illuminate\Support\Facades\Mail;
//use Illuminate\Support\Facades\Validator;
//use Illuminate\Support\Str;
//
//class AuthController extends Controller
//{
//    public function login(Request $request)
//    {
//        $validator = Validator::make($request->all(), [
//            'email' => 'required|email',
//            'password' => 'required|string|min:6',
//        ]);
//
//        if ($validator->fails()) {
//            return response()->json([
//                'success' => false,
//                'message' => 'Dữ liệu không hợp lệ',
//                'errors' => $validator->errors()
//            ], 422);
//        }
//
//        $credentials = $request->only('email', 'password');
//
//        if (Auth::attempt($credentials)) {
//            /** @var \App\Models\User $user */
//            $user = Auth::user();
//            $token = $user->createToken('web')->plainTextToken;
//
//            return response()->json([
//                'success' => true,
//                'message' => 'Đăng nhập thành công',
//                'token'   => $token,
//                'user'    => $user, // có field role: true/false
//            ], 200);
//        }
//
//        return response()->json([
//            'success' => false,
//            'message' => 'Email hoặc mật khẩu không chính xác',
//        ], 401);
//    }
//
//    public function register(Request $request)
//    {
//        $validator = Validator::make($request->all(), [
//            'name' => 'required|string|max:255',
//            'email' => 'required|email|unique:users',
//            'password' => 'required|string|min:6|confirmed',
//        ], [
//            'password.confirmed' => 'Mật khẩu xác nhận không khớp',
//            'email.unique' => 'Email đã được sử dụng',
//            'name.required' => 'Tên không được để trống',
//            'email.required' => 'Email không được để trống',
//            'password.required' => 'Mật khẩu không được để trống',
//        ]);
//
//        if ($validator->fails()) {
//            return response()->json([
//                'success' => false,
//                'message' => $validator->errors()->first(),
//                'errors' => $validator->errors()
//            ], 422);
//        }
//
//        try {
//            $user = User::create([
//                'name'     => $request->name,
//                'email'    => $request->email,
//                'password' => Hash::make($request->password),
//                'phone'    => $request->phone,
//                'address'  => $request->address,
//                'role'     => false, // boolean: user mặc định
//            ]);
//
//            return response()->json([
//                'success' => true,
//                'message' => 'Đăng ký thành công',
//                'user'    => $user,
//            ], 201);
//
//        } catch (\Exception $e) {
//            return response()->json([
//                'success' => false,
//                'message' => 'Có lỗi xảy ra khi đăng ký',
//                'error'   => $e->getMessage()
//            ], 500);
//        }
//    }
//
//    /* ✅ Google Login: nhận { id_token | credential | token } */
//    public function googleLogin(Request $request)
//    {
//        $idToken = $request->input('id_token')
//            ?? $request->input('credential')
//            ?? $request->input('token');
//
//        if (!$idToken) {
//            return response()->json([
//                'success' => false,
//                'message' => 'Thiếu id_token/credential từ Google.',
//            ], 400);
//        }
//
//        try {
//            // 1) Xác thực với Google
//            $googleResp = Http::get('https://oauth2.googleapis.com/tokeninfo', [
//                'id_token' => $idToken,
//            ]);
//
//            if (!$googleResp->ok()) {
//                return response()->json([
//                    'success' => false,
//                    'message' => 'Token Google không hợp lệ.',
//                ], 401);
//            }
//
//            $payload  = $googleResp->json();
//            $aud      = $payload['aud'] ?? null;
//            $clientId = config('services.google.client_id');
//
//            if (!empty($clientId) && $aud !== $clientId) {
//                return response()->json([
//                    'success' => false,
//                    'message' => 'ID token không thuộc ứng dụng này (aud sai).',
//                ], 401);
//            }
//
//            // 2) Lấy info
//            $email         = $payload['email'] ?? null;
//            $emailVerified = filter_var($payload['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);
//            $googleId      = $payload['sub'] ?? null;
//            $name          = $payload['name'] ?? trim(($payload['given_name'] ?? '').' '.($payload['family_name'] ?? '')) ?: 'Google User';
//            $avatar        = $payload['picture'] ?? null;
//
//            if (!$email || !$emailVerified) {
//                return response()->json([
//                    'success' => false,
//                    'message' => 'Email Google thiếu hoặc chưa xác minh.',
//                ], 401);
//            }
//
//            // 3) Tìm / tạo user
//            $user = User::where('email', $email)->first();
//            if (!$user) {
//                $user = User::create([
//                    'name'      => $name,
//                    'email'     => $email,
//                    'password'  => Str::random(40), // sẽ được hash nếu bạn dùng casts('password' => 'hashed')
//                    'avatar'    => $avatar,
//                    'provider'  => 'google',
//                    'google_id' => $googleId,
//                    'role'      => false, // boolean
//                ]);
//            } else {
//                $dirty = false;
//                if (empty($user->google_id) && $googleId) { $user->google_id = $googleId; $dirty = true; }
//                if (empty($user->provider)) { $user->provider = 'google'; $dirty = true; }
//                if (empty($user->avatar) && $avatar) { $user->avatar = $avatar; $dirty = true; }
//                if ($dirty) { $user->save(); }
//            }
//
//            // 4) Token
//            $token = $user->createToken('web')->plainTextToken;
//
//            return response()->json([
//                'success' => true,
//                'message' => 'Đăng nhập Google thành công',
//                'token'   => $token,
//                'user'    => $user,
//            ], 200);
//
//        } catch (\Throwable $e) {
//            return response()->json([
//                'success' => false,
//                'message' => 'Lỗi xác thực Google.',
//                'error'   => $e->getMessage(),
//            ], 500);
//        }
//    }
//
//    public function logout(Request $request)
//    {
//        $request->user()?->currentAccessToken()?->delete();
//        Auth::logout();
//
//        return response()->json([
//            'success' => true,
//            'message' => 'Đăng xuất thành công',
//        ], 200);
//    }
//
//    public function user(Request $request)
//    {
//        $user = Auth::user();
//
//        if (!$user) {
//            return response()->json([
//                'success' => false,
//                'message' => 'Chưa đăng nhập',
//            ], 401);
//        }
//
//        return response()->json([
//            'success' => true,
//            'user' => $user,
//        ], 200);
//    }
//
//    /* ✅ Google Login: nhận { id_token | credential | token } ở body */
//    public function googleLogin(Request $request)
//    {
//        $idToken = $request->input('id_token')
//            ?? $request->input('credential')
//            ?? $request->input('token');
//
//        if (!$idToken) {
//            return response()->json([
//                'success' => false,
//                'message' => 'Thiếu id_token/credential từ Google.',
//            ], 400);
//        }
//
//        try {
//            // 1) Xác thực với Google
//            $googleResp = Http::get('https://oauth2.googleapis.com/tokeninfo', [
//                'id_token' => $idToken,
//            ]);
//
//            if (!$googleResp->ok()) {
//                return response()->json([
//                    'success' => false,
//                    'message' => 'Token Google không hợp lệ.',
//                ], 401);
//            }
//
//            $payload  = $googleResp->json();
//            $aud      = $payload['aud'] ?? null;
//            $clientId = config('services.google.client_id');
//
//            if (!empty($clientId) && $aud !== $clientId) {
//                return response()->json([
//                    'success' => false,
//                    'message' => 'ID token không thuộc ứng dụng này (aud sai).',
//                ], 401);
//            }
//
//            // 2) Trích info
//            $email         = $payload['email'] ?? null;
//            $emailVerified = filter_var($payload['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);
//            $googleId      = $payload['sub'] ?? null;
//            $name          = $payload['name'] ?? trim(($payload['given_name'] ?? '').' '.($payload['family_name'] ?? '')) ?: 'Google User';
//            $avatar        = $payload['picture'] ?? null;
//
//            if (!$email || !$emailVerified) {
//                return response()->json([
//                    'success' => false,
//                    'message' => 'Email Google thiếu hoặc chưa xác minh.',
//                ], 401);
//            }
//
//            // 3) Tạo/tìm user
//            $user = User::where('email', $email)->first();
//            if (!$user) {
//                $user = User::create([
//                    'name'      => $name,
//                    'email'     => $email,
//                    'password'  => Str::random(40), // hashed nhờ casts('password' => 'hashed') nếu bạn dùng
//                    'avatar'    => $avatar,
//                    'provider'  => 'google',
//                    'google_id' => $googleId,
//                    'role'      => false, // boolean
//                ]);
//            } else {
//                $dirty = false;
//                if (empty($user->google_id) && $googleId) { $user->google_id = $googleId; $dirty = true; }
//                if (empty($user->provider)) { $user->provider = 'google'; $dirty = true; }
//                if (empty($user->avatar) && $avatar) { $user->avatar = $avatar; $dirty = true; }
//                if ($dirty) { $user->save(); }
//            }
//
//            // 4) Token
//            $token = $user->createToken('web')->plainTextToken;
//
//            return response()->json([
//                'success' => true,
//                'message' => 'Đăng nhập Google thành công',
//                'token'   => $token,
//                'user'    => $user,
//            ], 200);
//
//        } catch (\Throwable $e) {
//            return response()->json([
//                'success' => false,
//                'message' => 'Lỗi xác thực Google.',
//                'error'   => $e->getMessage(),
//            ], 500);
//        }
//    }
//}



namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    // Login email/password
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Email hoặc mật khẩu không chính xác',
            ], 401);
        }

        $user = Auth::user();

        // Kiểm tra trạng thái
        if (!$user->status) {
            Auth::logout();
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản của bạn đã bị khóa',
            ], 403);
        }

        $token = $user->createToken('web')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công',
            'token'   => $token,
            'user'    => $user,
        ], 200);
    }

    // Register user mới
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'                  => 'required|string|max:255',
            'email'                 => 'required|email|unique:users',
            'password'              => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            $user = User::create([
                'name'     => $request->name,
                'email'    => $request->email,
                'password' => Hash::make($request->password),
                'role'     => 1,  // mặc định User
                'status'   => 1,  // active
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Đăng ký thành công',
                'user'    => $user,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi đăng ký',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // Google Login
    public function googleLogin(Request $request)
    {
        $idToken = $request->input('id_token')
            ?? $request->input('credential')
            ?? $request->input('token');

        if (!$idToken) {
            return response()->json([
                'success' => false,
                'message' => 'Thiếu id_token/credential từ Google.'
            ], 400);
        }

        try {
            $googleResp = Http::get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $idToken,
            ]);

            if (!$googleResp->ok()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token Google không hợp lệ.'
                ], 401);
            }

            $payload  = $googleResp->json();
            $aud      = $payload['aud'] ?? null;
            $clientId = config('services.google.client_id');

            if (!empty($clientId) && $aud !== $clientId) {
                return response()->json([
                    'success' => false,
                    'message' => 'ID token không thuộc ứng dụng này (aud sai).'
                ], 401);
            }

            $email         = $payload['email'] ?? null;
            $emailVerified = filter_var($payload['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $googleId      = $payload['sub'] ?? null;
            $name          = $payload['name'] ?? 'Google User';
            $avatar        = $payload['picture'] ?? null;

            if (!$email || !$emailVerified) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email Google thiếu hoặc chưa xác minh.'
                ], 401);
            }

            // Tìm hoặc tạo user
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name'      => $name,
                    'password'  => Hash::make(Str::random(40)),
                    'avatar'    => $avatar,
                    'provider'  => 'google',
                    'google_id' => $googleId,
                    'role'      => 1, // mặc định User
                    'status'    => 1, // active
                ]
            );

            $token = $user->createToken('web')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Đăng nhập Google thành công',
                'token'   => $token,
                'user'    => $user,
            ], 200);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi xác thực Google.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // Logout
    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();
        Auth::logout();

        return response()->json([
            'success' => true,
            'message' => 'Đăng xuất thành công',
        ], 200);
    }

    // Lấy user hiện tại
    public function user(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập'
            ], 401);
        }

        // Kiểm tra status
        if (!$user->status) {
            Auth::logout();
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản của bạn đã bị khóa'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'user'    => $user
        ], 200);
    }
}
