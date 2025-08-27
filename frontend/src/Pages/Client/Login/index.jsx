// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { toast, ToastContainer } from "react-toastify";
// import GoogleLoginButton from "../../../Components/GoogleLoginButton";
// import { login, saveAuth, isAdmin, fetchMe } from "../../../services/authService";
// import "react-toastify/dist/ReactToastify.css";
// import "./login.css";
//
// function Login() {
//   const [formData, setFormData] = useState({ email: "", password: "", rememberMe: false });
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();
//
//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
//   };
//
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const res = await login(formData.email, formData.password); // { success, token, user, message }
//       if (!res?.success) throw new Error(res?.message || "Đăng nhập thất bại");
//
//       // Nếu BE chưa trả user thì fallback gọi /auth/user
//       const user = res.user || (await fetchMe())?.user || null;
//       saveAuth({ token: res.token, user });
//
//       toast.success(res.message || "Đăng nhập thành công!");
//       navigate(isAdmin(user) ? "/admin" : "/");
//     } catch (err) {
//       console.error("Login error:", err);
//       toast.error(err?.response?.data?.message || err?.message || "Email hoặc mật khẩu không chính xác");
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   return (
//       <div className="login-wrapper">
//         <div className="login-card card shadow p-4">
//           <h3 className="text-center mb-4 text-primary">Đăng nhập</h3>
//
//           <div className="mb-3">
//             <GoogleLoginButton />
//           </div>
//
//           <div className="divider mb-3"><span>HOẶC</span></div>
//
//           <form onSubmit={handleSubmit}>
//             <div className="mb-3">
//               <label className="form-label">Email</label>
//               <input type="email" className="form-control" name="email"
//                      value={formData.email} onChange={handleChange} placeholder="Nhập email" required />
//             </div>
//             <div className="mb-3">
//               <label className="form-label">Mật khẩu</label>
//               <input type="password" className="form-control" name="password"
//                      value={formData.password} onChange={handleChange} placeholder="Nhập mật khẩu của bạn" required />
//             </div>
//             <div className="mb-3 form-check">
//               <input type="checkbox" className="form-check-input" id="rememberMe" name="rememberMe"
//                      checked={formData.rememberMe} onChange={handleChange} />
//               <label className="form-check-label" htmlFor="rememberMe">Ghi nhớ đăng nhập</label>
//             </div>
//             <button type="submit" className="btn btn-primary w-100" disabled={loading}>
//               {loading ? "Đang đăng nhập..." : "Đăng nhập"}
//             </button>
//           </form>
//
//           <div className="mt-3 text-center">
//             <Link to="/forgot-password" className="text-decoration-none me-3">Quên mật khẩu?</Link>
//             <Link to="/register" className="text-decoration-none">Đăng Ký</Link>
//           </div>
//         </div>
//
//         <ToastContainer position="top-right" autoClose={3000} />
//       </div>
//   );
// }
//
// export default Login;

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import GoogleLoginButton from "../../../Components/GoogleLoginButton";
import { login, saveAuth, clearAuth, getUser } from "../../../services/authService";
import { getUserById } from "../../../services/userService";
import "react-toastify/dist/ReactToastify.css";
import "./login.css";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "", rememberMe: false });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Gọi API login
      const res = await login(formData.email, formData.password);
      if (!res?.success) throw new Error(res?.message || "Đăng nhập thất bại");

      // Lấy user đầy đủ từ backend
      let userData = res.user;
      if (userData?.id) {
        const userRes = await getUserById(userData.id);
        if (userRes.success) userData = userRes.data.data;
      }

      // Kiểm tra trạng thái
      if (userData.status === 0) {
        toast.error("Tài khoản của bạn đã bị khóa!");
        clearAuth(); // xóa token/user
        setLoading(false);
        return;
      }

      // Lưu token và user
      saveAuth({ token: res.token, user: userData });

      // Điều hướng dựa trên role
      toast.success("Đăng nhập thành công!");
      if (userData.role === 0) {
        navigate("/admin"); // admin
      } else {
        navigate("/"); // user bình thường
      }

    } catch (err) {
      console.error("Login error:", err);
      toast.error(err?.response?.data?.message || err?.message || "Email hoặc mật khẩu không chính xác");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="login-wrapper">
        <div className="login-card card shadow p-4">
          <h3 className="text-center mb-4 text-primary">Đăng nhập</h3>

          <div className="mb-3">
            <GoogleLoginButton />
          </div>

          <div className="divider mb-3"><span>HOẶC</span></div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
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
              <label className="form-label">Mật khẩu</label>
              <input
                  type="password"
                  className="form-control"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu của bạn"
                  required
              />
            </div>

            <div className="mb-3 form-check">
              <input
                  type="checkbox"
                  className="form-check-input"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="rememberMe">Ghi nhớ đăng nhập</label>
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="mt-3 text-center">
            <Link to="/forgot-password" className="text-decoration-none me-3">Quên mật khẩu?</Link>
            <Link to="/register" className="text-decoration-none">Đăng Ký</Link>
          </div>
        </div>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
  );
}

export default Login;
