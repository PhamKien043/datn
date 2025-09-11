import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getUserFromStorage } from "../../../services/authService.js";
import "./cart.css"

function CartPage() {
    const [cartItems, setCartItems] = useState([]);
    const [tableCount, setTableCount] = useState(1);
    const [loading, setLoading] = useState(false);

    // Giới hạn số bàn
    const MIN_TABLES = 1;
    const MAX_TABLES = 50;
    const clamp = (n) => Math.min(MAX_TABLES, Math.max(MIN_TABLES, Number.isFinite(n) ? n : MIN_TABLES));

    const currentUser = getUserFromStorage();
    const userId = currentUser ? currentUser.id : null;

    useEffect(() => {
        if (userId) fetchCart();
    }, [userId]);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const res = await axios.get("http://localhost:8000/api/cart-details", {
                headers: { Accept: "application/json" },
            });
            const userCartItems = Array.isArray(res.data)
                ? res.data.filter((i) => i.user_id === userId)
                : [];

            setCartItems(userCartItems);
            if (userCartItems[0]?.quantity) {
                // Kẹp theo min/max để nhất quán
                setTableCount(clamp(userCartItems[0].quantity));
            }
        } catch (err) {
            console.error("Lỗi khi tải giỏ hàng:", err);
            toast.error("Không thể tải dữ liệu giỏ hàng. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

    const formatDate = (date) =>
        date
            ? new Date(date).toLocaleDateString("vi-VN", {
                weekday: "long",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            })
            : "Chưa chọn";

    const formatTimeSlot = (timeSlot) =>
        timeSlot ? (timeSlot === "morning" ? "Buổi sáng (8:00-12:00)" : "Buổi chiều (13:00-17:00)") : "Chưa chọn";

    const confirmToast = (content) =>
        toast(
            <div>
                <p className="mb-3">{content.text}</p>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={() => (toast.dismiss(), content.onConfirm())}
                    >
                        {content.confirmLabel || "Xác nhận"}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => toast.dismiss()}>
                        Hủy
                    </button>
                </div>
            </div>,
            { position: "top-center", autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
        );

    const handleDelete = (id) => {
        confirmToast({
            text: "Bạn có chắc chắn muốn xóa món ăn này?",
            confirmLabel: "Xóa",
            onConfirm: () => performDelete(id),
        });
    };

    const performDelete = async (id) => {
        try {
            setLoading(true);
            await axios.delete(`http://localhost:8000/api/cart-details/${id}`);
            await fetchCart();
            toast.success("Xóa món ăn thành công!");
        } catch (err) {
            console.error("Lỗi khi xóa:", err);
            toast.error("Không thể xóa món ăn. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    const updateAllQuantities = async (newCount) => {
        const c = clamp(newCount);
        try {
            setLoading(true);
            await Promise.all(
                (cartItems || []).map((item) =>
                    axios.put(`http://localhost:8000/api/cart-details/${item.id}`, { quantity: c })
                )
            );
            await fetchCart();
            toast.success("Cập nhật số bàn thành công!");
        } catch (err) {
            console.error("Lỗi khi cập nhật số bàn:", err);
            toast.error("Không thể cập nhật số bàn. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (next) => {
        if (!Number.isInteger(next)) return;
        const current = clamp(Number(tableCount || MIN_TABLES));
        const newCount = clamp(next);

        const difference = Math.abs(newCount - current);
        if (difference > Math.max(2, current) && (cartItems?.length || 0) > 0) {
            confirmToast({
                text: `Bạn có chắc muốn ${newCount > current ? "tăng" : "giảm"} số bàn từ ${current} lên ${newCount}? Tất cả món ăn sẽ cập nhật theo tỷ lệ (1 bàn = 1 phần).`,
                onConfirm: () => {
                    setTableCount(newCount);
                    updateAllQuantities(newCount);
                },
            });
        } else {
            setTableCount(newCount);
            updateAllQuantities(newCount);
        }
    };

    const handleInputChange = (e) => {
        const v = e.target.value;
        // Cho phép rỗng để người dùng gõ tiếp
        if (/^\d*$/.test(v)) {
            if (v === "") return setTableCount("");
            const n = clamp(parseInt(v, 10) || 0);
            setTableCount(n);
        }
    };

    const handleInputBlur = () => {
        let v = Number(tableCount || 0);
        if (!v) v = MIN_TABLES;
        const clamped = clamp(v);

        if (clamped !== v) {
            if (clamped === MIN_TABLES && v < MIN_TABLES) {
                toast.warn(`Số bàn tối thiểu là ${MIN_TABLES}. Đã tự động điều chỉnh.`);
            } else if (clamped === MAX_TABLES && v > MAX_TABLES) {
                toast.warn(`Số bàn tối đa là ${MAX_TABLES}. Đã tự động điều chỉnh.`);
            }
        }

        setTableCount(clamped);
        updateAllQuantities(clamped);
    };

    const handleInputKeyDown = (e) => e.key === "Enter" && handleInputBlur();

    // ===== Derived data (memoized) =====
    const roomInfo = useMemo(() => cartItems.find((i) => i.room)?.room || null, [cartItems]);
    const serviceInfo = useMemo(() => cartItems.find((i) => i.service)?.service || null, [cartItems]);
    const locationTypeInfo = useMemo(
        () => cartItems.find((i) => i.location_type)?.location_type || roomInfo?.location_type || null,
        [cartItems, roomInfo]
    );
    const bookingInfo = cartItems[0] || null;

    // TÍNH THEO tableCount để UI cập nhật tức thì khi gõ
    const foodTotal = useMemo(
        () =>
            (cartItems || []).reduce(
                (acc, it) => acc + Number(tableCount || 0) * Number(it.price_per_table || 0),
                0
            ),
        [cartItems, tableCount]
    );

    // Phí/bàn (ưu tiên từ room; fallback service; mặc định 0)
    const tableFeePerTable = useMemo(() => {
        return Number(
            roomInfo?.table_fee_per_table ??
            roomInfo?.table_fee ??
            serviceInfo?.table_fee_per_table ??
            0
        );
    }, [roomInfo, serviceInfo]);

    // Tiền bàn = phí/bàn × số bàn
    const tableFeeTotal = useMemo(
        () => Number(tableFeePerTable) * Number(tableCount || 0),
        [tableFeePerTable, tableCount]
    );

    // Tiền phòng cố định/ca (KHÔNG nhân bàn)
    const roomFixed = useMemo(() => (roomInfo ? Number(roomInfo.price || 0) : 0), [roomInfo]);

    // Tổng tiền = món ăn + tiền bàn + phòng (cố định)
    const totalAmount = useMemo(
        () => Number(foodTotal + roomFixed),
        [foodTotal, roomFixed]
    );

    // Gửi sang Payment: quantity = tableCount (đồng bộ với UI)
    const orderItems = useMemo(
        () =>
            (cartItems || []).map((it) => ({
                menu_id: it.menu_id,
                name: it.menu?.name,
                quantity: Number(tableCount || MIN_TABLES),
                price: it.price_per_table,
                service_id: serviceInfo ? serviceInfo.id : null,
                room_id: roomInfo ? roomInfo.id : null,
            })),
        [cartItems, serviceInfo, roomInfo, tableCount]
    );

    // truyền thêm table_fee_per_table sang PaymentPage
    const formattedRoomInfo = roomInfo
        ? {
            id: roomInfo.id,
            name: roomInfo.name,
            price: Number(roomInfo.price || 0),
            capacity: roomInfo.capacity,
            location_type: locationTypeInfo,
            table_fee_per_table: Number(tableFeePerTable || 0),
        }
        : null;

    const formattedServiceInfo = serviceInfo
        ? { id: serviceInfo.id, name: serviceInfo.name, description: serviceInfo.description }
        : null;

    // ===== Small components =====
    const Skeleton = ({ height = 16, className = "" }) => (
        <div className={`placeholder-glow ${className}`}>
            <span className="placeholder col-12" style={{ height, display: "block", borderRadius: 8 }}></span>
        </div>
    );

    const Stepper = () => (
        <div className="d-inline-flex border rounded-pill overflow-hidden shadow-sm">
            <button
                className="btn btn-light px-3"
                disabled={Number(tableCount || MIN_TABLES) <= MIN_TABLES || loading}
                onClick={() => handleTableChange(clamp(Number(tableCount || MIN_TABLES) - 1))}
                title="Giảm"
            >
                <i className="fas fa-minus"></i>
            </button>
            <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-control text-center border-0 fw-semibold"
                style={{ width: 90 }}
                value={tableCount}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                disabled={loading}
                aria-label={`Số bàn (tối thiểu ${MIN_TABLES}, tối đa ${MAX_TABLES})`}
            />
            <button
                className="btn btn-light px-3"
                disabled={loading}
                onClick={() => handleTableChange(clamp(Number(tableCount || MIN_TABLES) + 1))}
                title="Tăng"
            >
                <i className="fas fa-plus"></i>
            </button>
        </div>
    );

    const FoodCard = ({ item }) => (
        <div className="card h-100 border-0 shadow-sm rounded-4 position-relative">
            <button
                className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle"
                onClick={() => handleDelete(item.id)}
                title="Xóa món"
                style={{ zIndex: 5 }}
                disabled={loading}
            >
                <i className="fas fa-times"></i>
            </button>
            <img
                src={`http://localhost:8000/storage/menus/${item.menu?.image || "default.jpg"}`}
                alt={item.menu?.name || "Menu"}
                className="card-img-top rounded-top-4"
                style={{ height: 170, objectFit: "cover" }}
                onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/600x400?text=Menu";
                }}
            />
            <div className="card-body">
                <h6 className="fw-semibold mb-2 text-truncate" title={item.menu?.name}>
                    {item.menu?.name || "Món ăn"}
                </h6>
                <div className="d-flex justify-content-between mb-2">
                    <small className="text-muted">Số lượng</small>
                    {/* HIỂN THỊ THEO tableCount */}
                    <span className="badge bg-info">{Number(tableCount || 0)} phần</span>
                </div>
                <div className="d-flex justify-content-between small text-muted">
                    <span>Giá/ phần</span>
                    <span>{formatCurrency(item.price_per_table)}</span>
                </div>
                <div className="d-flex justify-content-between mt-1">
                    <small className="text-muted">
                        <i className="fas fa-info-circle me-1"></i>1 bàn = 1 phần
                    </small>
                    {/* TỔNG MỖI MÓN = price_per_table * tableCount */}
                    <span className="fw-bold text-primary">
            {formatCurrency(Number(item.price_per_table || 0) * Number(tableCount || 0))}
          </span>
                </div>
            </div>
        </div>
    );

    if (!userId) {
        return (
            <div className="container py-5 text-center">
                <div className="alert alert-warning">
                    <h4>Bạn chưa đăng nhập</h4>
                    <p>Vui lòng đăng nhập để xem giỏ hàng.</p>
                    <Link to="/login" className="btn btn-primary">
                        Đăng nhập
                    </Link>
                </div>
                <ToastContainer position="bottom-right" />
            </div>
        );
    }

    const canCheckout = !!serviceInfo && !!roomInfo && !!bookingInfo?.selected_date && !loading;

    return (
        <div className="container py-4 py-md-5">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="fw-bold mb-1">🛒 Giỏ hàng</h2>
                    <div className="text-muted">Kiểm tra giỏ hàng và hoàn tất đặt dịch vụ</div>
                </div>
                <span className="badge rounded-pill bg-dark-subtle text-dark">
          {cartItems.length} món • {tableCount} bàn
        </span>
            </div>

            {/* Top status chips */}
            <div className="d-flex flex-wrap gap-2 mb-4">
        <span className={`badge rounded-pill ${serviceInfo ? "bg-primary" : "bg-secondary"}`}>
          <i className="fas fa-concierge-bell me-1"></i>
            {serviceInfo ? serviceInfo.name : "Chưa chọn dịch vụ"}
        </span>
                <span className={`badge rounded-pill ${roomInfo ? "bg-success" : "bg-secondary"}`}>
          <i className="fas fa-door-open me-1"></i>
                    {roomInfo ? roomInfo.name : "Chưa chọn phòng"}
        </span>
                <span className={`badge rounded-pill ${bookingInfo?.selected_date ? "bg-warning text-dark" : "bg-secondary"}`}>
          <i className="fas fa-calendar-day me-1"></i>
                    {formatDate(bookingInfo?.selected_date)}
        </span>
                <span className={`badge rounded-pill ${bookingInfo?.selected_time_slot ? "bg-info text-dark" : "bg-secondary"}`}>
          <i className="fas fa-clock me-1"></i>
                    {formatTimeSlot(bookingInfo?.selected_time_slot)}
        </span>
                <span className="badge rounded-pill bg-secondary-subtle text-dark">
          <i className="fas fa-map-marker-alt me-1"></i>
                    {locationTypeInfo?.name || "Chưa chọn địa điểm"}
        </span>
            </div>

            {/* Main layout: left content + right sticky summary */}
            <div className="row g-4">
                {/* LEFT */}
                <div className="col-lg-8">
                    {/* Table count control */}
                    {roomInfo && (
                        <div
                            className="p-4 rounded-4 border shadow-sm mb-4"
                            style={{ background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)" }}
                        >
                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                                <div>
                                    <div className="fw-bold mb-1">Số lượng bàn</div>
                                    <small className="text-muted">
                                        Thay đổi số bàn sẽ tự động cập nhật tất cả món ăn theo tỷ lệ <strong>1 bàn = 1 phần</strong>
                                        {" "}— (tối thiểu {MIN_TABLES}, tối đa {MAX_TABLES})
                                    </small>
                                </div>
                                <Stepper />
                            </div>
                            <div className="d-flex flex-wrap gap-3 mt-3">
                <span className="badge bg-primary-subtle text-primary">
                  <i className="fas fa-chair me-1"></i> Sức chứa phòng: {roomInfo.capacity} người
                </span>
                                <span className="badge bg-success-subtle text-success">
                  <i className="fas fa-users me-1"></i> Dự kiến: {Number(tableCount || 0) * 10} khách
                </span>
                                <span className="badge bg-dark-subtle text-dark">
                  <i className="fas fa-door-open me-1"></i> Giá phòng (cố định/buổi): {formatCurrency(roomFixed)}
                </span>

                            </div>
                        </div>
                    )}

                    {/* Items */}
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-header bg-white border-0 pt-4 px-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0">
                                    <i className="fas fa-utensils me-2 text-primary"></i>
                                    Danh sách món ăn
                                </h5>
                                <small className="text-muted">
                                    {cartItems.length} món • {cartItems.length * Number(tableCount || 0)} phần
                                </small>
                            </div>
                        </div>
                        <div className="card-body p-4">
                            {loading ? (
                                <div className="row g-4">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="col-md-6 col-lg-3">
                                            <Skeleton height={170} className="mb-3" />
                                            <Skeleton />
                                            <Skeleton className="mt-2" />
                                            <Skeleton className="mt-2" />
                                        </div>
                                    ))}
                                </div>
                            ) : cartItems.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                                    <h5 className="mb-2">Giỏ hàng trống</h5>
                                    <p className="text-muted">Hãy thêm dịch vụ và món ăn để tiếp tục nhé.</p>
                                    <Link to="/Service" className="btn btn-primary">
                                        <i className="fas fa-plus me-2"></i>Xem dịch vụ
                                    </Link>
                                </div>
                            ) : (
                                <div className="row g-4">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="col-md-6 col-lg-3">
                                            <FoodCard item={item} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Breakdown accordion */}
                    {cartItems.length > 0 && (
                        <div className="accordion accordion-flush mt-4" id="orderBreakdown">
                            <div className="accordion-item border rounded-3">
                                <h2 className="accordion-header">
                                    <button
                                        className="accordion-button collapsed fw-semibold"
                                        type="button"
                                        data-bs-toggle="collapse"
                                        data-bs-target="#collapseBreakdown"
                                    >
                                        <i className="fas fa-list me-2"></i>
                                        Chi tiết từng món ăn ({cartItems.length} món)
                                    </button>
                                </h2>
                                <div id="collapseBreakdown" className="accordion-collapse collapse">
                                    <div className="accordion-body">
                                        {cartItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="d-flex justify-content-between align-items-center py-2 border-bottom"
                                            >
                                                <div className="flex-grow-1">
                                                    <span className="fw-semibold d-block">{item.menu?.name}</span>
                                                    <small className="text-muted">
                                                        {/* HIỂN THỊ THEO tableCount */}
                                                        {formatCurrency(item.price_per_table)} × {Number(tableCount || 0)} phần
                                                    </small>
                                                </div>
                                                <div className="text-end">
                          <span className="fw-semibold text-primary fs-6">
                            {formatCurrency(Number(item.price_per_table || 0) * Number(tableCount || 0))}
                          </span>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="d-flex justify-content-between align-items-center py-3 border-top mt-2">
                                            <span className="fw-bold">Tổng tiền món ăn:</span>
                                            <span className="fw-bold text-primary fs-5">{formatCurrency(foodTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT (sticky summary) */}
                <div className="col-lg-4">
                    <div className="position-sticky" style={{ top: 24 }}>
                        <div className="card p-4 shadow-sm border-0 rounded-4">
                            <h5 className="fw-bold mb-3">
                                <i className="fas fa-calculator me-2"></i>Chi tiết thanh toán
                            </h5>

                            {/* tiles */}
                            <div className="row g-3 mb-3">
                                <div className="col-6">
                                    <div className="p-3 bg-light rounded-3 text-center">
                                        <div className="text-muted small">Số bàn</div>
                                        <div className="fs-5 fw-bold text-primary">{tableCount}</div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="p-3 bg-light rounded-3 text-center">
                                        <div className="text-muted small">Tổng phần</div>
                                        <div className="fs-6 fw-bold text-primary">
                                            {cartItems.length * Number(tableCount || 0)} phần
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex justify-content-between small mb-2">
                                <span>Tiền món ăn</span>
                                <span className="fw-semibold">{formatCurrency(foodTotal)}</span>
                            </div>
                            <div className="d-flex justify-content-between small mb-2">
                                <span>Tiền phòng (cố định)</span>
                                <span className="fw-semibold">{formatCurrency(roomFixed)}</span>
                            </div>

                            <hr />
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0">Tổng tiền</h5>
                                <div className="fs-4 fw-bold text-danger">{formatCurrency(totalAmount)}</div>
                            </div>

                            <Link
                                to="/payment"
                                state={{
                                    totalAmount,
                                    orderItems,
                                    tableCount,
                                    roomInfo: formattedRoomInfo,
                                    serviceInfo: formattedServiceInfo,
                                    selectedDate: bookingInfo?.selected_date,
                                    selectedTime: bookingInfo?.selected_time_slot,
                                }}
                                className={`btn btn-lg w-100 mt-3 fw-bold ${canCheckout ? "btn-success" : "btn-secondary disabled"}`}
                            >
                                <i className="fas fa-credit-card me-2"></i>
                                {canCheckout ? "Đặt dịch vụ ngay" : "Vui lòng hoàn tất thông tin"}
                            </Link>

                            <div className="mt-3 small text-muted">
                                <i className="fas fa-lightbulb me-1"></i>
                                Đặt cọc 30% sẽ được tính ở bước thanh toán; voucher (nếu có) sẽ áp dụng trước khi tính đặt cọc.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer position="bottom-right" />
        </div>
    );
}

export default CartPage;
