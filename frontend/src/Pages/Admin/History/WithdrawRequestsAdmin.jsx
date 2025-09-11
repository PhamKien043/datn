// src/pages/admin/orders/WithdrawRequestsAdmin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // 👉 thêm
import axios from "../../../services/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const STATUS_META = {
  pending: { text: "Chờ xác nhận", badge: "warning" },
  deposit_paid: { text: "Đã đặt cọc 30%", badge: "info" },
  confirmed: { text: "chuyển tiền thành công ", badge: "primary" },
  awaiting_balance: { text: "Chờ thanh toán 70%", badge: "warning" },
  completed: { text: "Dịch vụ hoàn tất", badge: "success" },
  failed: { text: "Thanh toán thất bại", badge: "danger" },
  cancelled: { text: "Đã hủy", badge: "secondary" },
  cancel_requested: { text: "Chờ xác nhận hủy", badge: "warning" },
  refund_processing: { text: "Đang xử lý hoàn tiền", badge: "info" },
  cancelled_confirmed: { text: "Hủy đơn thành công", badge: "success" },
};

const WithdrawRequestsAdmin = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // 👉 dùng để điều hướng

  useEffect(() => {
    fetchWithdrawRequests();
  }, []);

  // Lấy danh sách yêu cầu rút tiền
  const fetchWithdrawRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/withdraw-requests");
      if (res.data?.success) {
        setRequests(res.data.data);
      } else {
        toast.error(res.data?.message || "Không thể tải danh sách yêu cầu rút tiền");
      }
    } catch (error) {
      console.error("Lỗi khi tải withdraw_requests:", error.response || error);
      toast.error("Không thể tải dữ liệu rút tiền");
    } finally {
      setLoading(false);
    }
  };

  // Định dạng ngày giờ
  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("vi-VN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  // Định dạng tiền tệ
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(amount || 0));

  if (loading) {
    return (
      <div className="container-fluid text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-2 text-gray-800">Danh sách yêu cầu rút tiền</h1>
          <p className="mb-0">Quản lý tất cả yêu cầu rút tiền từ khách hàng</p>
        </div>
        {/* 👉 Nút quay lại */}
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/admin/history")}
        >
          ← Quay lại
        </button>
      </div>

      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">
            Danh sách yêu cầu rút tiền
          </h6>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered" width="100%" cellSpacing="0">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Khách hàng</th>
                  <th>Đơn hàng</th>
                  <th>Mã giao dịch</th>
                  <th>Ngân hàng</th>
                  <th>Số tài khoản</th>
                  <th>Chủ tài khoản</th>
                  <th>Số tiền</th>
                  <th>Ghi chú</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {requests.length > 0 ? (
                  requests.map((req, index) => {
                    const badge = STATUS_META[req.status]?.badge || "secondary";
                    const statusText = STATUS_META[req.status]?.text || req.status;
                    return (
                      <tr key={req.id}>
                        <td>{index + 1}</td>
                        <td>{req.user?.name || "N/A"}</td>
                        <td>#{req.order_id}</td>
                        <td>{req.transaction_id || "Chưa có"}</td>
                        <td>{req.bank_name}</td>
                        <td>{req.account_number}</td>
                        <td>{req.account_holder_name}</td>
                        <td>{formatCurrency(req.amount)}</td>
                        <td>{req.note || "Không có"}</td>
                        <td>
                          <span className={`badge bg-${badge}`}>{statusText}</span>
                        </td>
                        <td>{formatDate(req.created_at)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center">
                      Không có yêu cầu rút tiền nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default WithdrawRequestsAdmin;
