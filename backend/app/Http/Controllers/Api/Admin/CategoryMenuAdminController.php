<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CategoryMenu;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;

class CategoryMenuAdminController extends Controller
{
    /**
     * Danh sách tất cả category menu
     */
    public function index()
    {
        $categories = CategoryMenu::orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Thêm mới category menu
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:100|unique:category_menus,name',
                'description' => 'nullable|string',
                'status' => 'required|boolean',
            ]);

            $category = CategoryMenu::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Thêm danh mục thành công',
                'data' => $category
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors' => $e->errors()
            ], 422);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi cơ sở dữ liệu',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Xem chi tiết category menu
     */
    public function show($id)
    {
        $category = CategoryMenu::find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy danh mục'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $category
        ]);
    }

    /**
     * Cập nhật category menu
     */
    public function update(Request $request, $id)
    {
        $category = CategoryMenu::find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy danh mục'
            ], 404);
        }

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:100|unique:category_menus,name,' . $id,
                'description' => 'nullable|string',
                'status' => 'required|boolean',
            ]);

            $category->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật danh mục thành công',
                'data' => $category
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors' => $e->errors()
            ], 422);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi cơ sở dữ liệu',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Xóa category menu
     */
    public function destroy($id)
    {
        $category = CategoryMenu::find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy danh mục'
            ], 404);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa danh mục thành công'
        ]);
    }

    /**
     * Check trùng tên
     */
    public function checkName(Request $request)
    {
        // Dùng query param nếu method GET
        // $name = $request->query('name');
        // $id = $request->query('id');

        // Hoặc dùng input body nếu POST
        $name = $request->input('name');
        $id = $request->input('id');

        $query = CategoryMenu::where('name', $name);
        if ($id) {
            $query->where('id', '<>', $id);
        }

        $exists = $query->exists();

        return response()->json(['exists' => $exists]);
    }

}
