<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CategoryMenu;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;

class CategoryMenuController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $page = $request->page ?? 5;
        $data = CategoryMenu::paginate($page);
        return response()->json([
            'success' => true,
            'message' => 'Danh mục thực đơn đã được thêm vào',
            'data' => $data
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
       $request->validate([
            'menu_drink_id' => 'required|exists:menu_drinks,id',
            'name' => 'required',
            'description' => 'required',
            'status' => 'required',
            'default' => 'required',
        ]);

        try {


            $categoryMenu = CategoryMenu::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Thêm danh mục thực đơn thành công',
                'data' => $categoryMenu
            ], 200);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(CategoryMenu $categoryMenu)
    {
        return response()->json([
            'success' => true,
            'message' => 'Chi tiết danh mục thực đơn',
            'data' => $categoryMenu
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $categoryMenu = CategoryMenu::find($id);
        if (!$categoryMenu) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy danh mục thực đơn'
            ], 404);
        }
        try {
            $categoryMenu->update($request->all());
            return response()->json([
                'success' => true,
                'message' => 'Chi tiết danh mục thực đơn',
                'data' => $categoryMenu
            ]);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
         $categoryMenu = CategoryMenu::find($id);
        if (!$categoryMenu) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy danh mục thực đơn'
            ], 404);
        }
        try {
            $categoryMenu->delete();
            return response()->json([
                'success' => true,
                'message' => 'Xóa danh mục thực đơn thành công',
            ], 200);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
