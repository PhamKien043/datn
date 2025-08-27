<?php

namespace App\Http\Controllers\Api;

use App\Models\Service;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class ServiceController extends Controller
{
    public function index()
    {
        $services = Service::with('category')->get(); // load quan hệ category
        return response()->json($services);
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'image' => 'nullable|string',
            'description' => 'nullable|string',
            'status' => 'boolean',
            'category_service_id'  => 'required|exists:category_service,id',
        ]);
        return response()->json(Service::create($validated), 201);
    }

    public function show($id) {
        $service = Service::with('category')->findOrFail($id);
        return response()->json($service);
    }


    public function update(Request $request, $id) {
        $service = Service::findOrFail($id);
        $service->update($request->all());
        return response()->json($service);
    }

    public function destroy($id) {
        Service::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}

