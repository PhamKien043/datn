import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../../services/axios';
import { getUserFromStorage, removeUserFromStorage } from '../../../services/authService';

// ===== Map trạng thái DÙNG CHUNG với OrderHistory =====
const STATUS_META = {
    pending:          { text: 'Chờ xác nhận',                badge: 'warning'  },
    deposit_paid:     { text: 'Đã đặt cọc 30%',              badge: 'info'     },
    confirmed:        { text: 'Đã xác nhận & chờ thực hiện', badge: 'primary'  },
    awaiting_balance: { text: 'Chờ thanh toán 70%',          badge: 'warning'  },
    completed:        { text: 'Dịch vụ hoàn tất',            badge: 'success'  },
    failed:           { text: 'Thanh toán thất bại',         badge: 'danger'   },
    cancelled:        { text: 'Đã hủy',                      badge: 'secondary'},
};

// Màu cho badge (phòng khi FE không dùng Bootstrap)
const BADGE_STYLES = {
    warning:   { bg: '#fff3cd', color: '#856404' },
    info:      { bg: '#e7f5ff', color: '#0b7285' },
    primary:   { bg: '#d1ecf1', color: '#0c5460' },
    success:   { bg: '#d4edda', color: '#155724' },
    danger:    { bg: '#f8d7da', color: '#721c24' },
    secondary: { bg: '#e2e3e5', color: '#6c757d' },
};

// Fallback suy ra status string (nếu BE cũ trả order_status = 1|2)
const getStringStatus = (order) => {
    if (order?.status) return String(order.status).toLowerCase();
    if (order?.order_status === 1) return 'pending';
    if (order?.order_status === 2) return 'confirmed';
    return 'pending';
};

// Các bước hiển thị tiến trình (timeline)
const STATUS_STEPS = ['pending', 'deposit_paid', 'confirmed', 'awaiting_balance', 'completed'];

