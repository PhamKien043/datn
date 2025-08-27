<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;

class CommentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $page = $request->page ?? 10;
        $data = Comment::paginate($page);
        return response()->json([
            'success' => true,
            'message' => 'Danh sách bình luận',
            'data' => $data
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $event_id, string $user_id)
    {
        $comment = Comment::where('event_id', $event_id)
            ->where('user_id', $user_id)
            ->first();

        if (!$comment) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy bình luận'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Chi tiết bình luận',
            'data' => $comment
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'status' => 'required|in:1,0',
        ]);

        $comment = Comment::where('event_id', $id)->where('user_id', $request->user_id)->first();
        if (!$comment) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy bình luận'
            ], 404);
        }

        try {
            Comment::where('event_id', $id)
                ->where('user_id', $request->user_id)
                ->update(['status' => $request->status]);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật bình luận thành công',
                'data' => Comment::where('event_id', $id)->where('user_id', $request->user_id)->first()
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cập nhật bình luận thất bại do lỗi hệ thống',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id, int $event_id) {}
}
