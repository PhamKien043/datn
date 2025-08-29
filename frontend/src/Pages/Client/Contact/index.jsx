import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { sendContact } from "../../../services/emailClient"; // import service

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // ✅ Kiểm tra tên
    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập tên của bạn";
    } else {
      // Regex: chỉ cho chữ cái, dấu tiếng Việt, khoảng trắng
      const nameRegex = /^[\p{L}\s]+$/u;
      if (!nameRegex.test(formData.name.trim())) {
        newErrors.name = "Tên của bạn không hợp lệ";
      }
    }

    // ✅ Email
    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Email không hợp lệ";
      }
    }

    // ✅ Phone
    if (!formData.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    } else {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "Số điện thoại không hợp lệ (VD: 0981234567)";
      }
    }

    // ✅ Message
    if (!formData.message.trim()) {
      newErrors.message = "Vui lòng nhập nội dung tin nhắn";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors({
      ...errors,
      [e.target.name]: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await sendContact(formData);
      toast.success("Gửi email thành công!");
      setFormData({ name: "", email: "", phone: "", message: "" });
      setErrors({});
    } catch (error) {
      toast.error(error.message || "Gửi email thất bại!");
    }
  };

  return (
    <>
      <div
        className="container-fluid contact py-6 wow bounceInUp"
        data-wow-delay="0.1s"
      >
        <div className="container">
          <div className="p-5 bg-white rounded shadow contact-form">
            <div className="row g-5 align-items-center">
              <div className="col-12 text-center mb-4">
                <small className="d-inline-block fw-bold text-primary text-uppercase border border-primary rounded-pill px-4 py-1 mb-2">
                  Liên hệ với chúng tôi
                </small>
                <h1 className="display-5 fw-bold">
                  Liên Hệ Với Chúng Tôi Để Giải Quyết Bất Kỳ Thắc Mắc!
                </h1>
              </div>
              <div className="col-md-6 col-lg-7">
                <form onSubmit={handleSubmit}>
                  {/* Name */}
                  <input
                    type="text"
                    className={`form-control mb-1 p-3 border-primary rounded ${
                      errors.name ? "is-invalid" : ""
                    }`}
                    placeholder="Tên Của Bạn"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                  {errors.name && (
                    <small className="text-danger">{errors.name}</small>
                  )}
                  <br />

                  {/* Email */}
                  <input
                    type="email"
                    className={`form-control mb-1 p-3 border-primary rounded ${
                      errors.email ? "is-invalid" : ""
                    }`}
                    placeholder="Nhập Email Của Bạn"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {errors.email && (
                    <small className="text-danger">{errors.email}</small>
                  )}
                  <br />

                  {/* Phone */}
                  <input
                    type="text"
                    className={`form-control mb-1 p-3 border-primary rounded ${
                      errors.phone ? "is-invalid" : ""
                    }`}
                    placeholder="Số Điện Thoại Của Bạn"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                  {errors.phone && (
                    <small className="text-danger">{errors.phone}</small>
                  )}
                  <br />

                  {/* Message */}
                  <textarea
                    className={`form-control mb-1 p-3 border-primary rounded ${
                      errors.message ? "is-invalid" : ""
                    }`}
                    rows={5}
                    placeholder="Tin Nhắn Của Bạn"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                  />
                  {errors.message && (
                    <small className="text-danger">{errors.message}</small>
                  )}
                  <br />

                  <button
                    className="btn btn-primary w-100 py-3 rounded-pill shadow-sm"
                    type="submit"
                  >
                    Gửi Ngay
                  </button>
                </form>
              </div>
              <div className="col-md-6 col-lg-5">
                <div className="d-flex flex-column gap-4">
                  <div className="d-flex align-items-center border border-primary p-4 rounded shadow-sm">
                    <i className="fas fa-map-marker-alt fa-2x text-primary me-3" />
                    <div>
                      <h5 className="mb-1 fw-bold">Địa Chỉ</h5>
                      <p className="mb-0 text-secondary">
                        A12 Phan Văn Trị - Phường Hạnh Thông - Tp. Hồ Chí Minh
                      </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center border border-primary p-4 rounded shadow-sm">
                    <i className="fas fa-envelope fa-2x text-primary me-3" />
                    <div>
                      <h5 className="mb-1 fw-bold">Gửi Email Cho Chúng Tôi</h5>
                      <p className="mb-1 text-secondary">
                        happy000event@gmail.com
                      </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center border border-primary p-4 rounded shadow-sm">
                    <i className="fa fa-phone-alt fa-2x text-primary me-3" />
                    <div>
                      <h5 className="mb-1 fw-bold">Điện Thoại</h5>
                      <p className="mb-1 text-secondary">0986256445</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </>
  );
}

export default Contact;
