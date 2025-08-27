import React, { useState, useEffect } from "react";
import axios from "../../../services/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const DEBOUNCE_MS = 350;

/** Map hiển thị trạng thái */
const STATUS_META = {
  pending:          { text: "Chờ xác nhận",                badge: "warning"  },
  deposit_paid:     { text: "Đã đặt cọc 30%",               badge: "info"     },
  confirmed:        { text: "Đã xác nhận & chờ thực hiện",  badge: "primary"  },
  awaiting_balance: { text: "Chờ thanh toán 70%",           badge: "warning"  },
  completed:        { text: "Dịch vụ hoàn tất",             badge: "success"  },
  failed:           { text: "Thanh toán thất bại",          badge: "danger"   },
  cancelled:        { text: "Đã hủy",                       badge: "secondary"},
};

/** Suy ra status string từ payload (hỗ trợ legacy order_status = 1|2) */
const getStringStatus = (order) => {
  if (order?.status) return String(order.status).toLowerCase();
  if (order?.order_status === 1) return "pending";
  if (order?.order_status === 2) return "confirmed";
  return "pending";
};

/** Tính trạng thái kế tiếp theo yêu cầu */
const getNextStatus = (current) => {
  switch (current) {
    case "pending":          return "deposit_paid";
    case "deposit_paid":     return "confirmed";
    case "confirmed":        return "awaiting_balance";
    case "awaiting_balance": return "completed";
    default:                 return null; // completed/failed/cancelled
  }
};

/** Nhãn của nút hành động theo trạng thái hiện tại */
const getNextActionText = (current) => {
  switch (current) {
    case "pending":          return "Xác nhận đặt cọc 30%";
    case "deposit_paid":     return "Xác nhận & chờ thực hiện";
    case "confirmed":        return "Chuyển sang chờ thanh toán 70%";
    case "awaiting_balance": return "Hoàn tất dịch vụ";
    default:                 return null;
  }
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // string status

  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);

  // Gọi API (hủy request cũ khi có request mới)
  const fetchOrders = async ({ signal } = {}) => {
    try {
      setLoading(true);
      const res = await axios.get("admin/orders", {
        params: {
          search: searchTerm?.trim() || undefined,
          status: statusFilter || undefined, // string status
        },
        signal,
      });
      if (res.data?.success) {
        setOrders(res.data.data || []);
      } else {
        toast.error(res.data?.message || "Không thể tải danh sách đơn hàng");
      }
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.message !== "canceled") {
        console.error("Error fetching orders:", err);
        toast.error("Không thể tải danh sách đơn hàng");
      }
    } finally {
      setLoading(false);
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders({ signal: controller.signal });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => {
      fetchOrders({ signal: controller.signal });
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  /** Ấn xác nhận: chuyển 1 bước & PUT { status: next } */
  const advanceStatus = async (order) => {
    const current = getStringStatus(order);
    const next = getNextStatus(current);

    if (!next) {
      toast.info("Đơn đã hoàn tất/đã hủy hoặc không thể chuyển tiếp.");
      return;
    }

    try {
      await axios.put(`admin/orders/${order.id}`, { status: next });
      setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, status: next, order_status: undefined } : o))
      );
      toast.success(`Đã chuyển trạng thái: ${STATUS_META[next]?.text || next}`);
    } catch (error) {
      console.error("Error advancing order status:", error);
      const msg = error?.response?.data?.message || "Không thể cập nhật trạng thái.";
      toast.error(msg);
    }
  };

  // Phân trang client
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleDateString("vi-VN", options);
  };

  const formatCurrency = (amount) =>
      new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

  const handleRefresh = () => {
    setSearchTerm("");
    setStatusFilter("");
  };

  return (
      <>
        <div className="container-fluid">
          <h1 className="h3 mb-2 text-gray-800">Quản lý đơn hàng</h1>
          <p className="mb-4">Xem và quản lý tất cả đơn hàng của khách hàng</p>

          <div className="row mb-3">
            <div className="col-md-4">
              <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm theo tên, SĐT, mã đơn hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="deposit_paid">Đã đặt cọc 30%</option>
                <option value="confirmed">Đã xác nhận &amp; chờ thực hiện</option>
                <option value="awaiting_balance">Chờ thanh toán 70%</option>
                <option value="completed">Dịch vụ hoàn tất</option>
                <option value="failed">Thanh toán thất bại</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            <div className="col-md-2">
              <button className="btn btn-outline-secondary w-100" onClick={handleRefresh}>
                Làm mới
              </button>
            </div>
          </div>

          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Danh sách đơn hàng</h6>
            </div>
            <div className="card-body">
              {loading ? (
                  <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                  </div>
              ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-bordered" width="100%" cellSpacing="0">
                        <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Khách hàng</th>
                          <th>Liên hệ</th>
                          <th>Tổng tiền</th>
                          <th>Ngày đặt</th>
                          <th>Trạng thái</th>
                          <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {currentOrders.length > 0 ? (
                            currentOrders.map((order) => {
                              const statusStr = getStringStatus(order);
                              const meta = STATUS_META[statusStr] || { text: "Không xác định", badge: "secondary" };
                              const nextText = getNextActionText(statusStr);

                              return (
                                  <tr key={order.id}>
                                    <td>#{order.id}</td>
                                    <td>{order.name}</td>
                                    <td>{order.phone}</td>
                                    <td>{formatCurrency(order.total)}</td>
                                    <td>{formatDate(order.createdAt)}</td>
                                    <td>
                                      <span className={`badge bg-${meta.badge}`}>{meta.text}</span>
                                    </td>
                                    <td>
                                      {nextText && (
                                          <button
                                              className="btn btn-success btn-sm me-1 mb-1"
                                              onClick={() => advanceStatus(order)}
                                          >
                                            <i className="fas fa-check"></i> {nextText}
                                          </button>
                                      )}
                                      <button
                                          className="btn btn-info btn-sm me-1 mb-1"
                                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                                      >
                                        <i className="fas fa-eye"></i> Chi tiết
                                      </button>
                                    </td>
                                  </tr>
                              );
                            })
                        ) : (
                            <tr>
                              <td colSpan="8" className="text-center">
                                Không có đơn hàng nào
                              </td>
                            </tr>
                        )}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                        <nav aria-label="Page navigation">
                          <ul className="pagination justify-content-center">
                            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                              <button
                                  className="page-link"
                                  onClick={() => setCurrentPage(currentPage - 1)}
                                  disabled={currentPage === 1}
                              >
                                Trước
                              </button>
                            </li>
                            {[...Array(totalPages).keys()].map((number) => (
                                <li
                                    key={number + 1}
                                    className={`page-item ${currentPage === number + 1 ? "active" : ""}`}
                                >
                                  <button className="page-link" onClick={() => setCurrentPage(number + 1)}>
                                    {number + 1}
                                  </button>
                                </li>
                            ))}
                            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                              <button
                                  className="page-link"
                                  onClick={() => setCurrentPage(currentPage + 1)}
                                  disabled={currentPage === totalPages}
                              >
                                Sau
                              </button>
                            </li>
                          </ul>
                        </nav>
                    )}
                  </>
              )}
            </div>
          </div>
        </div>

        <ToastContainer position="bottom-right" />
      </>
  );
};

export default OrderHistory;
