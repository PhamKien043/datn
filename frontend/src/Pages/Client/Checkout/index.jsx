import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Checkout = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
    paymentMethod: "cod",
  });

  // ❌ Không dùng context, dùng dữ liệu mẫu (mock)
  const cartItems = [
    {
      id: 1,
      name: "Táo Mỹ",
      quantity: 2,
      price: 35000,
      discount_price: 30000,
    },
    {
      id: 2,
      name: "Cam Úc",
      quantity: 1,
      price: 40000,
    },
  ];

  const getSubTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + item.quantity * (item.discount_price || item.price),
      0
    );
  };

  const getTotal = () => {
    return getSubTotal() + 20000; // + phí ship
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Thông tin hợp lệ. Gửi đơn hàng (giả lập) thành công!");
  };

  return (
    <div className="container-fluid py-5">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-md-7">
            <div className="bg-light rounded p-4">
              <h4 className="mb-4">Thông tin đặt hàng</h4>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Họ và tên *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Số điện thoại *</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Địa chỉ *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Ghi chú</label>
                  <textarea
                    className="form-control"
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phương thức thanh toán</label>
                  <select
                    className="form-select"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                  >
                    <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                    <option value="bank">Chuyển khoản ngân hàng</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Đặt hàng
                </button>
              </form>
            </div>
          </div>

     <div className="col-md-5">
  <div className="bg-light rounded p-4">
    <h4 className="mb-4">Thông tin sự kiện</h4>

    <div className="mb-3">
      <strong>Loại sự kiện:</strong> Tiệc Sinh Nhật
    </div>

    <div className="mb-3">
      <div className="d-flex justify-content-between">
        <span>Tiền loại bàn 10 người:</span>
        <span>50,000đ x 5</span>
      </div>
      <div className="d-flex justify-content-between">
        <span>Tiền loại bàn 6 người:</span>
        <span>40,000đ x 10</span>
      </div>
    </div>

    <div className="d-flex justify-content-between mb-3">
      <span>Tiền Trang trí:</span>
      <span>500,000đ</span>
    </div>

    <div className="d-flex justify-content-between mb-3">
      <span>Tiền món ăn:</span>
      <span>1,000,000đ</span>
    </div>

    <div className="mb-3">
      <strong>Ghi chú:</strong>
      <div className="text-muted fst-italic">Tổ chức ngoài trời, phong cách cổ điển</div>
    </div>

    <div className="border-top pt-3">
      <div className="d-flex justify-content-between mb-2">
        <strong>Tổng tiền:</strong>
        <strong>2,000,143đ</strong>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Thanh toán đặt cọc:</span>
        <span>1,341,444đ</span>
      </div>
      <div className="text-muted fst-italic mt-2">
        Bạn cần thanh toán đặt cọc tối thiểu <strong>30%</strong> hoặc <strong>toàn bộ</strong>.
      </div>
    </div>
  </div>
</div>


        </div>
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Checkout;
