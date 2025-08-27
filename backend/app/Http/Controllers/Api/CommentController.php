<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CommentRequest;
use App\Models\Comment;
use App\Models\Event;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CommentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $serviceId = $request->query('service_id');

        $query = Comment::with('user')->orderBy('created_at', 'desc');

        if ($serviceId) {
            $query->where('service_id', $serviceId)->where('status', 1);
        }

        $comments = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Danh sách bình luận',
            'data' => $comments
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'content' => 'required',
            'user_id' => 'required',
        ]);
        $data_comment = $request->all();
        try {
            $comment = Comment::create($data_comment);

            return response()->json([
                'success' => true,
                'message' => 'Bình luận thành công',
                'data' => $comment
            ], 200);
        } catch (QueryException $e) {
            if ($e->errorInfo[1] == 1452) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể bình luận',
                ], 400);
            }

            return response()->json([
                'success' => false,
                'message' => 'Bình luận thất bại do lỗi hệ thống',
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request)
    {
        $user_id = $request->user_id;
        $event_id = $request->event_id;

        $comment = Comment::where('user_id', $user_id)
            ->where('event_id', $event_id)
            ->first();

        if (!$comment) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy bình luận',
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
    public function update(Request $request, string $event_id)
    {
        $event = Event::find($event_id);
        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Sự kiện không tìm thấy'
            ], 404);
        }
        $data_update = $request->all();

        try {
            $comment = Comment::where('user_id', Auth::id())
                ->where('event_id', $event_id)
                ->update($data_update);
            return response()->json([
                'success' => true,
                'message' => 'Cập nhật bình luận thành công',
                'data' => $comment
            ], 201);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cập nhật bình luận thất bại do lỗi hệ thống'
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request)
    {
        $user_id = $request->user_id;
        $event_id = $request->event_id;

        $comment = Comment::where('user_id', $user_id)
            ->where('event_id', $event_id)
            ->first();

        if (!$comment) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy bình luận',
            ], 404);
        }

        try {
            $comment->delete();
            return response()->json([
                'success' => true,
                'message' => 'Xoá bình luận thành công',
            ], 200);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Xoá bình luận thất bại do lỗi hệ thống',
            ], 500);
        }
    }
}
