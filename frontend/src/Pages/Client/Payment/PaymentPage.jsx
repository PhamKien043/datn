import React, {useState, useEffect, useMemo} from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import {useLocation, useNavigate} from "react-router-dom";
import {getUserFromStorage} from "../../../services/authService";

const formatTimeSlot = (timeSlot) => {
    if (!timeSlot) return "Chưa chọn";
    return timeSlot === "morning" ? "Buổi sáng (8:00-12:00)" : "Buổi chiều (13:00-17:00)";
};

const extractVoucherArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
};

const normalizeSelectedTime = (raw) => {
    if (!raw) return null;
    const s = String(raw).toLowerCase().trim();
    if (s === "morning" || s === "afternoon") return s;
    if (s.includes("8:") || s.includes("08:")) return "morning";
    if (s.includes("13:")) return "afternoon";
    if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
    if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
    return "morning";
};

const normalizeOrderItemsForApi = ({items, roomId, roomSlotId, serviceId}) => {
    return (items || [])
        .map((raw) => {
            const menu_id = Number(raw.menu_id ?? raw.id ?? raw.menuId ?? 0);
            const quantity = Number(raw.quantity ?? raw.qty ?? 0);
            const price = Math.round(Number(raw.price ?? raw.unit_price ?? 0));
            const payload = {
                menu_id,
                room_id: Number(roomId),
                room_slot_id: Number(roomSlotId),
                quantity,
                price,
                service_id:
                    raw.service_id != null && raw.service_id !== ""
                        ? Number(raw.service_id)
                        : serviceId != null
                            ? Number(serviceId)
                            : null,
            };
            return payload;
        })
        .filter((it) => it.menu_id > 0 && it.room_id > 0 && it.room_slot_id > 0 && it.quantity > 0 && it.price >= 0);
};

