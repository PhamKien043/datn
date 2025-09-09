<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Phản hồi từ HAPPY EVENT</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #eef2f7; /* nền tổng thể nhạt */
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 650px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 25px;
            line-height: 1.6;
        }
        h2 {
            color: #007bff;
            margin-bottom: 15px;
            font-weight: 700;
        }
        p {
            font-weight: 600;
            color: #333;
        }
        ul {
            font-size: 15px;
            color: #333;
            padding-left: 18px;
            margin: 0;
            font-weight: 500;
        }
        li {
            margin-bottom: 8px;
        }
        .reply-box {
            padding: 14px;
            border-left: 4px solid #007bff;
            margin: 15px 0;
            font-weight: 500;
            color: #222;
            border-radius: 4px;
        }
        .footer {
            margin-top: 25px;
            font-size: 13px;
            color: #555;
            text-align: center;
            font-weight: 500;
        }
        .btn {
            display: inline-block;
            margin-top: 15px;
            padding: 12px 24px;
            background-color: #007bff;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>🎉 HAPPY EVENT xin chào {{ $email->name }} 🎉</h2>
        <p>Cảm ơn bạn đã liên hệ với chúng tôi. Dưới đây là thông tin bạn đã gửi:</p>

        <ul>
            <li><strong>Họ tên:</strong> {{ $email->name }}</li>
            <li><strong>Email:</strong> {{ $email->email }}</li>
            <li><strong>Số điện thoại:</strong> {{ $email->phone }}</li>
            <li><strong>Nội dung yêu cầu:</strong> {{ $email->message }}</li>
        </ul>

        <p><strong>Phản hồi từ quản trị viên:</strong></p>
        <div class="reply-box">
            {{ $replyMessage }}
        </div>

        <a href="http://localhost:5173/" class="btn">Truy cập HAPPY EVENT</a>

        <p style="margin-top:20px;">Thân mến!</p>
        <div class="footer">
            Lưu ý: Đây là email tự động. Vui lòng không phản hồi lại email này.
        </div>
    </div>
</body>
</html>
