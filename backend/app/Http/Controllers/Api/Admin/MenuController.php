<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;

class MenuController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $page = $request->page ?? 5;
        $data = Menu::paginate($page);
        return response()->json([
            'success' => true,
            'message' => 'Thực đơn đã được thêm vào',
            'data' => $data
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
       $request->validate([
            'name' => 'required',
            'description' => 'required',
            'image' => 'required',
            'price' => 'required',
            'type' => 'required',
            'is_chay' => 'required',
            'status' => 'required',
        ]);

        try {


            $menu = Menu::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Thêm thực đơn thành công',
                'data' => $menu
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
    public function show(Menu $menu)
    {
        return response()->json([
            'success' => true,
            'message' => 'Chi tiết thực đơn',
            'data' => $menu
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $menu = Menu::find($id);
        if (!$menu) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy thực đơn'
            ], 404);
        }
        try {
            $menu->update($request->all());
            return response()->json([
                'success' => true,
                'message' => 'Chi tiết thực đơn',
                'data' => $menu
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
         $menu = Menu::find($id);
        if (!$menu) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy thực đơn'
            ], 404);
        }
        try {
            $menu->delete();
            return response()->json([
                'success' => true,
                'message' => 'Xóa thực đơn thành công',
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