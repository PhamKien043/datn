<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\WithdrawRequest;
use App\Models\Room;
use App\Models\RoomSlot;

class WithdrawRequestController extends Controller
{
    // Khách hàng gửi yêu cầu hủy đơn
    public function requestCancel(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        if ($order->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng không thể hủy (chỉ hủy khi đang chờ xác nhận).'
            ], 400);
        }

        $request->validate([
            'bank_name'          => 'required|string|max:255',
            'account_number'     => 'required|string|max:50',
            'account_holder_name'=> 'required|string|max:255',
            'phone_number'       => 'required|string|max:20',
            'amount'             => 'required|numeric|min:0',
        ]);

        // Tạo yêu cầu rút tiền
        WithdrawRequest::create([
            'order_id'           => $order->id,
            'user_id'            => $order->user_id,
            'bank_name'          => $request->bank_name,
            'account_number'     => $request->account_number,
            'account_holder_name'=> $request->account_holder_name,
            'phone_number'       => $request->phone_number,
            'amount'             => $request->amount,
            'status'             => 'pending',
        ]);

        // Update trạng thái đơn hàng
        $order->update(['status' => 'cancel_requested']);

        return response()->json([
            'success' => true,
            'message' => 'Yêu cầu hủy đơn hàng đã được gửi. Đợi admin xác nhận.'
        ]);
    }

    // Admin xác nhận đã chuyển tiền (Bước 1: Chuyển sang trạng thái refund_processing)
    public function processRefund($id)
    {
        $order = Order::findOrFail($id);

        if (!in_array($order->status, ['cancel_requested', 'pending', 'refund_processing'])) {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng không trong trạng thái chờ xác nhận hủy. Trạng thái hiện tại: ' . $order->status
            ], 400);
        }

        $order->update(['status' => 'refund_processing']);

        WithdrawRequest::where('order_id', $id)->update([
            'status'     => 'processing',
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã xác nhận chuyển tiền thành công.'
        ]);
    }

    // Admin xác nhận hủy hoàn tất (Bước 2: Sau khi đã chuyển tiền thành công)
    public function confirmCancel(Request $request, $id)
    {
        $request->validate([
            'transaction_id' => 'required|string|max:255',
            'note'           => 'nullable|string'
        ]);

        $order = Order::findOrFail($id);

        if ($order->status !== 'refund_processing') {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng không trong trạng thái đang xử lý hoàn tiền.'
            ], 400);
        }

        // Cập nhật trạng thái đơn hàng
        $order->update(['status' => 'cancelled_confirmed']);

        // Reset trạng thái phòng và giải phóng lịch
        $orderDetails = OrderDetail::where('order_id', $order->id)->get();
        foreach ($orderDetails as $detail) {
            if ($detail->room) {
                $detail->room->update(['status' => 'available']);
            }

            // Giải phóng lịch phòng theo room_slots
            RoomSlot::where('room_id', $detail->room_id)
                ->where('slot_date', $order->date)
                ->where('time_slot', $detail->time_slot ?? null)
                ->update(['is_available' => 1]);
        }

        // Cập nhật yêu cầu rút tiền
        WithdrawRequest::where('order_id', $id)->update([
            'status'        => 'confirmed',
            'transaction_id'=> $request->transaction_id,
            'note'          => $request->note,
            'processed_at'  => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đơn hàng đã được hủy, hoàn tiền và giải phóng lịch phòng thành công.'
        ]);
    }

    // Admin xem danh sách yêu cầu hủy
    public function index()
    {
        $requests = WithdrawRequest::with(['user', 'order'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $requests
        ]);
    }

    // Lấy thông tin yêu cầu hủy theo order_id
    public function getByOrder($orderId)
    {
        $request = WithdrawRequest::with(['user', 'order'])
            ->where('order_id', $orderId)
            ->first();

        if (!$request) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy yêu cầu hủy cho đơn hàng này.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $request
        ]);
    }
}
