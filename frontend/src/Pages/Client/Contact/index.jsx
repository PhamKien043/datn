import React, { useState } from 'react';
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch('http://localhost:4500/Contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (response.status === 200) {
          toast.success('Gửi email thành công!');
          setFormData({ name: '', email: '', phone: '', message: '' });
        } else {
          toast.error('Gửi email thất bại!');
        }
      })
      .catch(() => {
        toast.error('Không thể kết nối tới máy chủ!');
      });
  };


  return (
    <>
      <div
        className="modal fade"
        id="searchModal"
        tabIndex={-1}
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog custom-modal">
          <div className="modal-content rounded-0">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Tìm kiếm
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Đóng"
              />
            </div>
            <div className="modal-body d-flex align-items-center">
              <div className="input-group w-75 mx-auto d-flex">
                <input
                  type="search"
                  className="form-control bg-transparent p-4"
                  placeholder="Nhập từ khóa"
                  aria-describedby="search-icon-1"
                />
                <span id="search-icon-1" className="input-group-text p-3">
                  <i className="fa fa-search" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liên Hệ Bắt đầu */}
      <div
        className="container-fluid contact py-6 wow bounceInUp"
        data-wow-delay="0.1s"
        style={{ backgroundColor: '#f8f9fa' }}
      >
        <div className="container">
          <div className="p-5 bg-white rounded shadow contact-form">
            <div className="row g-5 align-items-center">
              <div className="col-12 text-center mb-4">
                <small className="d-inline-block fw-bold text-primary text-uppercase border border-primary rounded-pill px-4 py-1 mb-2">
                  Liên hệ với chúng tôi
                </small>
                <h1 className="display-5 fw-bold">Liên Hệ Với Chúng Tôi Để Giải Quyết Bất Kỳ Thắc Mắc!</h1>
              </div>
              <div className="col-md-6 col-lg-7">
                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    className="form-control mb-3 p-3 border-primary rounded"
                    placeholder="Tên Của Bạn"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                  <input
                    type="email"
                    className="form-control mb-3 p-3 border-primary rounded"
                    placeholder="Nhập Email Của Bạn"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  <input
                    type="text"
                    className="form-control mb-3 p-3 border-primary rounded"
                    placeholder="Số Điện Thoại Của Bạn"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />


                  <textarea
                    className="form-control mb-4 p-3 border-primary rounded"
                    rows={5}
                    placeholder="Tin Nhắn Của Bạn"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    className="btn btn-primary w-100 py-3 rounded-pill shadow-sm"
                    type="submit"
                    style={{ fontWeight: '600', fontSize: '1.1rem' }}
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
                      <p className="mb-0 text-secondary">A12 Phan Văn Trị - Phường Hạnh Thông - Tp. Hồ Chí Minh</p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center border border-primary p-4 rounded shadow-sm">
                    <i className="fas fa-envelope fa-2x text-primary me-3" />
                    <div>
                      <h5 className="mb-1 fw-bold">Gửi Email Cho Chúng Tôi</h5>
                      <p className="mb-1 text-secondary">happy000event@gmail.com</p>
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
      {/* Liên Hệ Kết thúc */}
    </>
  );
};

export default Contact;
