<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Room;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class RoomsAdminController extends Controller
{
    public function index()
    {
        $rooms = Room::with('locationType')->orderBy('id', 'desc')->get();
        return response()->json($rooms);
    }

    public function show($id)
    {
        $room = Room::with('locationType')->find($id);
        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }
        return response()->json($room);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:rooms,name',
            'description' => 'nullable|string',
            'capacity' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            // 'table_money' => 'required|numeric|min:0', // 👈 thêm vào
            'status' => 'required|in:0,1',
            'location_type_id' => 'required|exists:location_types,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->except('image');

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $path = $file->store('rooms', 'public');
            $data['image'] = basename($path);
        }

        $room = Room::create($data);
        $room->image_url = $room->image ? asset('storage/rooms/' . $room->image) : null;

        return response()->json([
            'success' => true,
            'message' => 'Room created successfully',
            'data' => $room
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $room = Room::find($id);
        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:rooms,name,' . $id,
            'description' => 'nullable|string',
            'capacity' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            // 'table_money' => 'required|numeric|min:0', // 👈 thêm vào
            'status' => 'required|in:0,1',
            'location_type_id' => 'required|exists:location_types,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->except('image');

        if ($request->hasFile('image')) {
            if ($room->image && Storage::disk('public')->exists('rooms/' . $room->image)) {
                Storage::disk('public')->delete('rooms/' . $room->image);
            }
            $path = $request->file('image')->store('rooms', 'public');
            $data['image'] = basename($path);
        } elseif ($request->boolean('remove_image')) {
            if ($room->image && Storage::disk('public')->exists('rooms/' . $room->image)) {
                Storage::disk('public')->delete('rooms/' . $room->image);
            }
            $data['image'] = null;
        }

        $room->update($data);
        $room->image_url = $room->image ? asset('storage/rooms/' . $room->image) : null;

        return response()->json([
            'message' => 'Room updated successfully',
            'data' => $room
        ], 200);
    }




    public function destroy($id)
    {
        $room = Room::find($id);
        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }

        if ($room->image && Storage::disk('public')->exists('rooms/' . $room->image)) {
            Storage::disk('public')->delete('rooms/' . $room->image);
        }

        $room->delete();
        return response()->json(['message' => 'Room deleted successfully']);
    }

    public function checkName(Request $request)
    {
        $name = $request->query('name');
        $id = $request->query('id');

        $query = Room::where('name', $name);
        if ($id) {
            $query->where('id', '!=', $id);
        }

        $exists = $query->exists();
        return response()->json(['exists' => $exists]);

    }
    // Nếu dùng FormRequest


}
