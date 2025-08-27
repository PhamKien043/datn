import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { resetPassword } from "../../../services/authService";
import "react-toastify/dist/ReactToastify.css";
import "./resetPassword.css";

function ResetPassword() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password_confirmation: "",
    token: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get token from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get("token");
    
    if (token) {
      setFormData(prev => ({
        ...prev,
        token
      }));
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await resetPassword(
        formData.email,
        formData.token,
        formData.password,
        formData.password_confirmation
      );
      
      if (result.success) {
        setSuccess(true);
        toast.success(result.message || 'Mật khẩu đã được đặt lại thành công!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        toast.error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-wrapper">
      <div className="reset-password-card card shadow p-4">
        <h3 className="text-center mb-4 text-primary">Đặt lại mật khẩu</h3>
        
        {!success ? (
          <>
            <p className="text-center mb-4">
              Vui lòng nhập email và mật khẩu mới của bạn.
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập email của bạn" 
                  required 
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label">Mật khẩu mới</label>
                <input 
                  type="password" 
                  className="form-control" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu mới" 
                  required 
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label">Xác nhận mật khẩu</label>
                <input 
                  type="password" 
                  className="form-control" 
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder="Xác nhận mật khẩu mới" 
                  required 
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="alert alert-success mb-4">
              <p>Mật khẩu của bạn đã được đặt lại thành công!</p>
              <p>Bạn sẽ được chuyển hướng đến trang đăng nhập trong vài giây....</p>
            </div>
            <button 
              className="btn btn-outline-primary"
              onClick={() => navigate('/login')}
            >
              Đăng nhập ngay
            </button>
          </div>
        )}
        
        <div className="mt-3 text-center">
          <a href="/Login" className="text-decoration-none">Quay lại đăng nhập</a>
        </div>
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default ResetPassword;