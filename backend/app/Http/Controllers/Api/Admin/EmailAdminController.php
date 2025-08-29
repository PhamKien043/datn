<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Email;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

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
    public function markAsRead()
    {
        Email::where('is_read', false)->update(['is_read' => true]);
        return response()->json(['message' => 'Tất cả email được đánh dấu là đã đọc']);
    }
}
