import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { forgotPassword } from "../../../services/authService";
import "react-toastify/dist/ReactToastify.css";
import "./forgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        setSubmitted(true);
        toast.success(result.message || 'Yêu cầu đặt lại mật khẩu đã được gửi!');
      } else {
        toast.error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-wrapper">
      <div className="forgot-password-card card shadow p-4">
        <h3 className="text-center mb-4 text-primary">Quên mật khẩu</h3>
        
        {!submitted ? (
          <>
            <p className="text-center mb-4">
              Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn liên kết để đặt lại mật khẩu.
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={email}
                  onChange={handleChange}
                  placeholder="Nhập email của bạn" 
                  required 
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="alert alert-success mb-4">
              <p>Chúng tôi đã gửi email với hướng dẫn đặt lại mật khẩu đến địa chỉ email của bạn.</p>
              <p>Vui lòng kiểm tra hộp thư đến của bạn và làm theo hướng dẫn.</p>
            </div>
            <button 
              className="btn btn-outline-primary"
              onClick={() => navigate('/login')}
            >
              Quay lại đăng nhập
            </button>
          </div>
        )}
        
        <div className="mt-3 text-center">
          <Link to="/login" className="text-decoration-none">Quay lại đăng nhập</Link>
        </div>
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default ForgotPassword;