export default function PaymentPage() {
    const {state, search} = useLocation();
    const navigate = useNavigate();

    const {
        totalAmount: stateTotalAmount,
        orderItems: stateOrderItems,
        roomInfo: stateRoomInfo,
        selectedDate: stateSelectedDate,
        selectedTime: stateSelectedTime,
        serviceInfo: stateServiceInfo,
    } = state || {};

    const styles = {
        page: {
            background:
                "radial-gradient(1200px 500px at 10% -10%, #e6f0ff 0%, #ffffff 50%), radial-gradient(1200px 600px at 100% 0%, #fff3e0 0%, #ffffff 50%)",
            minHeight: "100vh",
        },
        glass: {
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.6)",
        },
        sticky: {position: "sticky", top: 24},
        cta: {background: "linear-gradient(90deg,#22c55e,#16a34a)", border: 0},
        methodCard: (active) => ({
            cursor: "pointer",
            transition: "all .2s ease",
            borderWidth: active ? 2 : 1,
            borderColor: active ? "var(--bs-primary)" : "var(--bs-border-color)",
            background: active ? "rgba(13,110,253,.08)" : "#fff",
            boxShadow: active ? "0 6px 20px rgba(13,110,253,.15)" : undefined,
        }),
        voucherHeaderPill: {
            background: "linear-gradient(90deg, rgba(13,110,253,.1), rgba(99,102,241,.1))",
            border: "1px solid rgba(13,110,253,.25)",
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 12,
        },
        voucherHint: {
            background: "linear-gradient(180deg,#f8fafc,#ffffff)",
            border: "1px dashed rgba(0,0,0,.12)",
            borderRadius: 14,
        },
        progressWrap: {background: "rgba(16,185,129,.08)", height: 8, borderRadius: 999, overflow: "hidden"},
        progressBar: (pct) => ({
            width: `${pct}%`,
            height: "100%",
            background: "linear-gradient(90deg,#22c55e,#16a34a)"
        }),
        appliedPill: {
            border: "1px solid rgba(34,197,94,.35)",
            background: "linear-gradient(180deg, rgba(34,197,94,.08), rgba(34,197,94,.03))",
            borderRadius: 12,
        },
        voucherCard: (active, disabled, used) => ({
            cursor: disabled || used ? "not-allowed" : "pointer",
            transition: "transform .15s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease",
            borderWidth: active ? 2 : 1,
            borderColor: active ? "var(--bs-success)" : used ? "rgba(220, 53, 69, 0.3)" : "var(--bs-border-color)",
            background: active
                ? "linear-gradient(180deg, rgba(34,197,94,.08), rgba(34,197,94,.03))"
                : used
                    ? "linear-gradient(180deg, rgba(108, 117, 125, 0.05), rgba(108, 117, 125, 0.02))"
                    : "#fff",
            boxShadow: active ? "0 8px 24px rgba(16,185,129,.18)" : undefined,
            opacity: used ? 0.5 : disabled ? 0.7 : 1,
            pointerEvents: used ? "none" : "auto",
            position: "relative",
            filter: used ? "grayscale(30%)" : "none",
        }),
        usedOverlay: {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(108, 117, 125, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "inherit",
            zIndex: 1,
        },
        usedBadge: {
            background: "linear-gradient(135deg, #6c757d, #495057)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: "600",
            textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            boxShadow: "0 2px 8px rgba(108, 117, 125, 0.3)",
        },
    };

    const [selectedMethod, setSelectedMethod] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [paymentMessage, setPaymentMessage] = useState("");
    const [returnOrderId, setReturnOrderId] = useState(null);

    const [menus, setMenus] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [cartData, setCartData] = useState(null);
    const [orderItems, setOrderItems] = useState(stateOrderItems || []);
    const [bookingInfo, setBookingInfo] = useState(null);

    // Voucher
    const [vouchers, setVouchers] = useState([]);
    const [voucherId, setVoucherId] = useState("");
    const [voucher, setVoucher] = useState(null);
    const [discount, setDiscount] = useState(0);
    const [finalTotal, setFinalTotal] = useState(stateTotalAmount || 0);
    const [depositAmount, setDepositAmount] = useState(0);

    // Banner thông báo đẹp cho Voucher
    const [voucherNotice, setVoucherNotice] = useState(null); // {type,title,message}
    const showVoucherNotice = (type, title, message) => setVoucherNotice({type, title, message});
    const closeVoucherNotice = () => setVoucherNotice(null);
    const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : null);

    const currentUser = getUserFromStorage();
    const userId = currentUser ? currentUser.id : null;

    useEffect(() => {
        if (!userId) {
            navigate("/login");
            return;
        }

        (async () => {
            try {
                try {
                    const menusResponse = await axios.get("http://localhost:8000/api/payment/menus");
                    if (menusResponse.data?.success) setMenus(menusResponse.data.data);
                } catch {
                }

                try {
                    const roomsResponse = await axios.get("http://localhost:8000/api/payment/rooms");
                    if (roomsResponse.data?.success) setRooms(roomsResponse.data.data);
                } catch {
                }

                if (!stateTotalAmount || !stateOrderItems) {
                    try {
                        const cartResponse = await axios.post("http://localhost:8000/api/payment/cart", {user_id: userId});
                        if (cartResponse.data?.success) {
                            const c = cartResponse.data.data;
                            setCartData(c);
                            setOrderItems(c.order_items || []);
                            setBookingInfo(c.booking_info || null);
                        } else {
                            setError("Không thể lấy thông tin giỏ hàng. Vui lòng quay lại trang đặt hàng.");
                        }
                    } catch {
                        if (!stateTotalAmount) setError("Không có thông tin đơn hàng. Vui lòng quay lại trang đặt hàng.");
                    }
                }
            } catch {
                setError("Không thể tải dữ liệu từ server. Vui lòng thử lại.");
            }
        })();
    }, [userId, navigate, stateTotalAmount, stateOrderItems]);


    const effectiveRoom = useMemo(
        () => stateRoomInfo || bookingInfo?.room || cartData?.booking_info?.room || null,
        [stateRoomInfo, bookingInfo, cartData]
    );

    const foodTotal = useMemo(
        () => (orderItems || []).reduce((acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 0), 0),
        [orderItems]
    );

    const roomFixed = useMemo(() => Number(effectiveRoom?.price || 0), [effectiveRoom]);


    const baseTotal = useMemo(() => Number(foodTotal + roomFixed), [foodTotal, roomFixed]);

    // helper diễn giải vì sao không đủ điều kiện
    const reasonForIneligible = (v) => {
        const now = new Date();
        const start = v.start_date ? new Date(v.start_date) : null;
        const end = v.end_date ? new Date(v.end_date) : null;

        if (start && now < start) return `Hiệu lực từ ${fmtDate(v.start_date)}`;
        if (end && now > end) return `Hết hạn ${fmtDate(v.end_date)}`;

        const lack = Math.max(0, Number(v.min_order_total || 0) - Number(baseTotal || 0));
        if (lack > 0) return `Cần thêm ${formatCurrency(lack)} để dùng voucher`;
        return "Voucher hiện không đủ điều kiện.";
    };

    // Load vouchers
    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get("http://localhost:8000/api/vouchers", {
                    params: {per_page: 1000, user_id: userId, total: stateTotalAmount || 0},
                    headers: {Accept: "application/json"},
                });
                const rawList = extractVoucherArray(res.data);
                const list = (rawList || []).map((v) => ({
                    id: v.id,
                    title: v.title,
                    type: (v.type || "fixed").toLowerCase(),
                    value: Number(v.value || 0),
                    min_order_total: Number(v.min_order_total || 0),
                    start_date: v.start_date || null,
                    end_date: v.end_date || null,
                    status: v.status === true || v.status === 1 || v.status === "1",
                    used_by_user: v.is_used === true && v.used_by_user_id === userId,
                    eligible:
                        (v.status === true || v.status === 1 || v.status === "1") &&
                        Number(stateTotalAmount || 0) >= Number(v.min_order_total || 0) &&
                        !(v.is_used === true && v.used_by_user_id === userId),
                }));
                setVouchers(list);

                if (voucherId) {
                    const currentVoucher = list.find((v) => String(v.id) === String(voucherId));
                    if (!currentVoucher || currentVoucher.used_by_user || !currentVoucher.eligible) {
                        setVoucher(null);
                        setVoucherId("");
                        showVoucherNotice("info", "Voucher không còn hợp lệ", "Vui lòng chọn một voucher khác.");
                    } else {
                        setVoucher(currentVoucher);
                    }
                }
            } catch {
                setVouchers([]);
                setError("Không thể tải danh sách voucher. Vui lòng thử lại.");
            }
        })();
    }, [userId, stateTotalAmount, voucherId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Nhận kết quả từ cổng thanh toán
    useEffect(() => {
        const params = new URLSearchParams(search);
        const status = params.get("status");
        const orderIdRaw = params.get("order_id");
        const orderId = Number(orderIdRaw || 0);
        const message = params.get("message");

        if (status) {
            setPaymentStatus(status);
            setPaymentMessage(decodeURIComponent(message || ""));
            setReturnOrderId(orderId > 0 ? orderId : null);

            (async () => {
                try {
                    setVoucher(null);
                    setVoucherId("");
                    const res = await axios.get("http://localhost:8000/api/vouchers", {
                        params: {per_page: 1000, user_id: userId, total: stateTotalAmount || 0},
                        headers: {Accept: "application/json"},
                    });
                    const rawList = extractVoucherArray(res.data);
                    const list = (rawList || []).map((v) => ({
                        id: v.id,
                        title: v.title,
                        type: (v.type || "fixed").toLowerCase(),
                        value: Number(v.value || 0),
                        min_order_total: Number(v.min_order_total || 0),
                        start_date: v.start_date || null,
                        end_date: v.end_date || null,
                        status: v.status === true || v.status === 1 || v.status === "1",
                        used_by_user: v.is_used === true && v.used_by_user_id === userId,
                        eligible:
                            (v.status === true || v.status === 1 || v.status === "1") &&
                            Number(stateTotalAmount || 0) >= Number(v.min_order_total || 0) &&
                            !(v.is_used === true && v.used_by_user_id === userId),
                    }));
                    setVouchers(list);
                } catch {
                    setVouchers([]);
                    setError("Không thể làm mới danh sách voucher. Vui lòng thử lại.");
                }
            })();

            if (status === "pending" && orderId > 0) {
                axios
                    .post("http://localhost:8000/api/vnpay/check-status", {order_id: orderId})
                    .then((res) => {
                        if (res.data?.success && res.data?.order) {
                            setPaymentStatus(res.data.order.status);
                        }
                    })
                    .catch(() => {
                        setPaymentMessage("Lỗi khi kiểm tra trạng thái đơn hàng");
                    });
            }
        }
    }, [search, userId, stateTotalAmount]);

    const formatCurrency = (value) =>
        new Intl.NumberFormat("vi-VN", {style: "currency", currency: "VND"}).format(Number(value || 0));

    const handleSelect = (method) => {
        setSelectedMethod(method);
        setError("");
    };

    const onChangeVoucher = (vid) => {
        const found = (vouchers || []).find((x) => String(x.id) === String(vid));
        if (!found) {
            setError("");
            showVoucherNotice("danger", "Không tìm thấy voucher", "Voucher không tồn tại hoặc đã bị gỡ.");
            return;
        }
        if (found.used_by_user) {
            setError("");
            showVoucherNotice("warning", "Voucher đã sử dụng", "Voucher này đã được dùng ở đơn trước đó.");
            return;
        }
        if (!found.eligible) {
            setError("");
            showVoucherNotice("info", "Chưa đủ điều kiện", reasonForIneligible(found));
            return;
        }
        setVoucherId(vid);
        setVoucher(found);
        const valueBadge = found.type === "percent" ? `${found.value}%` : formatCurrency(found.value);
        showVoucherNotice("success", "Đã áp dụng voucher", `${found.title} (${valueBadge}) đã được áp dụng.`);
    };

    // Tính tiền theo voucher
    useEffect(() => {
        const base = Number(baseTotal || 0);
        if (!voucher) {
            setDiscount(0);
            setFinalTotal(base);
            setDepositAmount(Math.round(base * 0.3));
            return;
        }
        const min = Number(voucher.min_order_total || 0);
        if (base < min) {
            setDiscount(0);
            setFinalTotal(base);
            setDepositAmount(Math.round(base * 0.3));
            return;
        }
        const type = (voucher.type || "fixed").toLowerCase();
        const val = Number(voucher.value || 0);
        let d = type === "percent" ? Math.round(base * (val / 100)) : Math.round(val);
        d = Math.min(d, base);
        const f = base - d;
        setDiscount(d);
        setFinalTotal(f);
        setDepositAmount(Math.round(f * 0.3));
    }, [baseTotal, voucher]);

    const normalizedRoomInfoToSend = useMemo(() => {
        if (!effectiveRoom) return null;
        return {
            id: effectiveRoom.id,
            name: effectiveRoom.name,
            price: Number(effectiveRoom.price || 0),
            capacity: effectiveRoom.capacity,
        };
    }, [effectiveRoom]);
    // Helpers
    const isVoucherEligible = (v) => {
        const now = new Date();
        const inDateRange =
            (!v.start_date || new Date(v.start_date) <= now) && (!v.end_date || now <= new Date(v.end_date));
        return !!v.status && inDateRange && Number(baseTotal) >= Number(v.min_order_total || 0) && !v.used_by_user;
    };

    const eligibleCount = useMemo(() => (vouchers || []).filter((v) => isVoucherEligible(v)).length, [vouchers, baseTotal]);

    const lackAmountText = (v) => {
        const min = Number(v.min_order_total || 0);
        const lack = Math.max(0, min - Number(baseTotal || 0));
        return lack > 0 ? `Cần thêm ${formatCurrency(lack)} để dùng voucher này` : null;
    };

    const minNeededForBestVoucher = useMemo(() => {
        const notEligible = (vouchers || []).filter((v) => !isVoucherEligible(v));
        if (!notEligible.length) return null;
        const nearest = notEligible.reduce((m, v) => {
            const need = Math.max(0, Number(v.min_order_total || 0) - Number(baseTotal || 0));
            return need > 0 && (m === null || need < m) ? need : m;
        }, null);
        return nearest;
    }, [vouchers, baseTotal]);

    const filteredVouchers = useMemo(() => {
        const list = vouchers || [];
        return list.slice().sort((a, b) => {
            const aEligible = isVoucherEligible(a);
            const bEligible = isVoucherEligible(b);
            if (aEligible !== bEligible) return Number(bEligible) - Number(aEligible);
            if (a.used_by_user !== b.used_by_user) return Number(a.used_by_user) - Number(b.used_by_user);
            return 0;
        });
    }, [vouchers, baseTotal]);

    const handleConfirm = async () => {
        if (!selectedMethod) return setError("Vui lòng chọn phương thức thanh toán.");
        if (!orderItems || !orderItems.length) return setError("Thông tin đơn hàng không hợp lệ.");
        if (!userId) {
            setError("Vui lòng đăng nhập để thực hiện thanh toán.");
            navigate("/login");
            return;
        }

        try {
            setIsLoading(true);
            setError("");

            let roomSlotId = null;
            const effRoomId = Number(effectiveRoom?.id || 0);
            const effDate = stateSelectedDate || bookingInfo?.selected_date;
            const effTimeRaw = stateSelectedTime || bookingInfo?.selected_time_slot;
            const effTime = normalizeSelectedTime(effTimeRaw);

            if (!effRoomId) throw new Error("Thiếu phòng cho đơn hàng.");
            if (!effDate) throw new Error("Thiếu ngày sử dụng.");
            if (!effTime) throw new Error("Thiếu khung giờ sử dụng.");

            if (bookingInfo?.room_slot?.id) {
                roomSlotId = bookingInfo.room_slot.id;
            } else if (stateRoomInfo?.room_slot_id) {
                roomSlotId = stateRoomInfo.room_slot_id;
            } else {
                const rs = await axios.get("http://localhost:8000/api/room-slots", {
                    params: {room_id: effRoomId, slot_date: effDate, time_slot: effTime},
                });

                let roomSlots = [];
                if (Array.isArray(rs.data)) roomSlots = rs.data;
                else if (rs.data?.success && rs.data?.data) roomSlots = rs.data.data;
                else if (Array.isArray(rs.data?.data)) roomSlots = rs.data.data;

                if (!roomSlots?.length) {
                    throw new Error("Không tìm thấy slot phòng phù hợp. Vui lòng kiểm tra lại thông tin đặt chỗ.");
                }
                const available = roomSlots.find((s) => s.is_available === true || s.is_available === 1);
                roomSlotId = Number((available || roomSlots[0])?.id || 0);
            }

            if (!roomSlotId) throw new Error("Không thể xác định slot phòng. Vui lòng thử lại hoặc liên hệ hỗ trợ.");

            const normalizedItems = normalizeOrderItemsForApi({
                items: orderItems,
                roomId: effRoomId,
                roomSlotId,
                serviceId: stateServiceInfo?.id ?? bookingInfo?.service?.id ?? null,
            });

            if (!normalizedItems.length) throw new Error("Dữ liệu món ăn/buổi phòng chưa hợp lệ.");

            const paymentData = {
                method: selectedMethod,
                amount: Number(finalTotal),
                orderItems: normalizedItems,
                user_id: Number(userId),
                selectedDate: effDate,
                selectedTime: effTime,
                roomInfo: normalizedRoomInfoToSend,
                serviceInfo: stateServiceInfo || bookingInfo?.service || null,
                voucher_id: voucher?.id ? Number(voucher.id) : null,
            };

            if (voucher?.id) {
                const currentVoucher = vouchers.find((v) => String(v.id) === String(voucher.id));
                if (!currentVoucher || currentVoucher.used_by_user || !currentVoucher.eligible) {
                    setVoucher(null);
                    setVoucherId("");
                    showVoucherNotice("danger", "Voucher không hợp lệ", "Voucher đã chọn không hợp lệ hoặc đã được sử dụng.");
                    throw new Error("Voucher đã chọn không hợp lệ hoặc đã được sử dụng.");
                }
            }

            const paymentEndpoint =
                selectedMethod === "vnpay"
                    ? "http://localhost:8000/api/vnpay/redirect"
                    : "http://localhost:8000/api/payment/redirect";

            const res = await axios.post(paymentEndpoint, paymentData);

            if (res.data?.success && res.data?.url) {
                window.location.href = res.data.url;
            } else {
                setError(res.data?.error || "Không thể tạo giao dịch thanh toán. Vui lòng thử lại.");
            }
        } catch (err) {
            const status = err?.response?.status;
            if (status === 422) {
                const api = err.response.data || {};
                const firstDetail =
                    api?.errors && typeof api.errors === "object" ? Object.values(api.errors).flat()[0] : null;

                const msg = api.error || firstDetail || "Dữ liệu không hợp lệ.";
                setError(""); // ẩn alert đỏ chung
                showVoucherNotice("danger", "Không thể áp dụng voucher", msg);

                setVoucher(null);
                setVoucherId("");
                if ((api.error || "").includes("Voucher")) {
                    try {
                        const res = await axios.get("http://localhost:8000/api/vouchers", {
                            params: {per_page: 1000, user_id: userId, total: stateTotalAmount || 0},
                            headers: {Accept: "application/json"},
                        });
                        const rawList = extractVoucherArray(res.data);
                        const list = (rawList || []).map((v) => ({
                            id: v.id,
                            title: v.title,
                            type: (v.type || "fixed").toLowerCase(),
                            value: Number(v.value || 0),
                            min_order_total: Number(v.min_order_total || 0),
                            start_date: v.start_date || null,
                            end_date: v.end_date || null,
                            status: v.status === true || v.status === 1 || v.status === "1",
                            used_by_user: v.is_used === true && v.used_by_user_id === userId,
                            eligible:
                                (v.status === true || v.status === 1 || v.status === "1") &&
                                Number(stateTotalAmount || 0) >= Number(v.min_order_total || 0) &&
                                !(v.is_used === true && v.used_by_user_id === userId),
                        }));
                        setVouchers(list);
                    } catch {
                        setVouchers([]);
                        setError("Không thể làm mới danh sách voucher. Vui lòng thử lại.");
                    }
                }
            } else {
                const msg = err?.response?.data?.error || err.message || "Đã có lỗi xảy ra khi xử lý thanh toán.";
                setError(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (paymentStatus) {
        return (
            <div className="container py-5">
                <div className="d-flex align-items-center mb-3">
                    <span className="badge bg-primary rounded-pill me-2">3/3</span>
                    <h2 className="fw-bold mb-0">Kết quả thanh toán</h2>
                </div>
                <div
                    className={`alert alert-${
                        paymentStatus === "success" || paymentStatus === "completed"
                            ? "success"
                            : paymentStatus === "pending"
                                ? "warning"
                                : "danger"
                    } shadow-sm rounded-4`}
                >
                    <h5 className="mb-1">
                        {paymentStatus === "success" || paymentStatus === "completed"
                            ? "Thanh toán thành công!"
                            : paymentStatus === "pending"
                                ? "Đang xử lý thanh toán"
                                : "Thanh toán thất bại"}
                    </h5>
                    <p className="mb-3">
                        {paymentMessage ||
                            (paymentStatus === "success" || paymentStatus === "completed"
                                ? "Đơn hàng của bạn đã được xử lý thành công."
                                : paymentStatus === "pending"
                                    ? "Vui lòng chờ trong giây lát, chúng tôi đang xác nhận giao dịch."
                                    : "Đã có lỗi xảy ra trong quá trình thanh toán.")}
                    </p>
                    <div className="d-flex gap-2">
                        <button className="btn btn-primary rounded-pill px-4" onClick={() => navigate("/")}>
                            Về trang chủ
                        </button>
                        {(paymentStatus === "success" || paymentStatus === "completed" || paymentStatus === "pending") &&
                            returnOrderId && (
                                <button
                                    className="btn btn-outline-primary rounded-pill px-4"
                                    onClick={() => navigate(`/orders/${returnOrderId}`)}
                                >
                                    Xem đơn hàng
                                </button>
                            )}
                    </div>
                </div>
            </div>
        );
    }

    if ((!orderItems || !orderItems.length) && !cartData) {
        return (
            <div className="container py-5">
                <div className="alert alert-warning rounded-4 d-flex align-items-center gap-3">
                    <div className="spinner-border spinner-border-sm" role="status"/>
                    <div>
                        <h6 className="mb-0">Đang tải thông tin đơn hàng...</h6>
                        <small className="text-muted">Vui lòng đợi trong giây lát.</small>
                    </div>
                </div>
            </div>
        );
    }

    const currentBookingInfo = {
        room: effectiveRoom,
        service: stateServiceInfo || bookingInfo?.service || null,
        selected_date: stateSelectedDate || bookingInfo?.selected_date || cartData?.booking_info?.selected_date,
        selected_time_slot:
            stateSelectedTime || bookingInfo?.selected_time_slot || cartData?.booking_info?.selected_time_slot,

    };

    const currentOrderItems = orderItems || [];

    const nearProgress = useMemo(() => {
        const notEnough = minNeededForBestVoucher;
        if (!notEnough || notEnough <= 0) return null;
        const minTarget = Number(baseTotal) + Number(notEnough);
        const pct = Math.min(100, Math.round((Number(baseTotal) / minTarget) * 100));
        return {pct, target: minTarget};
    }, [minNeededForBestVoucher, baseTotal]);

    return (
        <div style={styles.page}>
            <div className="container-xxl py-5">
                <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
                    <h2 className="fw-bold mb-0">Xác nhận & Thanh toán</h2>
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center gap-2">
                            <span className="badge rounded-pill bg-success">1</span>
                            <small className="text-muted">Giỏ hàng</small>
                        </div>
                        <i className="fas fa-chevron-right text-muted"/>
                        <div className="d-flex align-items-center gap-2">
                            <span className="badge rounded-pill bg-primary">2</span>
                            <small className="text-muted">Thanh toán</small>
                        </div>
                        <i className="fas fa-chevron-right text-muted"/>
                        <div className="d-flex align-items-center gap-2">
                            <span className="badge rounded-pill bg-secondary">3</span>
                            <small className="text-muted">Hoàn tất</small>
                        </div>
                    </div>
                </div>

                {error && <div className="alert alert-danger rounded-4 shadow-sm">{error}</div>}

                <div className="row g-4">
                    <div className="col-lg-5 order-lg-1">
                        <div style={styles.sticky}>
                            <div className="card border-0 rounded-4 shadow-sm mb-3" style={styles.glass}>
                                <div className="card-body p-4">
                                    <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
                                        {currentBookingInfo.service && (
                                            <span className="badge bg-primary-subtle text-primary">
                        <i className="fas fa-party-horn me-1"/> Dịch vụ: {currentBookingInfo.service.name}
                      </span>
                                        )}
                                        {currentBookingInfo.room && (
                                            <span className="badge bg-success-subtle text-success">
                        <i className="fas fa-door-open me-1"/> Phòng: {currentBookingInfo.room.name}
                      </span>
                                        )}
                                        <span className="badge bg-warning-subtle text-warning">
                      <i className="fas fa-calendar-day me-1"/> {currentBookingInfo.selected_date}
                    </span>
                                        <span className="badge bg-info-subtle text-info">
                      <i className="fas fa-clock me-1"/> {formatTimeSlot(currentBookingInfo.selected_time_slot)}
                    </span>
                                    </div>
                                </div>
                            </div>

                            <div className="card border-0 rounded-4 shadow-sm mb-3" style={styles.glass}>
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <h5 className="fw-bold mb-0">🧾 Chi tiết đơn</h5>
                                        <span className="badge rounded-pill bg-dark-subtle text-dark">
      {currentOrderItems.length} món
    </span>
                                    </div>

                                    {currentOrderItems.length > 0 && (
                                        <div className="table-responsive mb-3">
                                            <table className="table table-sm align-middle mb-0">
                                                <thead>
                                                <tr className="text-muted">
                                                    <th>Món ăn</th>
                                                    <th className="text-center">SL</th>
                                                    <th className="text-end">Đơn giá</th>
                                                    <th className="text-end">Thành tiền</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {currentOrderItems.map((item, index) => (
                                                    <tr key={item.menu_id || index}>
                                                        <td>{item.name || `Món #${item.menu_id}`}</td>
                                                        <td className="text-center">{item.quantity}</td>
                                                        <td className="text-end">{formatCurrency(item.price)}</td>
                                                        <td className="text-end">{formatCurrency(item.price * item.quantity)}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    <hr/>

                                    <div className="d-flex justify-content-between small mb-2">
                                        <span>Tiền món ăn</span>
                                        <span className="fw-semibold">{formatCurrency(foodTotal)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between small mb-2">
                                        <span>Tiền phòng (cố định)</span>
                                        <span className="fw-semibold">{formatCurrency(roomFixed)}</span>
                                    </div>

                                    <div className="my-2"/>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Tạm tính</span>
                                        <span className="fw-semibold">{formatCurrency(baseTotal)}</span>
                                    </div>

                                    {discount > 0 && (
                                        <div className="d-flex justify-content-between mb-2 text-success">
                                            <span>Voucher giảm</span>
                                            <span>- {formatCurrency(discount)}</span>
                                        </div>
                                    )}

                                    <div className="d-flex justify-content-between align-items-center py-2 border-top">
                                        <h5 className="fw-bold mb-0">Tổng sau giảm</h5>
                                        <h5 className="fw-bold text-primary mb-0">{formatCurrency(finalTotal)}</h5>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="small text-muted">Thanh toán trước (30%)</span>
                                        <h4 className="fw-bold text-success mb-0">{formatCurrency(depositAmount)}</h4>
                                    </div>
                                </div>
                            </div>

                            <div className="card border-0 rounded-4 shadow-sm" style={styles.glass}>
                                <div className="card-body p-3">
                                    <div className="d-flex align-items-start gap-3">
                                        <i className="fas fa-circle-info text-warning fs-4"/>
                                        <ul className="mb-0 small">
                                            <li>Đơn hàng sẽ được giữ trong 15 phút sau khi tạo.</li>
                                            <li>Vui lòng hoàn tất thanh toán trong thời gian quy định.</li>
                                            <li>Nếu thanh toán thất bại, bạn có thể thực hiện lại.</li>
                                            {selectedMethod === "vnpay" ? (
                                                <>
                                                    <li>VNPay hỗ trợ thẻ ATM nội địa, thẻ tín dụng/ghi nợ quốc tế.</li>
                                                    <li>Đảm bảo tài khoản của bạn có đủ số dư để thanh toán.</li>
                                                </>
                                            ) : (
                                                <li>Đảm bảo tài khoản MoMo có đủ số dư để thanh toán.</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center mt-3">
                                <small className="text-muted">🔒 Thanh toán được mã hóa và bảo mật</small>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-7 order-lg-2">
                        <div className="card border-0 rounded-4 shadow-sm mb-4" style={styles.glass}>
                            <div className="card-body p-4">
                                <h5 className="fw-bold mb-3">💳 Chọn phương thức thanh toán</h5>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div
                                            className="card h-100 rounded-4"
                                            style={styles.methodCard(selectedMethod === "momo")}
                                            onClick={() => handleSelect("momo")}
                                            role="button"
                                            aria-pressed={selectedMethod === "momo"}
                                        >
                                            <div className="card-body p-4 text-center">
                                                <img
                                                    src="https://developers.momo.vn/v3/assets/images/square-logo.svg"
                                                    alt="MoMo"
                                                    style={{width: 56, height: 56}}
                                                    className="mb-2"
                                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                                />
                                                <h6 className="fw-bold mb-1">MoMo</h6>
                                                <small className="text-muted d-block">Thanh toán qua ví MoMo</small>
                                                {selectedMethod === "momo" &&
                                                    <span className="badge bg-primary mt-2">✓ Đã chọn</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div
                                            className="card h-100 rounded-4"
                                            style={styles.methodCard(selectedMethod === "vnpay")}
                                            onClick={() => handleSelect("vnpay")}
                                            role="button"
                                            aria-pressed={selectedMethod === "vnpay"}
                                        >
                                            <div className="card-body p-4 text-center">
                                                <img
                                                    src="https://sandbox.vnpayment.vn/paymentv2/images/img/logo_icon.png"
                                                    alt="VNPay"
                                                    style={{width: 80, height: 40}}
                                                    className="mb-2"
                                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                                />
                                                <h6 className="fw-bold mb-1">VNPay</h6>
                                                <small className="text-muted d-block">Cổng thanh toán VNPay</small>
                                                {selectedMethod === "vnpay" &&
                                                    <span className="badge bg-primary mt-2">✓ Đã chọn</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedMethod && (
                                    <div className="alert alert-info rounded-4 mt-3 mb-0">
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="fas fa-shield-halved"/>
                                            <small>
                                                Bạn sẽ được chuyển
                                                đến {selectedMethod === "momo" ? "ứng dụng MoMo" : "cổng VNPay"} để hoàn
                                                tất
                                                giao dịch.
                                            </small>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card border-0 rounded-4 shadow-sm" style={styles.glass}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h5 className="fw-bold mb-0">🎟️ Voucher</h5>
                                    <div style={styles.voucherHeaderPill}
                                         className="text-primary d-flex align-items-center gap-2">
                                        <i className="fa-solid fa-ticket"/>
                                        <span>{eligibleCount} voucher khả dụng</span>
                                    </div>
                                </div>

                                {/* Banner thông báo cho Voucher */}
                                {voucherNotice && (
                                    <div
                                        className={`alert alert-${voucherNotice.type} rounded-4 border-0 shadow-sm mb-3`}
                                        role="alert"
                                        style={{
                                            background:
                                                voucherNotice.type === "success"
                                                    ? "linear-gradient(180deg, rgba(34,197,94,.08), #fff)"
                                                    : voucherNotice.type === "warning"
                                                        ? "linear-gradient(180deg, rgba(245,158,11,.1), #fff)"
                                                        : voucherNotice.type === "danger"
                                                            ? "linear-gradient(180deg, rgba(239,68,68,.08), #fff)"
                                                            : "linear-gradient(180deg, rgba(59,130,246,.08), #fff)",
                                        }}
                                    >
                                        <div className="d-flex align-items-start">
                                            <i
                                                className={
                                                    voucherNotice.type === "success"
                                                        ? "fas fa-circle-check text-success me-2 mt-1"
                                                        : voucherNotice.type === "warning"
                                                            ? "fas fa-triangle-exclamation text-warning me-2 mt-1"
                                                            : voucherNotice.type === "danger"
                                                                ? "fas fa-circle-exclamation text-danger me-2 mt-1"
                                                                : "fas fa-circle-info text-primary me-2 mt-1"
                                                }
                                            />
                                            <div className="flex-grow-1">
                                                <div className="fw-semibold">{voucherNotice.title}</div>
                                                <div className="small text-muted">{voucherNotice.message}</div>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-link text-muted"
                                                onClick={closeVoucherNotice}
                                                aria-label="Đóng"
                                            >
                                                <i className="fas fa-xmark"/>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="row g-3"
                                     style={{maxHeight: 320, overflowY: "auto", overscrollBehavior: "contain"}}>
                                    {filteredVouchers.length ? (
                                        filteredVouchers.map((v) => {
                                            const eligible = isVoucherEligible(v);
                                            const active = String(voucherId) === String(v.id);
                                            const valueBadge = v.type === "percent" ? `${v.value}%` : formatCurrency(v.value);
                                            return (
                                                <div className="col-12 col-md-6" key={v.id}>
                                                    <div
                                                        className="card rounded-4 h-100"
                                                        style={styles.voucherCard(active, !eligible, v.used_by_user)}
                                                        onClick={() => {
                                                            if (!eligible || v.used_by_user) return;
                                                            onChangeVoucher(String(v.id));
                                                        }}
                                                        role="button"
                                                        aria-pressed={active}
                                                        aria-disabled={!eligible || v.used_by_user}
                                                    >
                                                        <div className="card-body p-3">
                                                            <div
                                                                className="d-flex align-items-start justify-content-between">
                                                                <div>
                                                                    <div
                                                                        className="fw-semibold mb-1">{v.title || "Voucher"}</div>
                                                                    <div className="small text-muted">
                                                                        Đơn tối
                                                                        thiểu {formatCurrency(v.min_order_total || 0)}
                                                                    </div>
                                                                    {(v.start_date || v.end_date) && (
                                                                        <div className="small text-muted">
                                                                            Hiệu
                                                                            lực {v.start_date ? fmtDate(v.start_date) : "—"} -{" "}
                                                                            {v.end_date ? fmtDate(v.end_date) : "—"}
                                                                        </div>
                                                                    )}

                                                                    {/* Lý do không đủ điều kiện / đã dùng */}
                                                                    {(!eligible || v.used_by_user) && (
                                                                        <div className="small mt-2">
                                      <span className={v.used_by_user ? "text-danger" : "text-muted"}>
                                        {v.used_by_user ? "Voucher đã sử dụng." : reasonForIneligible(v)}
                                      </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-end">
                                  <span
                                      className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-2">
                                    {valueBadge}
                                  </span>
                                                                    <div className="mt-2">
                                                                        {active ? (
                                                                            <i className="fas fa-check-circle text-success"/>
                                                                        ) : (
                                                                            <i
                                                                                className={`far fa-circle ${
                                                                                    eligible && !v.used_by_user ? "text-success" : "text-muted"
                                                                                }`}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {v.used_by_user && (
                                                            <span
                                                                className="position-absolute top-0 end-0 badge bg-danger m-2">Đã sử dụng</span>
                                                        )}
                                                        {!v.used_by_user && !eligible && (
                                                            <span
                                                                className="position-absolute top-0 end-0 badge bg-secondary m-2">
                                Chưa đủ điều kiện
                              </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="col-12">
                                            <div className="text-muted small">Không có voucher khả dụng.</div>
                                        </div>
                                    )}
                                </div>

                                {!voucher && minNeededForBestVoucher && (
                                    <div className="mt-3 p-2" style={styles.voucherHint}>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <small className="text-muted">
                                                Thêm <strong
                                                className="text-dark">{formatCurrency(minNeededForBestVoucher)}</strong> để
                                                mở khóa
                                                voucher sắp đủ điều kiện.
                                            </small>
                                            <i className="fa-solid fa-bolt text-warning"/>
                                        </div>
                                        {nearProgress && (
                                            <div className="mt-2" style={styles.progressWrap}>
                                                <div style={styles.progressBar(nearProgress.pct)}/>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {voucher && (
                                    <div className="d-flex align-items-center justify-content-between p-3 mt-3"
                                         style={styles.appliedPill}>
                                        <div className="small">
                                            Đang áp dụng: <strong>{voucher.title}</strong>{" "}
                                            {voucher.type === "percent" ? `${voucher.value}%` : `${formatCurrency(voucher.value)}`}
                                            {lackAmountText(voucher) ? (
                                                <span className="text-warning ms-2">({lackAmountText(voucher)})</span>
                                            ) : null}
                                        </div>
                                        <button
                                            className="btn btn-sm btn-outline-success rounded-pill"
                                            onClick={() => {
                                                setVoucher(null);
                                                setVoucherId("");
                                            }}
                                        >
                                            Bỏ chọn
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="d-none d-lg-block mt-3">
                            <button
                                className="btn btn-success btn-lg w-100 rounded-pill py-3 shadow-sm"
                                style={styles.cta}
                                onClick={handleConfirm}
                                disabled={isLoading || !selectedMethod}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"/> Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        🚀 Thanh toán {formatCurrency(depositAmount)}
                                        {selectedMethod && <span
                                            className="ms-2">qua {selectedMethod === "momo" ? "MoMo" : "VNPay"}</span>}
                                    </>
                                )}
                            </button>
                            {!selectedMethod && (
                                <div className="text-center text-muted mt-2">
                                    <small>Vui lòng chọn phương thức thanh toán</small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {selectedMethod && (
                    <div className="d-lg-none fixed-bottom" style={{zIndex: 1030}}>
                        <div className="border-top" style={styles.glass}>
                            <div className="container-xxl py-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div className="small text-muted">Thanh toán trước (30%)</div>
                                        <div className="fw-bold">{formatCurrency(depositAmount)}</div>
                                    </div>
                                    <button
                                        className="btn btn-success rounded-pill px-4 py-2 shadow-sm"
                                        style={styles.cta}
                                        onClick={handleConfirm}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Đang xử lý..." : `Thanh toán ${formatCurrency(depositAmount)}`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="d-lg-none" style={{height: selectedMethod ? 84 : 0}}/>
            </div>
        </div>
    );
}
