<?php

namespace App\Http\Controllers\Api;

use App\Models\CategoryMenu;
use App\Models\CategoryService;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;


class CategoryMenuController extends Controller
{
    // Lấy tất cả danh mục
    public function index()
    {
        return response()->json(CategoryMenu::all());
    }

    // Tạo mới danh mục
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $category = CategoryMenu::create($request->all());

        return response()->json($category, 201);
    }

    // Xem chi tiết một danh mục
    public function show($id)
    {
        $category = CategoryMenu::findOrFail($id);
        return response()->json($category);
    }

    // Cập nhật danh mục
    public function update(Request $request, $id)
    {
        $category = CategoryMenu::findOrFail($id);
        $category->update($request->all());

        return response()->json($category);
    }

    // Xóa danh mục
    public function destroy($id)
    {
        $category = CategoryMenu::findOrFail($id);
        $category->delete();

        return response()->json(null, 204);
    }

    public function getCategoriesWithMenus()
    {
        $categories = \App\Models\CategoryMenu::with(['menus' => function ($query) {
            $query->where('status', 1); // chỉ lấy món đang hoạt động nếu cần
        }])->where('status', 1)->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

}