function OrderDetails() {
    const navigate = useNavigate();
    const { orderId } = useParams();
    const [currentUser, setCurrentUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helpers
    const fmt = (v) => Number(v || 0).toLocaleString('vi-VN');
    const fmtCurrency = (v) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v || 0));

    // Lấy user từ storage
    useEffect(() => {
        const user = getUserFromStorage();
        if (!user || !user.id) {
            setError('Vui lòng đăng nhập để xem chi tiết đơn hàng');
            navigate('/login');
            return;
        }
        setCurrentUser(user);
        setUserId(user.id);
    }, [navigate]);

    // Gọi API
    useEffect(() => {
        if (!userId || !orderId) return;
        let isMounted = true;

        (async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await axios.get(`/orders/${orderId}`, {
                    params: { user_id: userId },
                    timeout: 10000,
                });

                if (!isMounted) return;

                if (response.data?.success) {
                    setOrder(response.data.data || response.data.order || null);
                } else {
                    setError(response.data?.message || 'Không thể tải chi tiết đơn hàng');
                }
            } catch (err) {
                if (!isMounted) return;
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
                            setError('Bạn không có quyền truy cập vào đơn hàng này.');
                            break;
                        case 404:
                            setError('Không tìm thấy đơn hàng.');
                            break;
                        case 422:
                            setError(errorData?.message || 'Dữ liệu gửi lên không hợp lệ.');
                            break;
                        case 500:
                            setError('Lỗi server nội bộ. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.');
                            break;
                        default:
                            setError(`Lỗi server (${status}): ${errorData?.message || 'Không thể tải chi tiết đơn hàng'}`);
                    }
                } else if (err.request) {
                    setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
                } else {
                    setError(`Lỗi không xác định: ${err.message}`);
                }
            } finally {
                isMounted && setLoading(false);
            }
        })();

        return () => { isMounted = false; };
    }, [userId, orderId, navigate]);

    const handleRetry = () => {
        setError(null);
        setLoading(true);
        setOrder(null);
        setUserId(currentUser?.id);
    };

    const handleBackToOrders = () => navigate('/my-orders');

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div>Đang tải chi tiết đơn hàng...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div
                    style={{
                        color: '#dc3545', marginBottom: '1rem', padding: '1rem',
                        border: '1px solid #dc3545', borderRadius: '4px', backgroundColor: '#f8d7da',
                    }}
                >
                    {error}
                </div>
                <button
                    onClick={handleRetry}
                    style={{
                        padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white',
                        border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '1rem'
                    }}
                >
                    Thử lại
                </button>
                <button
                    onClick={handleBackToOrders}
                    style={{
                        padding: '0.5rem 1rem', backgroundColor: '#6c757d', color: 'white',
                        border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }}
                >
                    Quay lại danh sách đơn hàng
                </button>
            </div>
        );
    }

    if (!order) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div
                    style={{
                        color: '#dc3545', marginBottom: '1rem', padding: '1rem',
                        border: '1px solid', borderRadius: '4px', backgroundColor: '#f8d7da',
                    }}
                >
                    Không tìm thấy đơn hàng.
                </div>
                <button
                    onClick={handleBackToOrders}
                    style={{
                        padding: '0.5rem 1rem', backgroundColor: '#6c757d', color: 'white',
                        border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }}
                >
                    Quay lại danh sách đơn hàng
                </button>
            </div>
        );
    }

    // ====== TÍNH TOÁN HIỂN THỊ ======
    const detailWithService = order?.details?.find(d => d?.service);
    const detailWithRoom    = order?.details?.find(d => d?.room);

    const service =
        order?.service_info ||
        detailWithService?.service ||
        order?.booking?.service ||
        order?.booking_info?.service || null;

    const room =
        order?.room_info ||
        detailWithRoom?.room ||
        order?.booking?.room ||
        order?.booking_info?.room || null;

    const pricing = order?.pricing || order?.booking?.pricing || null;

    const tableCount = Number(
        order?.table_count ??
        order?.booking_info?.table_count ??
        pricing?.table_count ??
        detailWithService?.quantity ?? 0
    );

    const roomPrice = Number(
        order?.room_price ??
        room?.price ??
        detailWithRoom?.price ??
        pricing?.room_price ?? 0
    );

    const serviceType =
        order?.service_type ??
        service?.type_name ??
        service?.type ??
        service?.category?.name ??
        service?.name ??
        detailWithService?.service?.name ?? null;

    // const locationType =
    //     order?.location_type ??
    //     service?.location_type_name ??
    //     service?.location_type ??
    //     room?.location_type_name ??
    //     room?.location_type ??
    //     room?.type ??
    //     room?.category?.name ??
    //     room?.room_type?.name ?? null;

    const deposit_amount = Number(order.deposit_amount || 0);
    const total_amount   = Number(order.total_amount || 0);
    const balance_amount = Number(
        typeof order.balance_amount === 'number'
            ? order.balance_amount
            : Math.max(0, total_amount - deposit_amount)
    );

    // ====== HIỂN THỊ TRẠNG THÁI giống OrderHistory ======
    const statusStr = getStringStatus(order);
    const meta = STATUS_META[statusStr] || { text: statusStr || 'N/A', badge: 'secondary' };
    const badgeStyle = BADGE_STYLES[meta.badge] || BADGE_STYLES.secondary;

    // Nếu dịch vụ hoàn tất thì số tiền còn lại hiển thị = 0
    const displayBalance = statusStr === 'completed' ? 0 : balance_amount;

    // index đang đứng trong timeline
    const currentStepIndex = STATUS_STEPS.indexOf(statusStr);

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Chi tiết đơn hàng {order.id}</h1>

            {/* Tổng quan */}
            <div
                style={{
                    backgroundColor: '#f8f9fa',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    marginBottom: '2rem',
                    border: '1px solid #dee2e6',
                }}
            >
                <h2 style={{ marginBottom: '1rem' }}>Thông tin đơn hàng</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <p><strong>Mã đơn hàng:</strong> {order.id}</p>
                        <p><strong>Người đặt:</strong> {order.user?.name || 'N/A'} ({order.user?.email || 'N/A'})</p>
                        <p><strong>Ngày đặt:</strong> {order.date || 'N/A'}</p>
                        <p><strong>Giờ tổ chức:</strong> {order.time || 'N/A'}</p>
                        <p>
                            <strong>Phương thức thanh toán:</strong>{' '}
                            <span
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                    backgroundColor:
                                        order.method === 'cash' ? '#d4edda'
                                            : order.method === 'momo' ? '#fff3cd'
                                                : order.method === 'vnpay' ? '#d1ecf1'
                                                    : '#e2e3e5',
                                    color:
                                        order.method === 'cash' ? '#155724'
                                            : order.method === 'momo' ? '#856404'
                                                : order.method === 'vnpay' ? '#0c5460'
                                                    : '#6c757d',
                                }}
                            >
                {order.method === 'cash' ? 'Tiền mặt'
                    : order.method === 'momo' ? 'MoMo'
                        : order.method === 'vnpay' ? 'VNPay'
                            : order.method || 'N/A'}
              </span>
                        </p>
                    </div>

                    <div>
                        <p>
                            <strong>Trạng thái:</strong>{' '}
                            <span
                                className={`badge bg-${meta.badge}`} // nếu có bootstrap
                                style={{
                                    backgroundColor: badgeStyle.bg, // fallback nếu không có bootstrap
                                    color: badgeStyle.color,
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                }}
                            >
                {meta.text}
              </span>
                        </p>

                        <p><strong>Tổng tiền:</strong> {fmt(total_amount)} VNĐ</p>
                        <p>
                            <strong>Voucher áp dụng:</strong>{' '}
                            {order.voucher ? (
                                <>
                                    {order.voucher.title}
                                    {typeof order.voucher.discount_amount === 'number' && order.voucher.discount_amount > 0
                                        ? <> (-{order.voucher.discount_amount.toLocaleString('vi-VN')} VNĐ)</>
                                        : null}
                                </>
                            ) : 'Không sử dụng'}
                        </p>
                        <p><strong>Đã đặt cọc:</strong> {fmt(deposit_amount)} VNĐ</p>
                        <p><strong>Số tiền còn lại:</strong> {fmt(displayBalance)} VNĐ</p>
                    </div>
                </div>

                {/* Mini timeline tiến trình trạng thái */}
                <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {STATUS_STEPS.map((s, idx) => {
                            const active = (STATUS_STEPS.indexOf(statusStr) >= idx) && STATUS_STEPS.indexOf(statusStr) !== -1;
                            const stepMeta = STATUS_META[s];
                            return (
                                <React.Fragment key={s}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div
                                            title={stepMeta.text}
                                            style={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                backgroundColor: active ? (BADGE_STYLES[stepMeta.badge]?.bg || '#d4edda') : '#e9ecef',
                                                border: `2px solid ${active ? (BADGE_STYLES[stepMeta.badge]?.color || '#155724') : '#ced4da'}`,
                                            }}
                                        />
                                        <span style={{ fontSize: 12, color: active ? '#212529' : '#6c757d' }}>
                      {stepMeta.text}
                    </span>
                                    </div>
                                    {idx !== STATUS_STEPS.length - 1 && (
                                        <div
                                            style={{
                                                width: 24,
                                                height: 2,
                                                backgroundColor: currentStepIndex > idx ? '#adb5bd' : '#e9ecef',
                                                margin: '0 4px',
                                            }}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Dịch vụ & địa điểm */}
            <div
                style={{
                    backgroundColor: '#ffffff',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    marginBottom: '2rem',
                    border: '1px solid ',
                }}
            >
                <h2 style={{ marginBottom: '1rem' }}>Thông tin dịch vụ & địa điểm</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <p><strong>Loại dịch vụ:</strong> {serviceType || '—'}</p>
                        {/*<p><strong>Loại địa điểm:</strong> {locationType || '—'}</p>*/}
                        <p><strong>Phòng:</strong> {room?.name || '—'}</p>
                    </div>

                    <div>
                        <p><strong>Số lượng bàn:</strong> {tableCount || 0}</p>
                        <p><strong>Giá phòng (cố định):</strong> {fmtCurrency(roomPrice)}</p>
                    </div>
                </div>
            </div>

            {/* Chi tiết */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Chi tiết đơn hàng</h2>
                {order.details && order.details.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Mục</th>
                            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Số lượng</th>
                            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Giá</th>
                            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Tổng phụ</th>
                        </tr>
                        </thead>
                        <tbody>
                        {order.details.map((detail) => (
                            <tr key={detail.id}>
                                <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                                    {detail.menu?.name || detail.service?.name || detail.room?.name || 'Không xác định'}
                                </td>
                                <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                    {detail.quantity}
                                </td>
                                <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>
                                    {fmt(detail.price)} VNĐ
                                </td>
                                <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>
                                    {fmt(
                                        typeof detail.subtotal === 'number'
                                            ? detail.subtotal
                                            : Number(detail.price || 0) * Number(detail.quantity || 0)
                                    )} VNĐ
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p>Không có chi tiết đơn hàng.</p>
                )}
            </div>

            {/* Actions */}
            <div style={{ textAlign: 'center' }}>
                <button
                    onClick={handleBackToOrders}
                    style={{
                        padding: '0.5rem 1rem', backgroundColor: '#6c757d', color: 'white',
                        border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '1rem',
                    }}
                >
                    Quay lại danh sách đơn hàng
                </button>
                <button
                    onClick={() => navigate('/menu')}
                    style={{
                        padding: '0.5rem 1rem', backgroundColor: '#28a745', color: 'white',
                        border: 'none', borderRadius: '4px', cursor: 'pointer',
                    }}
                >
                    Đặt thêm đơn hàng
                </button>
            </div>
        </div>
    );
}

export default OrderDetails;
