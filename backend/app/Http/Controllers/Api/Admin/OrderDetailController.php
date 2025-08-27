<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrderDetail;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;

class OrderDetailController extends Controller
{
    public function index(Request $request)
    {
        $page = $request->input('page', 5);
        $data = OrderDetail::paginate($page);

        return response()->json([
            'success' => true,
            'message' => 'Danh sách chi tiết đơn hàng',
            'data' => $data
        ], 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'event_booking_id' => 'required|exists:event_bookings,id',
            'quantity' => 'required',
            'price' => 'required',
            'note' => 'required',
        ]);

        try {
            $orderDetail = OrderDetail::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Thêm chi tiết đơn hàng thành công',
                'data' => $orderDetail
            ], 200);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(OrderDetail $orderDetail)
    {
        return response()->json([
            'success' => true,
            'message' => 'Chi tiết đơn hàng',
            'data' => $orderDetail
        ]);
    }

    public function update(Request $request, string $id)
    {
        $orderDetail = OrderDetail::find($id);
        if (!$orderDetail) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy chi tiết đơn hàng'
            ], 404);
        }
        try {
            $orderDetail->update($request->all());
            return response()->json([
                'success' => true,
                'message' => 'Cập nhật chi tiết đơn hàng thành công',
                'data' => $orderDetail
            ]);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(string $id)
    {
        $orderDetail = OrderDetail::find($id);
        if (!$orderDetail) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy chi tiết đơn hàng'
            ], 404);
        }
        try {
            $orderDetail->delete();
            return response()->json([
                'success' => true,
                'message' => 'Xóa chi tiết đơn hàng thành công',
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
