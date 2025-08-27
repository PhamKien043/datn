<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Menu;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class MenuAdminController extends Controller
{
    // Lấy danh sách menu kèm category, hỗ trợ search & pagination
    public function index(Request $request)
    {
        $query = Menu::with('category');

        if ($request->filled('name')) {
            $query->where('name', 'like', '%' . $request->name . '%');
        }

        if ($request->filled('price')) {
            $query->where('price', $request->price);
        }

        $menus = $query->orderBy('id', 'asc')->paginate(5);

        // Thêm image_url đầy đủ
        $menus->getCollection()->transform(function ($menu) {
            $menu->image_url = $menu->image ? asset('storage/menus/' . $menu->image) : null;
            return $menu;
        });

        return response()->json([
            'success' => true,
            'data' => $menus->items(),
            'current_page' => $menus->currentPage(),
            'total_pages' => $menus->lastPage(),
            'total' => $menus->total()
        ]);
    }

    // Tạo menu mới
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:menus,name',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'price' => 'required|numeric|min:0',
            'status' => 'required|boolean',
            'type' => 'required|string|max:255',
            'is_chay' => 'required|boolean',
            'category_id' => 'required|exists:category_menus,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $request->only(['name', 'description', 'price', 'status', 'type', 'is_chay', 'category_id']);

        // Upload ảnh nếu có
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $data['image'] = basename($file->store('menus', 'public'));
        }

        $menu = Menu::create($data);
        $menu->image_url = $menu->image ? asset('storage/menus/' . $menu->image) : null;

        return response()->json([
            'success' => true,
            'message' => 'Menu created successfully',
            'data' => $menu,
        ], 201);
    }

    // Cập nhật menu (PHẦN ĐÃ SỬA LỖI HOÀN CHỈNH)
    public function update(Request $request, $id)
    {
        $menu = Menu::find($id);
        if (!$menu) {
            return response()->json(['message' => 'Menu not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:menus,name,' . $id,
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'status' => 'required|boolean',
            'type' => 'required|string|max:255',
            'is_chay' => 'required|boolean',
            'category_id' => 'required|exists:category_menus,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->except('image');

        // Xử lý upload ảnh
        if ($request->hasFile('image')) {
            if ($menu->image && Storage::disk('public')->exists('menus/' . $menu->image)) {
                Storage::disk('public')->delete('menus/' . $menu->image);
            }
            $path = $request->file('image')->store('menus', 'public');
            $data['image'] = basename($path);
        } elseif ($request->boolean('remove_image')) {
            // Xóa ảnh hiện tại nếu tick remove
            if ($menu->image && Storage::disk('public')->exists('menus/' . $menu->image)) {
                Storage::disk('public')->delete('menus/' . $menu->image);
            }
            $data['image'] = null;
        }

        $menu->update($data);

        $menu->image_url = $menu->image ? asset('storage/menus/' . $menu->image) : null;

        return response()->json([
            'message' => 'Menu updated successfully',
            'data' => $menu
        ], 200);
    }
    // Xóa menu
    public function destroy($id)
    {
        $menu = Menu::find($id);
        if (!$menu) {
            return response()->json(['success' => false, 'message' => 'Menu not found'], 404);
        }

        if ($menu->image && Storage::disk('public')->exists('menus/' . $menu->image)) {
            Storage::disk('public')->delete('menus/' . $menu->image);
        }

        $menu->delete();

        return response()->json(['success' => true, 'message' => 'Menu deleted successfully']);
    }

    // Xem chi tiết menu
    public function show($id)
    {
        $menu = Menu::with('category')->find($id);
        if (!$menu) {
            return response()->json(['success' => false, 'message' => 'Menu not found'], 404);
        }

        $menu->image_url = $menu->image ? asset('storage/menus/' . $menu->image) : null;

        return response()->json(['success' => true, 'data' => $menu]);
    }

    // Kiểm tra trùng tên menu
    public function checkName(Request $request)
    {
        $name = $request->input('name');
        $id = $request->input('id');

        $query = Menu::where('name', $name);
        if ($id) {
            $query->where('id', '!=', $id);
        }

        return response()->json([
            'success' => true,
            'exists' => $query->exists()
        ]);
    }
}
