import React, { useState, useEffect, useRef } from "react";
import axios from "../../../services/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const DEBOUNCE_MS = 350;

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
    case "pending": return "deposit_paid";
    case "deposit_paid": return "confirmed";
    case "confirmed": return "awaiting_balance";
    case "awaiting_balance": return "completed";
    default: return null; // completed/failed/cancelled
  }
};

/** Nhãn của nút hành động theo trạng thái hiện tại */
const getNextActionText = (current) => {
  switch (current) {
    case "pending": return "Xác nhận đặt cọc 30%";
    case "deposit_paid": return "Xác nhận & chờ thực hiện";
    case "confirmed": return "Chuyển sang chờ thanh toán 70%";
    case "awaiting_balance": return "Hoàn tất dịch vụ";
    default: return null;
  }
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelRequests, setCancelRequests] = useState([]);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [refundInfo, setRefundInfo] = useState({
    transaction_id: '',
    note: ''
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  
  const abortControllerRef = useRef(null);

  // Gọi API đơn hàng
  const fetchOrders = async ({ signal } = {}) => {
    try {
      setLoading(true);
      const res = await axios.get("admin/orders", {
        params: {
          search: searchTerm?.trim() || undefined,
          status: statusFilter || undefined,
        },
        signal,
      });
      if (res.data?.success) {
        setOrders(res.data.data || []);
      } else {
        toast.error(res.data?.message || "Không thể tải danh sách đơn hàng");
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Request canceled:', err.message);
        return;
      }
      console.error("Error fetching orders:", err);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
      setCurrentPage(1);
    }
  };

  // Gọi API yêu cầu hủy/hoàn tiền
  const fetchCancelRequests = async (signal) => {
    try {
      const res = await axios.get('admin/withdraw-requests', { signal });
      if (res.data?.success) {
        setCancelRequests(res.data.data || []);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn('Endpoint withdraw-requests không tồn tại');
        setCancelRequests([]);
      } else if (!axios.isCancel(error)) {
        console.error('Error fetching cancel requests:', error);
        toast.error('Không thể tải yêu cầu hủy đơn');
      }
    }
  };

  const fetchData = async (signal) => {
    await fetchOrders({ signal });
    await fetchCancelRequests(signal);
  };

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    fetchData(signal);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    const timeoutId = setTimeout(() => {
      fetchData(signal);
    }, DEBOUNCE_MS);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearTimeout(timeoutId);
    };
  }, [searchTerm, statusFilter]);

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

  const handleOpenRefundModal = (order) => {
    const request = cancelRequests.find(req => 
      req.order_id != null && order.id != null && 
      String(req.order_id) === String(order.id)
    );
    if (request) {
      setSelectedRequest(request);
      setShowRefundModal(true);
    } else {
      toast.error('Không tìm thấy thông tin yêu cầu hủy cho đơn hàng này');
    }
  };

  const handleOpenConfirmModal = (order) => {
    const request = cancelRequests.find(req => 
      req.order_id != null && order.id != null && 
      String(req.order_id) === String(order.id)
    );
    if (request) {
      setSelectedRequest(request);
      setShowConfirmModal(true);
    } else {
      toast.error('Không tìm thấy thông tin yêu cầu hủy cho đơn hàng này');
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedRequest?.order_id) {
      toast.error('Không tìm thấy ID đơn hàng');
      return;
    }
    try {
      const res = await axios.put(`admin/orders/${selectedRequest.order_id}/process-refund`);
      if (res.data.success) {
        toast.success('Đã xác nhận chuyển tiền');
        setShowRefundModal(false);
        fetchData();
      } else {
        toast.error(res.data.message || 'Xác nhận chuyển tiền thất bại');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error(error.response?.data?.message || 'Xác nhận chuyển tiền thất bại');
    }
  };

  const handleConfirmCancellation = async () => {
    if (!selectedRequest?.order_id) {
      toast.error('Không tìm thấy ID đơn hàng');
      return;
    }
    if (!refundInfo.transaction_id || refundInfo.transaction_id.trim() === '') {
      toast.error('Vui lòng nhập mã giao dịch');
      return;
    }
    try {
      const res = await axios.put(`admin/orders/${selectedRequest.order_id}/confirm-cancel`, {
        transaction_id: refundInfo.transaction_id,
        note: refundInfo.note
      });
      if (res.data.success) {
        toast.success('Đã xác nhận hủy đơn hàng thành công');
        setShowConfirmModal(false);
        setRefundInfo({ transaction_id: '', note: '' });
        fetchData();
      } else {
        toast.error(res.data.message || 'Xác nhận hủy thất bại');
      }
    } catch (error) {
      console.error('Error confirming cancellation:', error);
      toast.error(error.response?.data?.message || 'Xác nhận hủy thất bại');
    }
  };

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

  const getCancelRequestForOrder = (orderId) => {
    return cancelRequests.find(req => 
      req.order_id != null && orderId != null && 
      String(req.order_id) === String(orderId)
    );
  };

  return (
    <>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1 className="h3 mb-2 text-gray-800">Quản lý đơn hàng</h1>
            <p className="mb-0">Xem và quản lý tất cả đơn hàng của khách hàng</p>
          </div>
          <div>
            <button
              className="btn btn-outline-info"
              onClick={() => navigate("/admin/withdraw-requests")}
            >
              <i className="fas fa-wallet"></i> Danh sách hoàn tiền
            </button>
          </div>
        </div>

        {/* Bộ lọc tìm kiếm */}
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
              <option value="cancel_requested">Chờ xác nhận hủy</option>
              <option value="refund_processing">Đang xử lý hoàn tiền</option>
              <option value="cancelled_confirmed">Hủy đơn thành công</option>
            </select>
          </div>

          <div className="col-md-2">
            <button className="btn btn-outline-secondary w-100" onClick={handleRefresh}>
              Làm mới
            </button>
          </div>
        </div>

        {/* Danh sách đơn hàng */}
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
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOrders.length > 0 ? (
                        currentOrders.map((order) => {
                          const statusStr = getStringStatus(order);
                          const meta = STATUS_META[statusStr] || { text: "Không xác định", badge: "secondary" };
                          const nextText = getNextActionText(statusStr);
                          const cancelRequest = getCancelRequestForOrder(order.id);

                          return (
                            <tr key={order.id}>
                              <td>#{order.id}</td>
                              <td>{order.name}</td>
                              <td>{order.phone}</td>
                              <td>{formatCurrency(order.total)}</td>
                              <td>{formatDate(order.createdAt)}</td>
                              <td>
                                <span className={`badge bg-${meta.badge}`}>{meta.text}</span>
                                {cancelRequest && (
                                  <div className="mt-1">
                                    <small>
                                      <strong>Số TK:</strong> {cancelRequest.account_number} | 
                                      <strong> Ngân hàng:</strong> {cancelRequest.bank_name}
                                    </small>
                                  </div>
                                )}
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
                                {statusStr === 'cancel_requested' && (
                                  <button
                                    className="btn btn-warning btn-sm me-1 mb-1"
                                    onClick={() => handleOpenRefundModal(order)}
                                  >
                                    <i className="fas fa-money-bill-wave"></i> Xác nhận chuyển tiền
                                  </button>
                                )}
                                {statusStr === 'refund_processing' && (
                                  <button
                                    className="btn btn-info btn-sm me-1 mb-1"
                                    onClick={() => handleOpenConfirmModal(order)}
                                  >
                                    <i className="fas fa-check-circle"></i> Xác nhận hủy thành công
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
                          <td colSpan="7" className="text-center">
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

      {/* Modal xác nhận chuyển tiền */}
      {showRefundModal && selectedRequest && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Xác nhận chuyển tiền</h5>
                <button type="button" className="btn-close" onClick={() => setShowRefundModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Bạn có chắc chắn muốn xác nhận đã chuyển tiền hoàn lại cho khách hàng?</p>
                <div className="mb-3">
                  <strong>Thông tin chuyển khoản:</strong>
                  <div>Tên tài khoản: {selectedRequest.account_holder_name}</div>
                  <div>Số tài khoản: {selectedRequest.account_number}</div>
                  <div>Ngân hàng: {selectedRequest.bank_name}</div>
                  <div>Số tiền: {formatCurrency(selectedRequest.amount)}</div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowRefundModal(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleProcessRefund}>Xác nhận</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận hủy đơn thành công */}
      {showConfirmModal && selectedRequest && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Xác nhận hủy đơn hàng</h5>
                <button type="button" className="btn-close" onClick={() => setShowConfirmModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Vui lòng nhập thông tin xác nhận hủy đơn hàng:</p>
                <div className="mb-3">
                  <label className="form-label">Mã giao dịch</label>
                  <input
                    type="text"
                    className="form-control"
                    value={refundInfo.transaction_id}
                    onChange={(e) => setRefundInfo({ ...refundInfo, transaction_id: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Ghi chú</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={refundInfo.note}
                    onChange={(e) => setRefundInfo({ ...refundInfo, note: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleConfirmCancellation}>Xác nhận</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" />
    </>
  );
};

export default OrderHistory;
