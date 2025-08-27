<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\RoomSlot;
use App\Models\Room;
use App\Models\Order;
use App\Models\OrderDetail;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class RoomSlotController extends Controller
{
// GET /api/admin/room-slots?location_type_id=&room_id=&slot_date=
    public function index(Request $request): JsonResponse
    {
        $query = RoomSlot::with(['room']);

        $roomId = $request->get('room_id');
        $date   = $request->get('slot_date');
        $ltId   = $request->get('location_type_id');

        // Lọc theo loại địa điểm qua quan hệ room
        if (!empty($ltId)) {
            $query->whereHas('room', function ($q) use ($ltId) {
                $q->where('location_type_id', $ltId);
            });
        }

        // Lọc theo phòng
        if (!empty($roomId)) {
            $query->where('room_id', $roomId);
            // Có thể tự tạo slot nếu cần (tuỳ nhu cầu)
            // $this->ensureSlotsExist($roomId, $date);
        }

        // Lọc theo ngày
        if (!empty($date)) {
            $query->where('slot_date', $date);
            // Nếu chỉ lọc theo ngày cho tất cả phòng, có thể ensure nếu muốn
            // if (empty($roomId)) $this->ensureSlotsExistForDate($date);
        }

        // Không truyền gì -> trả về tất cả slot
        $slots = $query->orderBy('slot_date')->orderBy('time_slot')->get();

        return response()->json([
            'success' => true,
            'data'    => $slots,
        ]);
    }

    private function ensureSlotsExist($roomId, $date = null): void
    {
        $room = Room::find($roomId);
        if (!$room) {
            Log::warning("Phòng không tồn tại với ID: {$roomId}");
            return;
        }

        $dates = [];
        if ($date) {
            $dates[] = Carbon::parse($date)->format('Y-m-d');
        } else {
            for ($i = 0; $i < 30; $i++) {
                $dates[] = Carbon::now()->addDays($i)->format('Y-m-d');
            }
        }

        $timeSlots = ['morning', 'afternoon'];
        foreach ($dates as $slotDate) {
            foreach ($timeSlots as $timeSlot) {
                $exists = RoomSlot::where('room_id', $roomId)
                    ->where('slot_date', $slotDate)
                    ->where('time_slot', $timeSlot)
                    ->exists();

                if (!$exists && !Carbon::parse($slotDate)->isPast()) {
                    RoomSlot::create([
                        'room_id'      => $roomId,
                        'slot_date'    => $slotDate,
                        'time_slot'    => $timeSlot,
                        'is_available' => true,
                    ]);
                }
            }
        }
    }

    private function ensureSlotsExistForDate(string $date): void
    {
        $date = Carbon::parse($date)->format('Y-m-d');
        if (Carbon::parse($date)->isPast()) return;

        $rooms = Room::all(); // hoặc ->where('status','active')->get();
        $timeSlots = ['morning', 'afternoon'];

        foreach ($rooms as $room) {
            foreach ($timeSlots as $timeSlot) {
                $exists = RoomSlot::where('room_id', $room->id)
                    ->where('slot_date', $date)
                    ->where('time_slot', $timeSlot)
                    ->exists();

                if (!$exists) {
                    RoomSlot::create([
                        'room_id'      => $room->id,
                        'slot_date'    => $date,
                        'time_slot'    => $timeSlot,
                        'is_available' => true,
                    ]);
                }
            }
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'slot_date' => 'required|date|after_or_equal:today',
            'time_slot' => ['required', 'string', 'in:morning,afternoon,evening'],
            'is_available' => 'required|boolean'
        ]);

        $existingSlot = RoomSlot::where('room_id', $validated['room_id'])
            ->where('slot_date', $validated['slot_date'])
            ->where('time_slot', $validated['time_slot'])
            ->first();

        if ($existingSlot) {
            return response()->json([
                'success' => false,
                'message' => 'Slot này đã tồn tại'
            ], 422);
        }

        $slot = RoomSlot::create($validated);
        Log::info("Tạo slot mới: ", $validated);
        return response()->json([
            'success' => true,
            'data' => $slot->load('room')
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $slot = RoomSlot::findOrFail($id);

        $validated = $request->validate([
            'room_id' => 'sometimes|exists:rooms,id',
            'slot_date' => 'sometimes|date|after_or_equal:today',
            'time_slot' => ['sometimes', 'string', 'in:morning,afternoon,evening'],
            'is_available' => 'sometimes|boolean'
        ]);

        if (isset($validated['room_id']) || isset($validated['slot_date']) || isset($validated['time_slot'])) {
            $checkSlot = RoomSlot::where('room_id', $validated['room_id'] ?? $slot->room_id)
                ->where('slot_date', $validated['slot_date'] ?? $slot->slot_date)
                ->where('time_slot', $validated['time_slot'] ?? $slot->time_slot)
                ->where('id', '!=', $slot->id)
                ->first();

            if ($checkSlot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Slot với thông tin này đã tồn tại'
                ], 422);
            }
        }

        $slot->update($validated);
        Log::info("Cập nhật slot {$id}: ", $validated);
        return response()->json([
            'success' => true,
            'data' => $slot->load('room')
        ]);
    }

    public function destroy($id)
    {
        $slot = RoomSlot::findOrFail($id);

        if ($slot->orderDetails()->whereHas('order', fn($q) => $q->where('status', 'completed'))->exists()) {
            Log::warning("Không thể xóa slot {$id}: Slot đã được thanh toán");
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa slot đã thanh toán'
            ], 422);
        }

        $slot->delete();
        Log::info("Xóa slot {$id}");
        return response()->json([
            'success' => true,
            'message' => 'Xóa slot thành công'
        ]);
    }

    public function createPayment(Request $request)
    {
        $validated = $request->validate([
            'room_slot_id' => 'required|exists:room_slots,id',
            'amount' => 'required|numeric|min:0',
            'user_id' => 'required|exists:users,id',
        ]);

        $slot = RoomSlot::findOrFail($validated['room_slot_id']);

        if (!$slot->is_available) {
            Log::warning("Không thể tạo thanh toán cho slot {$validated['room_slot_id']}: Slot đã được đặt");
            return response()->json([
                'success' => false,
                'message' => 'Slot này đã được đặt'
            ], 422);
        }

        DB::beginTransaction();
        try {
            $paymentSession = $this->initiatePayment($slot, $validated['amount']);

            $order = Order::create([
                'user_id' => $validated['user_id'],
                'total_amount' => $validated['amount'],
                'status' => 'pending',
                'date' => $slot->slot_date,
                'time' => $slot->time_slot,
                'method' => 'momo',
                'momo_order_id' => $paymentSession['id'],
                'payment_url' => $paymentSession['url'],
            ]);

            OrderDetail::create([
                'order_id' => $order->id,
                'room_id' => $slot->room_id,
                'room_slot_id' => $slot->id,
                'price' => $validated['amount'],
                'quantity' => 1,
            ]);

            Log::info("Tạo đơn hàng {$order->id} và chi tiết cho slot {$slot->id}");
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Chuyển hướng đến thanh toán',
                'data' => [
                    'order_id' => $order->id,
                    'slot_id' => $slot->id,
                    'payment_session' => $paymentSession,
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error("Lỗi khởi tạo thanh toán cho slot {$validated['room_slot_id']}: {$e->getMessage()}");
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi khởi tạo thanh toán: ' . $e->getMessage()
            ], 500);
        }
    }

    public function confirmPayment(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'momo_order_id' => 'required|string',
            'payment_status' => 'required|in:completed,failed',
        ]);

        DB::beginTransaction();
        try {
            $order = Order::with('details.roomSlot')->findOrFail($validated['order_id']);

            if ($order->status !== 'pending' || $order->momo_order_id !== $validated['momo_order_id']) {
                Log::warning("Xác nhận thanh toán không hợp lệ cho đơn hàng {$order->id}");
                return response()->json([
                    'success' => false,
                    'message' => 'Thanh toán đã được xử lý hoặc không hợp lệ'
                ], 422);
            }

            $order->update(['status' => $validated['payment_status']]);

            if ($validated['payment_status'] === 'completed') {
                foreach ($order->details as $detail) {
                    if ($detail->roomSlot) {
                        $detail->roomSlot->update(['is_available' => false]);
                    }
                }
            }

            Log::info("Thanh toán {$validated['payment_status']} cho đơn hàng {$order->id}");
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => $validated['payment_status'] === 'completed' ? 'Thanh toán thành công, slot đã được đặt' : 'Thanh toán thất bại',
                'data' => $order->load('details.roomSlot')
            ], 200);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error("Lỗi xác nhận thanh toán cho đơn hàng {$validated['order_id']}: {$e->getMessage()}");
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xác nhận thanh toán: ' . $e->getMessage()
            ], 500);
        }
    }

    public function cancelBooking($id)
    {
        $order = Order::with('details.roomSlot')->findOrFail($id);

        if ($order->status !== 'completed') {
            Log::warning("Không thể hủy đơn hàng {$id}: Chưa thanh toán");
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng này chưa được thanh toán'
            ], 422);
        }

        DB::beginTransaction();
        try {
            $order->update(['status' => 'cancelled']);
            foreach ($order->details as $detail) {
                if ($detail->roomSlot) {
                    $detail->roomSlot->update(['is_available' => true]);
                }
            }

            Log::info("Hủy đơn hàng {$id}, đánh dấu slots là còn trống");
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Hủy đặt slot thành công',
                'data' => $order->load('details.roomSlot')
            ], 200);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error("Lỗi hủy đơn hàng {$id}: {$e->getMessage()}");
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi hủy đơn hàng: ' . $e->getMessage()
            ], 500);
        }
    }

    private function initiatePayment($slot, $amount)
    {
        // Mô phỏng tích hợp MoMo
        return [
            'id' => 'momo_' . uniqid(),
            'url' => 'https://payment-gateway.example.com/pay/' . $slot->id,
            'amount' => $amount,
        ];
    }
}
