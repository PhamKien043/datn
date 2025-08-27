<!DOCTYPE html>
<html>
<head>
    <title>Đặt lại mật khẩu</title>
    <meta charset="utf-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f9f9f9;
            border-radius: 5px;
            padding: 20px;
            border: 1px solid #ddd;
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #ddd;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            text-align: center;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Đặt lại mật khẩu</h2>
        </div>

        <p>Xin chào,</p>

        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:</p>

        <div style="text-align: center;">
            <a href="{{ url('reset-password?token=' . $token) }}" class="button">Đặt lại mật khẩu</a>
        </div>

        <p>Hoặc bạn có thể sử dụng liên kết này:</p>
        <p>{{ env('FRONTEND_URL') . '/reset-password?token=' . $token }}</p>

        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>

        <p>Liên kết này sẽ hết hạn sau 60 phút.</p>

        <p>Trân trọng,<br>Đội ngũ CaterServ</p>

        <div class="footer">
            <p>© {{ date('Y') }} CaterServ. Tất cả các quyền được bảo lưu.</p>
        </div>
    </div>
</body>
</html>
