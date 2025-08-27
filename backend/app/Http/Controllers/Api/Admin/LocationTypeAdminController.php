<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\LocationType;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class LocationTypeAdminController extends Controller
{
    // Lấy tất cả location types
    public function index()
    {
        $locationTypes = LocationType::orderBy('id', 'desc')->get();
        return response()->json($locationTypes, 200);
    }

    // Lấy 1 location type theo id
    public function show($id)
    {
        $locationType = LocationType::find($id);
        if (!$locationType) {
            return response()->json(['message' => 'Không tìm thấy loại phòng'], 404);
        }
        return response()->json($locationType, 200);
    }

    // Thêm mới
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:location_types,name',
            'descriptions' => 'nullable|string',
            'is_active' => 'required|boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $locationType = new LocationType();
        $locationType->name = $request->name;
        $locationType->descriptions = $request->descriptions ?? null;
        $locationType->is_active = $request->is_active;

        // Upload ảnh và chỉ lưu tên file
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $path = $file->store('rooms', 'public'); // upload vào rooms
            $locationType->image = basename($path); // chỉ lưu tên file
        }

        $locationType->save();

        return response()->json($locationType, 201);
    }

    // Cập nhật
    public function update(Request $request, $id)
    {
        $locationType = LocationType::find($id);
        if (!$locationType) {
            return response()->json(['message' => 'Không tìm thấy loại phòng'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:location_types,name,' . $id,
            'descriptions' => 'nullable|string',
            'is_active' => 'required|boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $locationType->name = $request->name;
        $locationType->descriptions = $request->descriptions ?? $locationType->descriptions;
        $locationType->is_active = $request->is_active;

        // Upload ảnh mới
        if ($request->hasFile('image')) {
            // Xóa ảnh cũ nếu có
            if ($locationType->image && Storage::disk('public')->exists('rooms/' . $locationType->image)) {
                Storage::disk('public')->delete('rooms/' . $locationType->image);
            }

            $file = $request->file('image');
            $path = $file->store('rooms', 'public');
            $locationType->image = basename($path);
        }

        $locationType->save();

        return response()->json($locationType, 200);
    }

    // Xóa
    public function destroy($id)
    {
        $locationType = LocationType::find($id);
        if (!$locationType) {
            return response()->json(['message' => 'Không tìm thấy loại phòng'], 404);
        }

        // Xóa ảnh nếu có
        if ($locationType->image && Storage::disk('public')->exists('rooms/' . $locationType->image)) {
            Storage::disk('public')->delete('rooms/' . $locationType->image);
        }

        $locationType->delete();

        return response()->json(['message' => 'Xóa thành công'], 200);
    }

    // Kiểm tra trùng tên (dùng khi update)
    public function checkName(Request $request)
    {
        $name = $request->input('name');
        $id = $request->input('id'); // bỏ qua bản ghi hiện tại khi update

        $query = LocationType::where('name', $name);
        if ($id) {
            $query->where('id', '<>', $id);
        }

        $exists = $query->exists();
        return response()->json(['exists' => $exists]);
    }
}
