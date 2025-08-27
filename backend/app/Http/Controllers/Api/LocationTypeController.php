<?php


namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LocationType;

class LocationTypeController extends Controller
{
    public function index()
    {
        // Lấy tất cả loại phòng đang hoạt động
        $types = LocationType::where('is_active', 1)->get();
        return response()->json($types);
    }

    public function show($id)
    {
        try {
            $locationType = LocationType::findOrFail($id);
            return response()->json($locationType);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Location type not found'], 404);
        } catch (\Exception $e) {
            \Log::error('Error fetching location type: ' . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
