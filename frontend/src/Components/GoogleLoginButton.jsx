import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { loginWithGoogleToken, saveAuth, isAdmin } from "../services/authService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const GoogleLoginButton = () => {
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse?.credential;
      if (!idToken) {
        toast.error("Google chưa cấp ID token. Kiểm tra cấu hình origin trong Google Console.");
        return;
      }

      const res = await loginWithGoogleToken(idToken);
      if (!res?.success) throw new Error(res?.message || "Đăng nhập thất bại");

      saveAuth({ token: res.token, user: res.user });
      toast.success(res.message || "Đăng nhập thành công!");
      navigate(isAdmin(res.user) ? "/admin" : "/");
    } catch (e) {
      console.error("Google login error:", e);
      toast.error(e?.response?.data?.message || e.message || "Có lỗi xảy ra khi đăng nhập");
    }
  };

  return (
      <div className="google-login-wrapper" style={{ width: "100%" }}>
        <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Đăng nhập Google thất bại")}
            theme="outline"
            size="large"
            shape="rectangular"
        />
      </div>
  );
};

export default GoogleLoginButton;
