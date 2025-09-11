<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Order;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    // Lấy danh sách bình luận 
    public function index(Request $request)
    {
        $serviceId = $request->query('service_id');

        $query = Comment::with(['user', 'service'])
            ->orderBy('created_at', 'desc');

        if ($serviceId) {
            $query->where('service_id', $serviceId);
        }

        return response()->json([
            'success' => true,
            'message' => 'Danh sách bình luận',
            'data'    => $query->get(), 
        ]);
    }


    // Cập nhật trạng thái bình luận (0/1)
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:0,1',
        ]);

        $comment = Comment::find($id);
        if (!$comment) {
            return response()->json([
                'success' => false,
                'message' => 'Bình luận không tồn tại',
            ], 404);
        }

        $comment->status = (int) $request->status;
        $comment->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái thành công',
            'data' => $comment,
        ]);
    }


    // Gửi bình luận mới 
   public function store(Request $request)
{
    $request->validate([
        'content' => 'required|string',
        'user_id' => 'required|exists:users,id',
        'service_id' => 'required|exists:services,id',
        'rating' => 'required|integer|min:1|max:5',
    ]);

    // Kiểm tra có đơn completed chứa dịch vụ của user hay không
    $completedOrdersCount = Order::where('user_id', $request->user_id)
        ->where('status', 'completed')
        ->whereHas('details', function ($q) use ($request) {
            $q->where('service_id', $request->service_id);
        })
        ->count();

    if ($completedOrdersCount == 0) {
        return response()->json([
            'success' => false,
            'message' => 'Khách hàng cần đặt và thanh toán dịch vụ hoàn tất trước khi bình luận.',
        ], 403);
    }

    // Đếm số bình luận đã có của user cho service này
    $existingCommentsCount = Comment::where('user_id', $request->user_id)
        ->where('service_id', $request->service_id)
        ->count();

    if ($existingCommentsCount >= $completedOrdersCount) {
        return response()->json([
            'success' => false,
            'message' => 'Khách hàng đã gửi đủ số lượng bình luận tương ứng với số đơn đã thanh toán.',
        ], 403);
    }

    // Nếu hợp lệ thì lưu bình luận mới
    $comment = Comment::create([
        'content'    => $request->content,
        'user_id'    => $request->user_id,
        'service_id' => $request->service_id,
        'rating'     => (int) $request->rating,
        'status'     => 1, // tự duyệt luôn, hoặc chờ duyệt tuỳ app
    ]);

    $comment->load('user');

    return response()->json([
        'success' => true,
        'message' => 'Gửi bình luận thành công',
        'data' => $comment,
    ]);
}


public function update(Request $request, $id)
{
    $request->validate([
        'content' => 'required|string|max:1000',
        'rating' => 'required|integer|min:1|max:5',
        'user_id' => 'required|exists:users,id',
    ]);

    $comment = Comment::find($id);

    if (!$comment) {
        return response()->json([
            'success' => false,
            'message' => 'Không tìm thấy bình luận.',
        ], 404);
    }

    if ($comment->user_id != $request->user_id) {
        return response()->json([
            'success' => false,
            'message' => 'Bạn không có quyền chỉnh sửa bình luận này.',
        ], 403);
    }

    $comment->content = $request->content;
    $comment->rating = $request->rating;
    $comment->save();

    return response()->json([
        'success' => true,
        'message' => 'Cập nhật bình luận thành công.',
        'data' => $comment, // Laravel tự động có updated_at
    ]);
}



  public function destroy($id)
{
    $comment = Comment::find($id);
    if (!$comment) {
        return response()->json([
            'success' => false,
            'message' => 'Bình luận không tồn tại',
        ], 404);
    }

    $comment->delete();

    return response()->json([
        'success' => true,
        'message' => 'Xóa bình luận thành công',
    ]);
}
}