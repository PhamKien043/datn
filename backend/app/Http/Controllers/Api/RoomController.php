<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\Request;

class RoomController extends Controller
{

    // RoomController.php
    public function index(Request $request)
    {
        $query = Room::with('locationType');

        if ($request->has('location_type_id')) {
            $query->where('location_type_id', $request->location_type_id);
        }

        return response()->json($query->get(), 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'venue_id' => 'nullable|integer',
            'room_name' => 'nullable|string|max:255',
            'room_type' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date',
            'capacity' => 'nullable|integer',
            'table_count' => 'nullable|integer',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'status' => 'nullable|boolean',

        ]);

        $room = Room::create($validated);
        return response()->json($room, 201);
    }

    public function show($id)
    {
        $room = Room::find($id);
        if (!$room) return response()->json(['message' => 'Not found'], 404);
        return response()->json($room, 200);
    }

    public function update(Request $request, $id)
    {
        $room = Room::find($id);
        if (!$room) return response()->json(['message' => 'Not found'], 404);

        $validated = $request->validate([
            'venue_id' => 'nullable|integer',
            'room_name' => 'nullable|string|max:255',
            'room_type' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date',
            'capacity' => 'nullable|integer',
            'table_count' => 'nullable|integer',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'status' => 'nullable|boolean',
        ]);

        $room->update($validated);
        return response()->json($room, 200);
    }

    public function destroy($id)
    {
        $room = Room::find($id);
        if (!$room) return response()->json(['message' => 'Not found'], 404);

        $room->delete();
        return response()->json(['message' => 'Deleted'], 200);
    }
}
