<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Models\Email;
use App\Http\Controllers\Controller;

class EmailController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string|max:20',
            'message' => 'required|string',
        ]);

        $email = Email::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'message' => $request->message,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lưu thông tin thành công!',
            'data' => $email
        ]);
    }
}

