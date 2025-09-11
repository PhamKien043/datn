import React, { useState, useEffect } from "react";
import axios from "../../../services/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";

/** Map hiển thị trạng thái */
const STATUS_META = {
  pending: { text: "Chờ xác nhận", badge: "warning" },
  deposit_paid: { text: "Đã đặt cọc 30%", badge: "info" },
  confirmed: { text: "Đã xác nhận & chờ thực hiện", badge: "primary" },
  awaiting_balance: { text: "Chờ thanh toán 70%", badge: "warning" },
  completed: { text: "Dịch vụ hoàn tất", badge: "success" },
  failed: { text: "Thanh toán thất bại", badge: "danger" },
  cancelled: { text: "Đã hủy", badge: "secondary" },
  cancel_requested: { text: "Chờ xác nhận hủy", badge: "warning" },
  refund_processing: { text: "Đang xử lý hoàn tiền", badge: "info" },
  cancelled_confirmed: { text: "Hủy đơn thành công", badge: "success" },
};

const LEGACY_TO_STRING = {
  1: "pending",
  2: "confirmed",
  3: "awaiting_balance",
  4: "completed",
  5: "cancelled",
};

const ALLOWED_STATUSES = Object.keys(STATUS_META);

const getNextStatus = (current) => {
  switch (current) {
    case "pending":
      return "deposit_paid";
    case "deposit_paid":
      return "confirmed";
    case "confirmed":
      return "awaiting_balance";
    case "awaiting_balance":
      return "completed";
    default:
      return null;
  }
};

const OrderDetailAdmin = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`admin/orders/${orderId}`);
      if (response.data?.success) {
        setOrder(response.data.data);
      } else {
        toast.error(response.data?.message || "Không thể tải chi tiết đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết đơn hàng:", error.response || error);
      toast.error(`Không thể tải chi tiết đơn hàng: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatusStr) => {
    if (!ALLOWED_STATUSES.includes(newStatusStr)) {
      toast.error("Trạng thái không hợp lệ");
      return;
    }
    try {
      setUpdating(true);
      const response = await axios.put(`/admin/orders/${orderId}`, {
        status: newStatusStr,
      });
      if (response.data?.success) {
        setOrder(response.data.data);
        toast.success("Cập nhật trạng thái đơn hàng thành công");
      } else {
        toast.error(response.data?.message || "Không thể cập nhật trạng thái đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error.response || error);
      toast.error(`Không thể cập nhật trạng thái đơn hàng: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount || 0));

  const getStatusString = (o) => {
    if (o?.status) return String(o.status).toLowerCase();
    if (o?.order_status != null) return LEGACY_TO_STRING[o.order_status] || "pending";
    return "pending";
  };

  if (loading) {
    return (
      <div className="container-fluid text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-fluid">
        <h1 className="h3 mb-2 text-gray-800">Chi tiết đơn hàng</h1>
        <div className="alert alert-danger">Không tìm thấy đơn hàng</div>
      </div>
    );
  }

  // ====== TÍNH TOÁN ======
  const statusStr = getStatusString(order);
  const badge = STATUS_META[statusStr]?.badge || "secondary";
  const statusText = STATUS_META[statusStr]?.text || "Không xác định";

  const total = Number(order.total || 0);
  const deposit = order.deposit_amount != null ? Number(order.deposit_amount) : Math.round(total * 0.3);
  const rawBalance = order.balance_amount != null ? Number(order.balance_amount) : Math.max(0, total - deposit);

  const displayBalance = ["completed", "cancelled_confirmed", "refund_processing"].includes(statusStr)
    ? 0
    : rawBalance;

  const voucherTitle = order.voucher?.title || null;
  const voucherDiscount = Number(order.voucher?.discount_amount || 0);

  // Lấy withdraw_request (nếu có)
  const withdraw = order.withdraw_request;

  return (
    <>
      <div className="container-fluid">
        <h1 className="h3 mb-2 text-gray-800">Chi tiết đơn hàng #{order.id}</h1>
        <p className="mb-4">Thông tin chi tiết về đơn hàng của khách hàng</p>

        <div className="card shadow mb-4">
          <div className="card-header py-3 d-flex align-items-center justify-content-between">
            <h6 className="m-0 font-weight-bold text-primary">Thông tin đơn hàng</h6>
            <span className={`badge bg-${badge}`}>{statusText}</span>
          </div>

          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h5>Thông tin khách hàng</h5>
                <p><strong>Tên:</strong> {order.name}</p>
                <p><strong>Số điện thoại:</strong> {order.phone}</p>
                <p><strong>Mã đơn hàng:</strong> #{order.id}</p>

                {/* Mã giao dịch & Ghi chú từ withdraw_requests */}
                {withdraw && (
                  <>
                    <p><strong>Mã giao dịch:</strong> {withdraw.transaction_id || "Chưa có"}</p>
                    <p><strong>Ghi chú:</strong> {withdraw.note || "Không có"}</p>
                  </>
                )}
              </div>

              <div className="col-md-6">
                <h5>Thông tin thanh toán</h5>
                <p><strong>Ngày đặt:</strong> {formatDate(order.createdAt)}</p>
                <p><strong>Phương thức thanh toán:</strong> {order.method || "N/A"}</p>
                <p><strong>Tổng tiền:</strong> {formatCurrency(total)}</p>
                <p>
                  <strong>Voucher áp dụng:</strong>{" "}
                  {voucherTitle
                    ? `${voucherTitle}${voucherDiscount ? ` (-${formatCurrency(voucherDiscount)})` : ""}`
                    : "Không sử dụng"}
                </p>
                <p><strong>Đã thanh toán trước (30%):</strong> {formatCurrency(deposit)}</p>
                <p><strong>Số tiền còn lại:</strong> {formatCurrency(displayBalance)}</p>
              </div>
            </div>

            <h5 className="mt-4">Chi tiết sản phẩm</h5>
            <div className="table-responsive">
              <table className="table table-bordered" width="100%" cellSpacing="0">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Loại</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  {order.OrderDetails?.map((detail) => (
                    <tr key={detail.id}>
                      <td>{detail.Product?.name || "N/A"}</td>
                      <td>{detail.Product?.type || "N/A"}</td>
                      <td>{detail.quantity}</td>
                      <td>{formatCurrency(detail.price)}</td>
                      <td>{formatCurrency(detail.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer position="bottom-right" />
      
    </>
  );
};

export default OrderDetailAdmin;
