<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RoomSlot;
use Illuminate\Http\Request;

class RoomSlotController extends Controller
{
    // GET /api/room-slots
    public function index(Request $request)
    {
        $q = RoomSlot::with('room');

        if ($request->filled('room_id')) {
            $q->where('room_id', $request->room_id);
        }
        if ($request->filled('slot_date')) {
            $q->whereDate('slot_date', $request->slot_date);
        }
        if ($request->filled('time_slot')) {
            $q->where('time_slot', $request->time_slot);
        }
        if ($request->filled('is_available')) {
            $bool = filter_var($request->is_available, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if (!is_null($bool)) {
                $q->where('is_available', $bool);
            }
        }

        return response()->json($q->get()); // vẫn trả array như client đang dùng
    }


    // POST /api/room-slots
    public function store(Request $request)
    {
        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'slot_date' => 'required|date',
            'time_slot' => 'required|in:morning,afternoon',
            'is_available' => 'boolean',
        ]);

        $slot = RoomSlot::create($validated);
        return response()->json($slot, 201);
    }

    // GET /api/room-slots/{id}
    public function show($id)
    {
        $slot = RoomSlot::with('room')->findOrFail($id);
        return response()->json($slot);
    }

    // PUT/PATCH /api/room-slots/{id}
    public function update(Request $request, $id)
    {
        $slot = RoomSlot::findOrFail($id);

        $slot->update($request->only(['slot_date', 'time_slot', 'is_available']));
        return response()->json($slot);
    }

    // DELETE /api/room-slots/{id}
    public function destroy($id)
    {
        RoomSlot::destroy($id);
        return response()->json(['message' => 'Xóa thành công']);
    }
}
