import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../services/axios';
import { getUserFromStorage, removeUserFromStorage } from '../../../services/authService';

// Map trạng thái CHÍNH (đang dùng)
const STATUS_META = {
    pending:          { text: 'Chờ xác nhận',                 badge: 'warning'  },
    deposit_paid:     { text: 'Đã đặt cọc 30%',               badge: 'info'     },
    confirmed:        { text: 'Đã xác nhận & chờ thực hiện',  badge: 'primary'  },
    awaiting_balance: { text: 'Chờ thanh toán 70%',           badge: 'warning'  },
    completed:        { text: 'Dịch vụ hoàn tất',             badge: 'success'  },
    failed:           { text: 'Thanh toán thất bại',          badge: 'danger'   },
    cancelled:        { text: 'Đã hủy',                       badge: 'secondary'},
};

// Fallback cho vài trạng thái cũ nếu BE từng trả
const LEGACY_STATUS_META = {
    preparing:  { text: 'Đang chuẩn bị', badge: 'warning'  },
    ready:      { text: 'Sẵn sàng',      badge: 'info'     },
    delivered:  { text: 'Đã giao',       badge: 'success'  },
};

// Màu inline nếu không dùng bootstrap
const BADGE_STYLES = {
    warning:   { bg: '#fff3cd', color: '#856404' },
    info:      { bg: '#e7f5ff', color: '#0b7285' },
    primary:   { bg: '#d1ecf1', color: '#0c5460' },
    success:   { bg: '#d4edda', color: '#155724' },
    danger:    { bg: '#f8d7da', color: '#721c24' },
    secondary: { bg: '#e2e3e5', color: '#6c757d' },
};

const getStatusMeta = (status, order_status) => {
    // Ưu tiên string status; fallback từ order_status = 1|2
    let key = (status || '').toLowerCase();
    if (!key) {
        if (order_status === 1) key = 'pending';
        else if (order_status === 2) key = 'confirmed';
    }
    return STATUS_META[key] || LEGACY_STATUS_META[key] || { text: key || 'Không xác định', badge: 'secondary' };
};

const fmtVND = (v) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v || 0));

const methodLabel = (m) => {
    switch ((m || '').toLowerCase()) {
        case 'cash': return 'Tiền mặt';
        case 'momo': return 'MoMo';
        case 'vnpay': return 'VNPay';
        case 'card': return 'Thẻ';
        default: return m || 'N/A';
    }
};

