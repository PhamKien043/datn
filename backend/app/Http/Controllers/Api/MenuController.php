<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;

class MenuController extends Controller
{
    public function index(Request $request)
    {
        $categoryId = $request->query('category_id');
        $query = Menu::query()->where('status', 1);

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        $menus = $query->get(); // hoặc paginate nếu bạn cần phân trang

        return response()->json([
            'success' => true,
            'data' => $menus
        ]);
    }



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

    public function search(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        if ($q === '') {
            return response()->json(['success' => true, 'data' => []]);
        }

        $limit = (int) $request->query('limit', 30);

        $menus = \App\Models\Menu::query()
            ->with('category')
            ->where('status', 1)
            ->where('name', 'LIKE', "%{$q}%") // <-- chỉ name
            ->orderBy('name')
            ->limit($limit)
            ->get();

        return response()->json(['success' => true, 'data' => $menus]);
    }

}
