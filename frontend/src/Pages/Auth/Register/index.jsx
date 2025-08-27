import React from "react";
import "./register.css"

function Register(){
 return(
    <div className="register-wrapper">
    <div className="register-card card shadow p-4">
      <h3 className="text-center mb-4 text-success">Đăng ký</h3>
      <form>
        <div className="mb-3">
          <label className="form-label">Họ và tên</label>
          <input type="text" className="form-control" placeholder="Nhập họ và tên" required />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input type="email" className="form-control" placeholder="Nhập email" required />
        </div>
        <div className="mb-3">
          <label className="form-label">Mật khẩu</label>
          <input type="password" className="form-control" placeholder="Nhập mật khẩu" required />
        </div>
        <div className="mb-3">
          <label className="form-label">Xác nhận mật khẩu</label>
          <input type="password" className="form-control" placeholder="Nhập lại mật khẩu" required />
        </div>
        <button type="submit" className="btn btn-primary w-100">Đăng ký</button>
      </form>
      <div className="mt-3 text-center">
        <a href="/Login" className="text-decoration-none">Đã có tài khoản? Đăng nhập</a>
      </div>
    </div>
  </div>
 )
}

export default Register;