# Hướng dẫn cấu hình Google OAuth

## 1. Tạo file .env trong thư mục frontend

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
VITE_FRONTEND_URL=http://localhost:5173
```

## 2. Tạo file .env trong thư mục backend

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_database_username
DB_PASSWORD=your_database_password

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URL=http://127.0.0.1:8000/api/auth/google/callback

FRONTEND_URL=http://localhost:5173
```

## 3. Lấy Google Client ID và Secret

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo hoặc chọn một project
3. Vào "APIs & Services" > "Credentials"
4. Tạo "OAuth 2.0 Client IDs"
5. Chọn "Web application"
6. Thêm authorized origins:
   - http://localhost:5173
   - http://127.0.0.1:8000
7. Thêm authorized redirect URIs:
   - http://127.0.0.1:8000/api/auth/google/callback
8. Copy Client ID và Client Secret vào file .env

## 4. Chạy ứng dụng

### Backend:
```bash
cd backend
php artisan serve
```

### Frontend:
```bash
cd frontend  
npm run dev
```

## 5. Test chức năng

- Truy cập http://localhost:5173/Login
- Click nút "Sign in with Google"
- Hoàn thành OAuth flow
- Kiểm tra user được tạo trong database 