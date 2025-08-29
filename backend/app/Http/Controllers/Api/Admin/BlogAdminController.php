<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class BlogAdminController extends Controller
{
    /**
     * Danh sách tất cả blog
     */
    public function index()
    {
        $blogs = Blog::orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $blogs
        ]);
    }

    /**
     * Thêm mới blog
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title'   => 'required|string|max:255|unique:blogs,title',
            'content' => 'required|string|min:20',
            'status'  => 'required|in:0,1',
            'image'   => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $data = $request->except('image');

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('blogs', 'public');
            $data['image'] = basename($path);
        }

        $blog = Blog::create($data);

        $blog->image_url = $blog->image ? asset('storage/blogs/' . $blog->image) : null;

        return response()->json([
            'message' => 'Blog created successfully',
            'data'    => $blog
        ], 201);
    }

    /**
     * Xem chi tiết blog
     */
    public function show($id)
    {
        $blog = Blog::find($id);
        if (!$blog) {
            return response()->json(['success' => false, 'message' => 'Blog not found'], 404);
        }

        // ✅ Thêm image_url
        $blog->image_url = $blog->image
            ? asset('storage/blogs/' . $blog->image)
            : null;

        return response()->json(['success' => true, 'data' => $blog]);
    }


    /**
     * Cập nhật blog
     */
    public function update(Request $request, $id)
    {
        $blog = Blog::find($id);
        if (!$blog) {
            return response()->json(['message' => 'Blog not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title'   => 'required|string|max:255|unique:blogs,title,' . $id,
            'content' => 'required|string|min:20',
            'status'  => 'required|boolean',
            'image'   => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $data = $request->except('image');

        // Xử lý upload ảnh
        if ($request->hasFile('image')) {
            // Xóa ảnh cũ nếu có
            if ($blog->image && Storage::disk('public')->exists('blogs/' . $blog->image)) {
                Storage::disk('public')->delete('blogs/' . $blog->image);
            }
            $path = $request->file('image')->store('blogs', 'public');
            $data['image'] = basename($path);
        } elseif ($request->boolean('remove_image')) {
            // Nếu có flag remove_image thì xóa ảnh
            if ($blog->image && Storage::disk('public')->exists('blogs/' . $blog->image)) {
                Storage::disk('public')->delete('blogs/' . $blog->image);
            }
            $data['image'] = null;
        }

        $blog->update($data);

        $blog->image_url = $blog->image ? asset('storage/blogs/' . $blog->image) : null;

        return response()->json([
            'message' => 'Blog updated successfully',
            'data'    => $blog
        ], 200);
    }


    /**
     * Xóa blog
     */
    public function destroy($id)
    {
        $blog = Blog::find($id);
        if (!$blog) {
            return response()->json([
                'success' => false,
                'message' => 'Blog not found'
            ], 404);
        }

        // Xoá ảnh trong storage nếu có
        if ($blog->image && Storage::disk('public')->exists('blogs/' . $blog->image)) {
            Storage::disk('public')->delete('blogs/' . $blog->image);
        }

        $blog->delete();

        return response()->json([
            'success' => true,
            'message' => 'Blog deleted successfully'
        ]);
    }

    /**
     * Check trùng tiêu đề blog
     */
    public function checkTitle(Request $request)
    {
        $title = $request->input('title'); // ✅ dùng title, khớp FE
        $id = $request->input('id');       // để edit thì bỏ qua chính nó

        $query = Blog::where('title', $title);
        if ($id) {
            $query->where('id', '!=', $id);
        }

        return response()->json([
            'success' => true,
            'exists'  => $query->exists() // true nếu đã tồn tại
        ]);
    }
}
