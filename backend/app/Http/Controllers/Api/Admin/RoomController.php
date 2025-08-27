<?php
// 3. Cập nhật RoomSlotController để tự động tạo slots nếu chưa có
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\RoomSlot;
use App\Models\Room;
use Illuminate\Http\Request;
use Carbon\Carbon;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        $query = RoomSlot::with('room.locationType');

        if ($request->has('room_id') && $request->room_id != '') {
            $query->where('room_id', $request->room_id);

            // Tự động tạo slots nếu chưa có cho phòng này
            $this->ensureSlotsExist($request->room_id, $request->slot_date);
        }

        if ($request->has('slot_date') && $request->slot_date != '') {
            $query->where('slot_date', $request->slot_date);

            // Tự động tạo slots cho tất cả phòng trong ngày này nếu chưa có
            if (!$request->has('room_id')) {
                $this->ensureSlotsExistForDate($request->slot_date);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('slot_date')->orderBy('time_slot')->get()
        ]);
    }

    private function ensureSlotsExist($roomId, $date = null)
    {
        $room = Room::find($roomId);
        if (!$room) return;

        $dates = [];
        if ($date) {
            $dates[] = $date;
        } else {
            // Tạo slots cho 30 ngày tới nếu không có date cụ thể
            for ($i = 0; $i < 30; $i++) {
                $dates[] = Carbon::now()->addDays($i)->format('Y-m-d');
            }
        }

        $timeSlots = ['morning', 'afternoon'];

        foreach ($dates as $slotDate) {
            foreach ($timeSlots as $timeSlot) {
                $existing = RoomSlot::where('room_id', $roomId)
                    ->where('slot_date', $slotDate)
                    ->where('time_slot', $timeSlot)
                    ->first();

                if (!$existing) {
                    RoomSlot::create([
                        'room_id' => $roomId,
                        'slot_date' => $slotDate,
                        'time_slot' => $timeSlot,
                        'is_available' => true,
                    ]);
                }
            }
        }
    }

    private function ensureSlotsExistForDate($date): void
    {
        $rooms = Room::where('status', 'active')->get();
        $timeSlots = ['morning', 'afternoon'];

        foreach ($rooms as $room) {
            foreach ($timeSlots as $timeSlot) {
                $existing = RoomSlot::where('room_id', $room->id)
                    ->where('slot_date', $date)
                    ->where('time_slot', $timeSlot)
                    ->first();

                if (!$existing) {
                    RoomSlot::create([
                        'room_id' => $room->id,
                        'slot_date' => $date,
                        'time_slot' => $timeSlot,
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
            'slot_date' => 'required|date',
            'time_slot' => 'required|string',
            'is_available' => 'required|boolean',
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
        return response()->json([
            'success' => true,
            'data' => $slot->load('room.locationType')
        ]);
    }

    public function update(Request $request, $id)
    {
        $slot = RoomSlot::findOrFail($id);

        $validated = $request->validate([
            'room_id' => 'sometimes|exists:rooms,id',
            'slot_date' => 'sometimes|date',
            'time_slot' => 'sometimes|string',
            'is_available' => 'sometimes|boolean',
        ]);

        $slot->update($validated);

        return response()->json([
            'success' => true,
            'data' => $slot->load('room.locationType')
        ]);
    }

    public function destroy($id)
    {
        $slot = RoomSlot::findOrFail($id);
        $slot->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa slot thành công'
        ]);
    }

    // Thêm method để book slot
    public function bookSlot($id)
    {
        $slot = RoomSlot::findOrFail($id);

        if (!$slot->is_available) {
            return response()->json([
                'success' => false,
                'message' => 'Slot này đã được đặt'
            ], 422);
        }

        $slot->update(['is_available' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Đặt slot thành công',
            'data' => $slot
        ]);
    }

    // Method để cancel booking và trả lại slot
    public function cancelBooking($id)
    {
        $slot = RoomSlot::findOrFail($id);

        $slot->update(['is_available' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Hủy đặt slot thành công',
            'data' => $slot
        ]);
    }
}
