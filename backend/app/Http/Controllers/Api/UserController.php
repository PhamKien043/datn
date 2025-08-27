<?php
//
//namespace App\Http\Controllers\Api;
//
//use App\Http\Controllers\Controller;
//use App\Models\User;
//use Illuminate\Http\Request;
//use Illuminate\Support\Facades\Hash;
//use Illuminate\Validation\Rule;
//
//class UserController extends Controller
//{
//
//    public function index()
//    {
//        $users = User::with('role')->get();
//        return response()->json($users, 200);
//    }
//
//
//    public function show($id)
//    {
//        $user = User::with('role')->find($id);
//        if (!$user) {
//            return response()->json(['message' => 'User not found'], 404);
//        }
//        return response()->json($user, 200);
//    }
//
//
//    public function store(Request $request)
//    {
//        $request->validate([
//            'name'      => 'required|string|max:255',
//            'username'  => 'required|string|max:255|unique:users,username',
//            'email'     => 'required|email|unique:users,email',
//            'password'  => 'required|string|min:6',
//        ]);
//
//        $user = new User();
//        $user->name     = $request->name;
//        $user->username = $request->username;
//        $user->email    = $request->email;
//        $user->password = Hash::make($request->password);
//        $user->role = 1;
//        $user->status   = 1; // 1 = active
//
//
//        $user->save();
//
//        return response()->json([
//            'message' => 'Thêm Admin thành công',
//            'data'    => $user
//        ], 201);
//    }
//
//    public function checkUnique(Request $request)
//    {
//        $field = $request->query('field');
//        $value = $request->query('value');
//        $id    = $request->query('id'); // id user muốn bỏ qua (khi update)
//
//        if (!in_array($field, ['username', 'email', 'name'])) {
//            return response()->json(['message' => 'Trường kiểm tra không hợp lệ'], 400);
//        }
//
//        $query = User::where($field, $value);
//        if ($id) {
//            $query->where('id', '!=', $id);
//        }
//
//        $exists = $query->exists();
//
//        return response()->json(['exists' => $exists]);
//    }
//}


namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    // Lấy tất cả users
    public function index()
    {
        $users = User::all(); // xóa with('role')
        return response()->json(['data' => $users], 200);
    }

    // Lấy 1 user theo id
    public function show($id)
    {
        $user = User::find($id); // xóa with('role')
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }
        return response()->json(['data' => $user], 200);
    }

    // Tạo user mới
// Tạo user mới
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            // 'role' optional, nếu không gửi thì mặc định User
        ]);

        $user = new User();
        $user->name = $request->name;
        $user->username = $request->username;
        $user->email = $request->email;
        $user->password = Hash::make($request->password);

        // Fix role: frontend gửi "0" = Admin, "1" = User
        if ($request->has('role')) {
            $user->role = $request->role == "0" ? 0 : 1;
        } else {
            $user->role = 1; // default User
        }

        $user->status = $request->status ?? 1; // active mặc định

        $user->save();

        return response()->json([
            'success' => true,
            'message' => $user->role === 0 ? 'Thêm Admin thành công' : 'Thêm User thành công',
            'data' => $user
        ], 201);
    }


    // Cập nhật user
    public function update(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user)
            return response()->json(['message' => 'User not found'], 404);
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:6',
        ]);

        $user->name = $request->name;
        $user->username = $request->username;
        $user->email = $request->email;
        if ($request->password) {
            $user->password = Hash::make($request->password);
        }
        $user->status = $request->status ?? $user->status;

        $user->save();

        return response()->json([
            'message' => 'Cập nhật User thành công',
            'data' => $user
        ], 200);
    }

    // Xóa user
    public function destroy($id)
    {
        $user = User::find($id);
        if (!$user)
            return response()->json(['message' => 'User not found'], 404);

        $user->delete();

        return response()->json(['message' => 'Xóa User thành công'], 200);
    }

    // Check trùng name/username/email
    public function checkUnique(Request $request)
    {
        $field = $request->query('field');
        $value = $request->query('value');
        $id = $request->query('id'); // optional: bỏ qua user khi update

        if (!in_array($field, ['name', 'username', 'email'])) {
            return response()->json(['message' => 'Trường kiểm tra không hợp lệ'], 400);
        }

        $query = User::where($field, $value);
        if ($id)
            $query->where('id', '!=', $id);

        $exists = $query->exists();

        return response()->json(['exists' => $exists]);
    }

    // Chuyển đổi status
    public function toggleStatus($id)
    {
        $user = User::findOrFail($id);
        $user->status = $user->status ? 0 : 1;
        $user->save();

        return response()->json([
            'message' => 'Status updated successfully',
            'user' => $user
        ]);
    }

    public function loginAdmin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Email hoặc mật khẩu không đúng'], 401);
        }

        // Chỉ admin được login admin
        if ($user->role != 0) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền truy cập admin'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json(['success' => true, 'data' => ['user' => $user, 'token' => $token]]);
    }

    public function loginUser(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Email hoặc mật khẩu không đúng'], 401);
        }

        // User hoặc Admin được login user
        if (!in_array($user->role, [0, 1])) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền truy cập'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json(['success' => true, 'data' => ['user' => $user, 'token' => $token]]);
    }

}