function MyOrders() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize user data
    useEffect(() => {
        const user = getUserFromStorage();
        if (!user || !user.id) {
            setError('Vui lòng đăng nhập để xem đơn hàng');
            navigate('/login');
            return;
        }
        setCurrentUser(user);
        setUserId(user.id);
    }, [navigate]);

    // Fetch orders when userId is available
    useEffect(() => {
        if (!userId) return;

        let isMounted = true;

        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError(null);

                if (!userId || isNaN(userId)) {
                    throw new Error('User ID không hợp lệ');
                }

                const response = await axios.get('/orders', {
                    params: { user_id: userId },
                    timeout: 10000,
                });

                if (isMounted) {
                    if (response.data?.success) {
                        setOrders(response.data.data || []);
                    } else {
                        setError(response.data?.message || 'Không thể tải danh sách đơn hàng');
                    }
                }
            } catch (err) {
                if (isMounted) {
                    if (err.code === 'ECONNABORTED') {
                        setError('Yêu cầu quá thời gian. Vui lòng thử lại.');
                    } else if (err.response) {
                        const status = err.response.status;
                        const errorData = err.response.data;
                        switch (status) {
                            case 401:
                                setError('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
                                removeUserFromStorage();
                                navigate('/login');
                                break;
                            case 403:
                                setError('Bạn không có quyền truy cập vào tài nguyên này.');
                                break;
                            case 404:
                                setError('Không tìm thấy API endpoint hoặc người dùng không tồn tại.');
                                break;
                            case 422:
                                setError(errorData?.message || 'Dữ liệu gửi lên không hợp lệ.');
                                break;
                            case 500:
                                setError('Lỗi server nội bộ. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.');
                                break;
                            default:
                                setError(`Lỗi server (${status}): ${errorData?.message || 'Không thể tải danh sách đơn hàng'}`);
                        }
                    } else if (err.request) {
                        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
                    } else {
                        setError(`Lỗi không xác định: ${err.message}`);
                    }
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchOrders();
        return () => { isMounted = false; };
    }, [userId, navigate]);

    const handleViewDetails = (orderId) => {
        if (!orderId) return;
        navigate(`/orders/${orderId}`);
    };

    const handleRetry = () => {
        setError(null);
        setLoading(true);
        setUserId(currentUser?.id); // trigger refetch
    };

    if (loading) {
        return (
            <div className="loading-container" style={{ textAlign: 'center', padding: '2rem' }}>
                <div>Đang tải danh sách đơn hàng...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container" style={{ textAlign: 'center', padding: '2rem' }}>
                <div
                    className="error-message"
                    style={{
                        color: '#dc3545',
                        marginBottom: '1rem',
                        padding: '1rem',
                        border: '1px solid #dc3545',
                        borderRadius: '4px',
                        backgroundColor: '#f8d7da',
                    }}
                >
                    {error}
                </div>
                <button
                    onClick={handleRetry}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="my-orders-container">
            <h1 style={{ textAlign: 'center', padding: '2rem' }}>
                Danh sách đơn hàng của {currentUser?.name || 'Người dùng'}
            </h1>

            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>Bạn chưa có đơn hàng nào.</p>
                    <button
                        onClick={() => navigate('/menu')}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        Đặt hàng ngay
                    </button>
                </div>
            ) : (
                <div className="orders-table-container">
                    <table
                        className="orders-table"
                        style={{ textAlign: 'center', width: '90%', margin: '0 auto', borderCollapse: 'collapse' }}
                    >
                        <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Mã đơn hàng</th>
                            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Ngày đặt</th>
                            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Giờ</th>
                            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Phương thức</th>
                            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Trạng thái</th>
                            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Tổng tiền</th>
                            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Hành động</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.map((order) => {
                            const meta = getStatusMeta(order.status, order.order_status);
                            const colors = BADGE_STYLES[meta.badge] || BADGE_STYLES.secondary;
                            const total =
                                typeof order.total_amount === 'number'
                                    ? order.total_amount
                                    : typeof order.total === 'number'
                                        ? order.total
                                        : Number(order.total_amount || order.total || 0);

                            return (
                                <tr key={order.id}>
                                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>#{order.id}</td>
                                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>{order.date || 'N/A'}</td>
                                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>{order.time || 'N/A'}</td>
                                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                      <span
                          style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              backgroundColor:
                                  order.method === 'cash'
                                      ? '#d4edda'
                                      : order.method === 'momo'
                                          ? '#fff3cd'
                                          : order.method === 'vnpay'
                                              ? '#d1ecf1'
                                              : '#e2e3e5',
                              color:
                                  order.method === 'cash'
                                      ? '#155724'
                                      : order.method === 'momo'
                                          ? '#856404'
                                          : order.method === 'vnpay'
                                              ? '#0c5460'
                                              : '#6c757d',
                          }}
                      >
                        {methodLabel(order.method)}
                      </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                      <span
                          className={`badge bg-${meta.badge}`}
                          style={{
                              backgroundColor: colors.bg,
                              color: colors.color,
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                          }}
                      >
                        {meta.text}
                      </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                                        {fmtVND(total)}
                                    </td>
                                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                                        <button
                                            onClick={() => handleViewDetails(order.id)}
                                            style={{
                                                padding: '0.375rem 0.75rem',
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                            }}
                                            onMouseOver={(e) => (e.target.style.backgroundColor = '#0056b3')}
                                            onMouseOut={(e) => (e.target.style.backgroundColor = '#007bff')}
                                        >
                                            Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button
                    onClick={handleRetry}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '1rem',
                    }}
                >
                    Làm mới
                </button>
                <button
                    onClick={() => navigate('/menu')}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    Đặt thêm đơn hàng
                </button>
            </div>
        </div>
    );
}

export default MyOrders;
