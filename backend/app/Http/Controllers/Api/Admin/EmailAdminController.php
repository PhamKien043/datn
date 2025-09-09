<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ReplyToCustomerMail;
use App\Models\Email;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class EmailAdminController extends Controller
{
    /**
     * Danh sách tất cả email
     */
    public function index()
    {
        $emails = Email::orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $emails
        ]);
    }

    /**
     * Xem chi tiết blog
     */
    public function show($id)
    {
        $email = Email::find($id);
        if (!$email) {
            return response()->json(['success' => false, 'message' => 'Email not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $email]);
    }

    // Lấy số lượng email chưa đọc
    public function getUnreadCount()
    {
        $count = Email::where('is_read', false)->count();
        return response()->json(['count' => $count]);
    }

    // Đánh dấu tất cả email là đã đọc
    public function markRead($id)
    {
        $email = Email::find($id);

        if (!$email) {
            return response()->json([
                'success' => false,
                'message' => 'Email không tồn tại',
            ], 404);
        }

        $email->is_read = true;
        $email->save();

        return response()->json([
            'success' => true,
            'message' => 'Đã cập nhật trạng thái email',
        ]);
    }

    public function sendReply(Request $request, $id)
    {
        $request->validate([
            'reply_message' => 'required|string'
        ]);

        $email = Email::findOrFail($id);

        // Gửi email cho khách hàng
        try {
            Mail::raw($request->reply_message, function ($message) use ($email) {
                $message->to($email->email, $email->name)
                    ->subject('Phản hồi từ hệ thống quản lý sự kiện');
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể gửi email: ' . $e->getMessage()
            ], 500);
        }

        // Cập nhật trạng thái trong DB
        $email->is_read = true;
        $email->is_replied = true;
        $email->reply_message = $request->reply_message;
        $email->save();

        return response()->json($email);
    }

    // Phản hồi email
    public function reply(Request $request, $id)
    {
        $request->validate([
            'message' => 'required|string',
        ]);

        $email = Email::findOrFail($id);

        try {
            // Gửi mail cho khách
            Mail::to($email->email)->send(new ReplyToCustomerMail($email, $request->message));

            // ✅ Lưu vào DB
            $email->is_replied = true;
            $email->reply_message = $request->message;
            $email->is_read = true; // tự động đánh dấu đã đọc luôn
            $email->save();

            return response()->json([
                'success' => true,
                'message' => 'Phản hồi đã được gửi và lưu thành công!',
                'data' => $email
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi gửi email phản hồi: ' . $e->getMessage(),
            ], 500);
        }
    }
}
