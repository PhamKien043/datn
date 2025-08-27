import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import GoogleLoginButton from "../../../Components/GoogleLoginButton";
import { register } from "../../../services/authService";
import "react-toastify/dist/ReactToastify.css";
import "./register.css";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.password_confirmation) {
      toast.error("Mật khẩu xác nhận không khớp!");
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData);

      if (result.success) {
        toast.success(result.message || "Đăng ký thành công! Vui lòng đăng nhập.");
        setTimeout(() => navigate("/login"), 1200);
      } else {
        toast.error(result.message || "Đăng ký thất bại");
      }
    } catch (error) {
      console.error("Register error:", error);
      toast.error(error?.response?.data?.message || "Có lỗi xảy ra khi đăng ký");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="register-wrapper">
        <div className="register-card card shadow p-4">
          <h3 className="text-center mb-4 text-primary">Đăng ký</h3>

          <div className="mb-3">
            <GoogleLoginButton />
          </div>

          <div className="divider mb-3">
            <span>HOẶC</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Họ và tên *</label>
              <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên của bạn"
                  required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Email *</label>
              <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập email"
                  required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Mật khẩu *</label>
              <input
                  type="password"
                  className="form-control"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                  minLength="6"
                  required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Xác nhận mật khẩu *</label>
              <input
                  type="password"
                  className="form-control"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                  minLength="6"
                  required
              />
            </div>

            <div className="mb-3 form-check">
              <input type="checkbox" className="form-check-input" id="acceptTerms" required />
              <label className="form-check-label" htmlFor="acceptTerms">
                Tôi đồng ý với <a href="#" className="text-primary">Điều khoản dịch vụ</a> và <a href="#" className="text-primary">Chính sách bảo mật</a>
              </label>
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </form>

          <div className="mt-3 text-center">
            <a href="/Login" className="text-decoration-none">Đã có tài khoản? Đăng nhập</a>
          </div>
        </div>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
  );
}

export default Register;
