<?php

namespace App\Http\Controllers\Api;

use App\Models\CategoryService;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class CategoryServiceController extends Controller
{
    public function index()
    {
        return response()->json(CategoryService::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'status' => 'required|boolean',
        ]);

        $category = CategoryService::create($validated);
        return response()->json($category, 201);
    }

    public function show($id)
    {
        $category = CategoryService::findOrFail($id);
        return response()->json($category);
    }

    public function update(Request $request, $id)
    {
        $category = CategoryService::findOrFail($id);
        $category->update($request->all());
        return response()->json($category);
    }

    public function destroy($id)
    {
        CategoryService::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
