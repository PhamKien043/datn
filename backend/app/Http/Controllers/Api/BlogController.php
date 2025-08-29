<?php

namespace App\Http\Controllers\Api;

use App\Models\Blog;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class BlogController extends Controller
{
    /**
     * ✅ Lấy danh sách blog (kèm category)
     */
    public function index()
    {
        $blogs = Blog::with('category')->latest()->get();
        return response()->json($blogs, 200);
    }

    /**
     * ✅ Thêm blog mới
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'             => 'required|string|max:255',
            'content'           => 'required|string',
            'image'             => 'nullable|string',
            'status'            => 'boolean',
        ]);

        $blog = Blog::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Thêm blog thành công',
            'data'    => $blog
        ], 201);
    }

    /**
     * ✅ Lấy chi tiết blog
     */
    public function show($id)
    {
        $blog = Blog::with('category')->find($id);

        if (!$blog) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy blog'
            ], 404);
        }

        return response()->json($blog, 200);
    }

    /**
     * ✅ Cập nhật blog
     */
    public function update(Request $request, $id)
    {
        $blog = Blog::find($id);

        if (!$blog) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy blog'
            ], 404);
        }

        $validated = $request->validate([
            'title'             => 'required|string|max:255',
            'content'           => 'required|string',
            'image'             => 'nullable|string',
            'status'            => 'boolean',
        ]);

        $blog->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật blog thành công',
            'data'    => $blog
        ], 200);
    }

    /**
     * ✅ Xóa blog
     */
    public function destroy($id)
    {
        $blog = Blog::find($id);

        if (!$blog) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy blog'
            ], 404);
        }

        $blog->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa blog'
        ], 200);
    }
}
