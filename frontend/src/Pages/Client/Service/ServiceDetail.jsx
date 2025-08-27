import React, {useEffect, useState} from "react";
import {useParams, Link, useNavigate} from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import {getUserFromStorage} from "../../../services/authService.js";
import {ToastContainer, toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ServiceDetail() {
    const {id} = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [menus, setMenus] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [selectedMenus, setSelectedMenus] = useState([]);
    const [cartMenuIds, setCartMenuIds] = useState([]);
    const [cartMenusData, setCartMenusData] = useState([]);
    const [locationTypes, setLocationTypes] = useState([]);
    const [selectedLocationType, setSelectedLocationType] = useState(null);
    const [lockedLocationTypeId, setLockedLocationTypeId] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [roomSlots, setRoomSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showRoomDetailModal, setShowRoomDetailModal] = useState(false);
    const [selectedLocationTypeForModal, setSelectedLocationTypeForModal] = useState(null);
    const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedRoomInfo, setSelectedRoomInfo] = useState(null);

    const currentUser = getUserFromStorage();
    const userId = currentUser ? currentUser.id : null;

    const MIN_ITEMS_REQUIRED = 5; // tối thiểu 5 món

    // ============== Helpers ==============
    const MIN_OFFSET_DAYS = 7; // chỉ cho đặt sau 7 ngày

    const toYMD = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

// Lấy danh sách ngày, bắt đầu từ hôm nay + offset (mặc định 7 ngày)
    const getNextDays = (days = 30, offsetDays = MIN_OFFSET_DAYS) => {
        const dates = [];
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() + offsetDays);
        for (let i = 0; i < days; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            dates.push(toYMD(d));
        }
        return dates;
    };


    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {weekday: "short", day: "2-digit", month: "2-digit"});
    };

    const getTimeSlotLabel = (timeSlot) =>
        timeSlot === "morning" ? "Buổi sáng (8:00-12:00)" : "Buổi chiều (13:00-17:00)";

    const getFilteredSlots = (roomId) =>
        roomSlots.filter((slot) => slot.room_id === roomId && slot.slot_date === selectedDate);


    const currentServiceCartCount = cartMenuIds.length;
    const totalSelectedCount = currentServiceCartCount + selectedMenus.length;
    const remainingToMin = Math.max(0, MIN_ITEMS_REQUIRED - totalSelectedCount);

    // ============== Actions ==============
    const handleToggleMenu = (menu) => {
        if (cartMenuIds.includes(menu.id)) {
            toast.info(`Món "${menu.name}" đã có trong giỏ hàng và không thể chọn lại.`);
            return;
        }
        setSelectedMenus((prev) =>
            prev.find((m) => m.id === menu.id) ? prev.filter((m) => m.id !== menu.id) : [...prev, menu]
        );
    };

    // New: click địa điểm = chọn + mở modal luôn
    const handleOpenLocationType = async (locationType) => {
        setSelectedLocationType(locationType);
        setLockedLocationTypeId(locationType.id);
        setSelectedRoomInfo(null);
        setSelectedSlot(null);

        try {
            const res = await axios.get("http://localhost:8000/api/cart-details");
            const userCart = res.data.filter((item) => item.user_id === userId);
            if (userCart.length > 0) {
                await updateLocationTypeInCart(locationType);
            }
        } catch (error) {
            console.error("Lỗi khi kiểm tra giỏ hàng:", error);
            toast.error(`Lỗi khi kiểm tra giỏ hàng: ${error.response?.data?.message || error.message}`);
        }

        setSelectedLocationTypeForModal(locationType);
        setShowRoomModal(true);
        try {
            const response = await axios.get(`http://localhost:8000/api/rooms?location_type_id=${locationType.id}`);
            setRooms(response.data);
        } catch (error) {
            console.error("Lỗi khi tải danh sách phòng:", error);
            toast.error(`Lỗi khi tải danh sách phòng: ${error.response?.data?.message || error.message}`);
            setRooms([]);
        }
    };

    const handleSelectSlot = async (slot, room) => {
        if (!slot) {
            toast.warn("Vui lòng chọn một lịch cụ thể trước khi xác nhận.");
            return;
        }

        setSelectedSlot({ ...slot, room });
        const roomLocationType = locationTypes.find((lt) => lt.id === room.location_type_id);

        const newRoomInfo = {
            room,
            slot,
            date: slot.slot_date,
            timeSlot: slot.time_slot,
            locationType: roomLocationType,
        };

        setSelectedRoomInfo(newRoomInfo);
        if (roomLocationType) {
            setSelectedLocationType(roomLocationType);
            setLockedLocationTypeId(roomLocationType.id);
        }

        try {
            const res = await axios.get("http://localhost:8000/api/cart-details");
            const userCart = res.data.filter((item) => item.user_id === userId);
            if (userCart.length > 0) await updateRoomInCart(newRoomInfo);
        } catch (error) {
            console.error("Lỗi khi kiểm tra giỏ hàng:", error);
            toast.error(`Lỗi khi kiểm tra giỏ hàng: ${error.response?.data?.message || error.message}`);
        }

        toast.success(
            <div>
                <h6>Đã chọn lịch!</h6>
                <div className="text-start">
                    <p><strong>Loại địa điểm:</strong> {roomLocationType?.name || "N/A"}</p>
                    <p><strong>Phòng:</strong> {room.name}</p>
                    <p><strong>Ngày:</strong> {formatDate(slot.slot_date)}</p>
                    <p><strong>Giờ:</strong> {getTimeSlotLabel(slot.time_slot)}</p>
                    <p><strong>Giá:</strong> {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(room.price || 0)}</p>
                </div>
            </div>,
            { autoClose: 3000 }
        );

        handleCloseRoomModal();
        handleCloseRoomDetailModal();
    };


    const handleAddToCart = async () => {
        if (!userId) {
            const toastId = toast.info(
                <div>
                    <h6>Bạn chưa đăng nhập</h6>
                    <p>Vui lòng đăng nhập để thêm dịch vụ vào giỏ hàng.</p>
                    <button
                        className="btn btn-sm btn-primary mt-2"
                        onClick={() => {
                            toast.dismiss(toastId);
                            navigate("/login");
                        }}
                    >
                        Đăng nhập
                    </button>
                </div>,
                { autoClose: false }
            );
            return;
        }

        if (!selectedLocationType || selectedMenus.length === 0 || !selectedRoomInfo || !selectedRoomInfo.slot) {
            toast.warn("Vui lòng chọn ít nhất 1 món ăn, 1 phòng và 1 lịch cụ thể trước khi đặt dịch vụ.");
            return;
        }

        try {
            const res = await axios.get("http://localhost:8000/api/cart-details");
            const userCart = res.data.filter((item) => item.user_id === userId);

            // Vì chỉ còn 1 dịch vụ -> coi tất cả cart item là của dịch vụ hiện tại
            const currentServiceCart = userCart;
            const existingMenuIds = currentServiceCart.map((item) => item.menu_id);

            // Ràng buộc tối thiểu 5 món (tổng sau khi thêm)
            const totalAfterAdd = currentServiceCart.length + selectedMenus.length;
            if (totalAfterAdd < MIN_ITEMS_REQUIRED) {
                const need = MIN_ITEMS_REQUIRED - totalAfterAdd;
                toast.warn(`Bạn cần chọn thêm ${need} món nữa (tối thiểu ${MIN_ITEMS_REQUIRED} món)`);
                return;
            }

            // Chặn trùng
            const duplicateMenus = selectedMenus.filter((menu) => existingMenuIds.includes(menu.id));
            if (duplicateMenus.length > 0) {
                toast.error(`Món "${duplicateMenus[0].name}" đã có trong giỏ hàng.`);
                return;
            }

            const menusPayload = selectedMenus.map((menu) => ({
                menu_id: menu.id,
                quantity: 1,
                price_per_table: menu.price,
            }));

            const cartData = {
                user_id: userId,
                service_id: id,
                location_type_id: selectedLocationType?.id,
                room_id: selectedRoomInfo.room.id,
                room_slot_id: selectedRoomInfo.slot.id,
                selected_date: selectedRoomInfo.date,
                selected_time_slot: selectedRoomInfo.timeSlot,
                menus: menusPayload,
            };

            await axios.post("http://localhost:8000/api/cart-details", cartData);

            const newCartMenuIds = [...cartMenuIds, ...selectedMenus.map((m) => m.id)];
            const newCartMenusData = [...cartMenusData, ...selectedMenus];

            setCartMenuIds(newCartMenuIds);
            setCartMenusData(newCartMenusData);
            setSelectedMenus([]);

            const toastId = toast.success(
                <div>
                    <h6>Thành công!</h6>
                    <p>Đã thêm {selectedMenus.length} món vào giỏ hàng! Bạn muốn xem giỏ hàng bây giờ chứ?</p>
                    <div className="d-flex gap-2 mt-2">
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                                toast.dismiss(toastId);
                                navigate("/cart-details");
                            }}
                        >
                            Đi đến giỏ hàng
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={() => toast.dismiss(toastId)}>
                            Tiếp tục đặt thêm
                        </button>
                    </div>
                </div>,
                { autoClose: false }
            );
        } catch (error) {
            const message = error.response?.data?.message || "Thêm vào giỏ hàng thất bại.";
            toast.error(message);
        }
    };


    const handleCloseRoomModal = () => {
        setShowRoomModal(false);
        setSelectedLocationTypeForModal(null);
        setRooms([]);
        setSelectedSlot(null);
    };

    const handleShowRoomDetail = (room) => {
        setSelectedRoomDetail(room);
        setShowRoomDetailModal(true);
    };

    const handleCloseRoomDetailModal = () => {
        setShowRoomDetailModal(false);
        setSelectedRoomDetail(null);
        setSelectedSlot(null);
    };

    // ============== Cart updates ==============
    const updateRoomInCart = async (newRoomInfo) => {
        if (!userId) return;
        try {
            const res = await axios.get("http://localhost:8000/api/cart-details");
            const userCart = res.data.filter((item) => item.user_id === userId);
            if (userCart.length === 0) return;

            const updatePromises = userCart.map((item) => {
                const updateData = {
                    room_id: newRoomInfo.room.id,
                    location_type_id: newRoomInfo.locationType?.id || newRoomInfo.room.location_type_id,
                };
                if (newRoomInfo.slot && newRoomInfo.date) {
                    updateData.room_slot_id = newRoomInfo.slot.id;
                    updateData.selected_date = newRoomInfo.date;
                    updateData.selected_time_slot = newRoomInfo.timeSlot;
                } else {
                    updateData.room_slot_id = null;
                    updateData.selected_date = null;
                    updateData.selected_time_slot = null;
                }
                return axios.put(`http://localhost:8000/api/cart-details/${item.id}`, updateData);
            });
            await Promise.all(updatePromises);
            toast.success("Đã cập nhật phòng! Thông tin phòng trong giỏ hàng đã được cập nhật.");
        } catch (error) {
            console.error("Lỗi khi cập nhật phòng trong giỏ hàng:", error);
            toast.error(
                `Lỗi khi cập nhật phòng trong giỏ hàng: ${error.response?.data?.message || error.message}`
            );
        }
    };

    const updateLocationTypeInCart = async (newLocationType) => {
        if (!userId) return;
        try {
            const res = await axios.get("http://localhost:8000/api/cart-details");
            const userCart = res.data.filter((item) => item.user_id === userId);
            if (userCart.length === 0) return;

            const updatePromises = userCart.map((item) =>
                axios.put(`http://localhost:8000/api/cart-details/${item.id}`, {
                    location_type_id: newLocationType.id,
                })
            );
            await Promise.all(updatePromises);
        } catch (error) {
            console.error("Lỗi khi cập nhật loại địa điểm trong giỏ hàng:", error);
            toast.error(
                `Lỗi khi cập nhật loại địa điểm trong giỏ hàng: ${error.response?.data?.message || error.message}`
            );
        }
    };

    // ============== Effects ==============
    useEffect(() => {
        const firstAllowed = getNextDays(1, MIN_OFFSET_DAYS)[0]; // ngày đầu tiên hợp lệ (H+7)
        setSelectedDate(firstAllowed);

        const checkExistingCart = async () => {
            if (!userId) return;
            try {
                const res = await axios.get("http://localhost:8000/api/cart-details");
                const userCart = res.data.filter((item) => item.user_id === userId);

                if (userCart.length > 0) {
                    const locationType = userCart.find((i) => i.location_type !== null)?.location_type;
                    const room = userCart.find((i) => i.room !== null)?.room;
                    const firstItem = userCart[0];

                    if (locationType) {
                        setSelectedLocationType(locationType);
                        setLockedLocationTypeId(locationType.id);
                    }
                    if (room) {
                        const roomLocationType = locationType || room.location_type;
                        setSelectedRoomInfo({
                            room,
                            slot: firstItem.room_slot_id
                                ? { id: firstItem.room_slot_id, slot_date: firstItem.selected_date, time_slot: firstItem.selected_time_slot }
                                : null,
                            date: firstItem.selected_date,
                            timeSlot: firstItem.selected_time_slot,
                            locationType: roomLocationType,
                        });
                    }

                    const selectedMenuIds = userCart.map((i) => i.menu_id);
                    setCartMenuIds(selectedMenuIds);
                    await fetchCartMenusData(selectedMenuIds);
                } else {
                    setCartMenuIds([]);
                    setCartMenusData([]);
                }

            } catch (err) {
                console.error("Lỗi khi kiểm tra giỏ hàng:", err);
                toast.error(`Lỗi khi kiểm tra giỏ hàng: ${err.response?.data?.message || err.message}`);
            }
        };

        checkExistingCart();
    }, [userId, navigate, id]);

    useEffect(() => {
        axios
            .get("http://localhost:8000/api/location-types")
            .then((res) => setLocationTypes(res.data))
            .catch((err) => {
                console.error("Lỗi khi tải danh sách loại địa điểm:", err);
                toast.error(
                    `Lỗi khi tải danh sách loại địa điểm: ${err.response?.data?.message || err.message}`
                );
            });

        axios
            .get(`http://localhost:8000/api/services/${id}`)
            .then((res) => setService(res.data))
            .catch((err) => {
                console.error("Lỗi khi tải chi tiết dịch vụ:", err);
                toast.error(`Lỗi khi tải chi tiết dịch vụ: ${err.response?.data?.message || err.message}`);
            });

        axios
            .get("http://localhost:8000/api/category-menus")
            .then((res) => {
                setCategories(res.data);
                if (res.data.length > 0) {
                    setActiveCategory(res.data[0].id);
                    fetchMenus(res.data[0].id);
                }
            })
            .catch((err) => {
                console.error("Lỗi khi tải danh mục:", err);
                toast.error(`Lỗi khi tải danh mục: ${err.response?.data?.message || err.message}`);
            });

        axios
            .get("http://localhost:8000/api/room-slots")
            .then((res) => setRoomSlots(res.data))
            .catch((err) => {
                console.error("Lỗi khi tải room slots:", err);
                toast.error(`Lỗi khi tải room slots: ${err.response?.data?.message || err.message}`);
            });
    }, [id]);

    const fetchMenus = (categoryId) => {
        axios
            .get(`http://localhost:8000/api/menus?category_id=${categoryId}`)
            .then((res) => {
                const data = res.data;
                const menusData = Array.isArray(data.data)
                    ? data.data
                    : Array.isArray(data.data?.data)
                        ? data.data.data
                        : [];
                setMenus(menusData);
            })
            .catch((err) => {
                console.error("Lỗi khi tải danh sách menu:", err);
                toast.error(`Lỗi khi tải danh sách menu: ${err.response?.data?.message || err.message}`);
            });
    };

    const fetchCartMenusData = async (menuIds) => {
        if (menuIds.length === 0) {
            setCartMenusData([]);
            return;
        }
        try {
            const menuPromises = menuIds.map((menuId) => axios.get(`http://localhost:8000/api/menus/${menuId}`));
            const menuResponses = await Promise.all(menuPromises);
            const menusData = menuResponses.map((response) => response.data);
            setCartMenusData(menusData);
        } catch (error) {
            console.error("Lỗi khi tải thông tin món ăn từ giỏ hàng:", error);
            toast.error(
                `Lỗi khi tải thông tin món ăn từ giỏ hàng: ${error.response?.data?.message || error.message}`
            );
            setCartMenusData([]);
        }
    };

    // ============== Render ==============
    if (!service) return <div className="text-center py-5">Đang tải dữ liệu...</div>;

    return (
        <div className="container py-5">
            <div className="mb-4">
                <Link to="/Service" className="btn btn-outline-secondary rounded-pill px-4 shadow-sm">
                    <i className="fas fa-arrow-left me-2"></i> Quay lại
                </Link>
            </div>



            <div className="row g-4">
                {/* LEFT */}
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                        <img
                            src={`http://localhost:8000/storage/services/${service.image}`}
                            alt={service.name}
                            className="img-fluid w-100"
                            style={{maxHeight: 400, objectFit: "cover"}}
                        />
                        <div className="card-body p-4">
                            <h2 className="fw-bold">{service.name}</h2>
                            <p className="text-muted">{service.description || "Không có mô tả."}</p>
                            {/* Steps */}
                            <ul className="nav nav-pills small mb-3 flex-wrap">
                                <li className="nav-item me-2 mb-2">
                  <span className="badge bg-primary-subtle text-primary px-3 py-2">
                    <i className="fas fa-map-marker-alt me-2"/>
                    1. Địa điểm & phòng
                  </span>
                                </li>
                                <li className="nav-item me-2 mb-2">
                  <span className="badge bg-primary-subtle text-primary px-3 py-2">
                    <i className="fas fa-clock me-2"/>
                    2. Lịch
                  </span>
                                </li>
                                <li className="nav-item me-2 mb-2">
                  <span className="badge bg-primary-subtle text-primary px-3 py-2">
                    <i className="fas fa-utensils me-2"/>
                    3. Chọn món
                  </span>
                                </li>
                                <li className="nav-item mb-2">
                  <span className="badge bg-primary-subtle text-primary px-3 py-2">
                    <i className="fas fa-check-circle me-2"/>
                    4. Xác nhận
                  </span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* CHỌN MÓN ĂN */}
                    <div className="card mt-4 p-4 shadow-sm border-0 rounded-4">
                        <h4 className="fw-semibold mb-3">Chọn món ăn</h4>
                        {/* Lưu ý tối thiểu */}
                        <div className="mb-3">
                            <div
                                className="alert alert-primary border-0 rounded-4 shadow-sm d-flex align-items-center mb-2">
                                <i className="fas fa-clipboard-list me-2 fs-5"></i>
                                <span className="fw-semibold">
                                Quý khách vui lòng chọn thực đơn <strong>tối thiểu 4 món mặn + 1 tráng miệng ({MIN_ITEMS_REQUIRED} món)</strong>
                                </span>
                            </div>
                            <div className="small text-muted">
                                Đã có trong giỏ: <strong>{currentServiceCartCount}</strong> · Vừa
                                chọn: <strong>{selectedMenus.length}</strong> ·
                                Còn thiếu: <strong
                                className={remainingToMin > 0 ? "text-danger" : "text-success"}>{remainingToMin}</strong>
                            </div>
                        </div>

                        {/* Tabs danh mục */}
                        <ul className="nav nav-pills d-inline-flex justify-content-start mb-4">
                            {categories.map((cat) => (
                                <li key={cat.id} className="nav-item me-2">
                                    <button
                                        className={`d-flex py-2 px-4 border border-warning bg-white rounded-pill ${
                                            activeCategory === cat.id ? "text-dark bg-warning" : "white"
                                        }`}
                                        onClick={() => {
                                            setActiveCategory(cat.id);
                                            fetchMenus(cat.id);
                                        }}
                                    >
                                        <span className="w-100">{cat.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* Danh sách menu */}
                        {/* Danh sách menu */}
                        <div className="row row-cols-1 row-cols-md-2 g-3">
                            {menus.map((menu) => {
                                const isSelected = selectedMenus.some((m) => m.id === menu.id);
                                const isInCart = cartMenuIds.includes(menu.id);

                                return (
                                    <div key={menu.id} className="col">
                                        <div
                                            className={`card h-100 border ${
                                                isSelected ? "border-primary bg-light" : isInCart ? "border-success bg-light" : ""
                                            }`}
                                        >
                                            <div className="d-flex align-items-center p-3">
                                                <img
                                                    src={`http://localhost:8000/storage/menus/${menu.image}`}
                                                    className="rounded"
                                                    style={{ width: 60, height: 60, objectFit: "cover" }}
                                                    alt={menu.name}
                                                />
                                                <div className="ms-3 flex-grow-1">
                                                    <h6 className="mb-1 fw-semibold">{menu.name}</h6>
                                                    <small className="text-muted">
                                                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(menu.price)}
                                                    </small>
                                                    {isInCart && (
                                                        <div className="mt-1">
                                                            <small className="badge bg-success">
                                                                <i className="fas fa-shopping-cart me-1"></i>Đã có trong giỏ hàng
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    className={`btn btn-sm rounded-circle ${
                                                        isInCart || isSelected ? "btn-success" : "btn-outline-primary"
                                                    }`}
                                                    onClick={() => handleToggleMenu(menu)}
                                                    disabled={isInCart}
                                                    title={isInCart ? "Món này đã có trong giỏ hàng" : ""}
                                                >
                                                    <i className={`fas ${isInCart || isSelected ? "fa-check" : "fa-plus"}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </div>

                {/* RIGHT — CHỌN ĐỊA ĐIỂM & PHÒNG (UI mới + click = mở modal) */}
                <div className="col-lg-4">
                    <div className="card mb-4 shadow-sm border-0 overflow-hidden rounded-4">
                        {/* Header gradient nổi bật */}
                        <div
                            className="p-3 p-md-4 text-white"
                            style={{background: "rgba(207,164,96,0.85)"}}
                        >
                            <h5 className="fw-semibold mb-1">
                                <i className="fas fa-building me-2"></i> Chọn địa điểm & phòng
                            </h5>
                            <div className="small opacity-75">
                                Chọn loại địa điểm để xem phòng trống và đặt lịch ngay
                            </div>
                        </div>

                        <div className="card-body p-4">
                            {/* Nếu đã có lựa chọn */}
                            {selectedRoomInfo ? (
                                <div className="border rounded-4 p-3 bg-light">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <div className="d-flex align-items-center mb-2">
                        <span className="badge bg-success me-2">
                          <i className="fas fa-check"></i>
                        </span>
                                                <h6 className="fw-bold mb-0">Đã chọn phòng & lịch</h6>
                                            </div>
                                            <div className="mb-1">
                                                <i className="fas fa-map-marker-alt text-primary me-2"></i>
                                                <strong>Loại địa điểm:</strong>{" "}
                                                {selectedRoomInfo.locationType?.name || "N/A"}
                                            </div>
                                            <div className="mb-1">
                                                <i className="fas fa-door-open text-primary me-2"></i>
                                                <strong>Phòng:</strong> {selectedRoomInfo.room.name}
                                            </div>
                                            {selectedRoomInfo.slot && selectedRoomInfo.date && selectedRoomInfo.timeSlot ? (
                                                <>
                                                    <div className="mb-1">
                                                        <i className="fas fa-calendar text-info me-2"></i>
                                                        <strong>Ngày:</strong> {formatDate(selectedRoomInfo.date)}
                                                    </div>
                                                    <div className="mb-1">
                                                        <i className="fas fa-clock text-info me-2"></i>
                                                        <strong>Giờ:</strong> {getTimeSlotLabel(selectedRoomInfo.timeSlot)}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="mb-1">
                                                    <small className="text-muted">
                                                        <i className="fas fa-info-circle me-1"></i>
                                                        Chưa chọn lịch cụ thể
                                                    </small>
                                                </div>
                                            )}
                                            <div className="mt-2">
                        <span className="text-primary fw-semibold">
                          <i className="fas fa-dollar-sign me-1"></i>
                            {new Intl.NumberFormat("vi-VN", {style: "currency", currency: "VND"}).format(
                                selectedRoomInfo.room.price || 0
                            )}
                        </span>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-sm btn-outline-danger ms-2 rounded-circle"
                                            onClick={() => {
                                                setSelectedRoomInfo(null);
                                                setSelectedLocationType(null);
                                                setLockedLocationTypeId(null);
                                                setSelectedSlot(null);
                                            }}
                                            title="Bỏ chọn"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Danh sách location types dạng card hiện đại — CLICK = MỞ MODAL (không còn icon con mắt)
                                <>
                                    <p className="text-muted mb-3">
                                        <i className="fas fa-info-circle me-2"></i>
                                        Chọn một loại địa điểm bên dưới để xem phòng trống.
                                    </p>

                                    <div className="row g-3">
                                        {locationTypes.map((lt) => {
                                            const isActive = selectedLocationType?.id === lt.id;
                                            return (
                                                <div key={lt.id} className="col-12">
                                                    <div
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => handleOpenLocationType(lt)}
                                                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleOpenLocationType(lt); }}
                                                        className={`border rounded-4 p-3 d-flex align-items-start justify-content-between ${
                                                            isActive ? "border-primary shadow-sm" : "border-light"
                                                        }`}
                                                        style={{ cursor: "pointer", transition: "transform .15s ease, box-shadow .15s ease" }}
                                                    >
                                                        <div className="d-flex align-items-start">
                                                            <div
                                                                className="me-3 rounded-circle d-flex align-items-center justify-content-center"
                                                                style={{ width: 42, height: 42, background: isActive ? "#e9ecef" : "#f8f9fa" }}
                                                            >
                                                                <i className={`fas fa-map-marker-alt ${isActive ? "text-primary" : "text-secondary"}`} />
                                                            </div>
                                                            <div>
                                                                <div className="fw-semibold">{lt.name}</div>
                                                                <small className="text-muted">{lt.descriptions}</small>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-center">
                                                            <i className="fas fa-chevron-right text-secondary"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Danh sách món mới chọn */}
                    {selectedMenus.length > 0 && (
                        <div className="card p-4 shadow-sm border-0 rounded-4">
                            <h5 className="fw-semibold mb-3">
                                <i className="fas fa-utensils text-warning me-2"></i>
                                Món ăn mới chọn ({selectedMenus.length})
                            </h5>
                            <div className="bg-opacity-10 rounded p-3 mb-3">
                                <ul className="list-group list-group-flush mb-0">
                                    {selectedMenus.map((m) => (
                                        <li
                                            key={m.id}
                                            className="list-group-item d-flex justify-content-between align-items-center px-0 py-2 border-0 bg-transparent"
                                        >
                                            <div className="d-flex align-items-center">
                                                <img
                                                    src={`http://localhost:8000/storage/menus/${m.image}`}
                                                    className="rounded me-2"
                                                    style={{width: 30, height: 30, objectFit: "cover"}}
                                                    alt={m.name}
                                                />
                                                <span className="small fw-medium">{m.name}</span>
                                            </div>
                                            <div className="d-flex align-items-center">
                        <span className="badge bg-warning text-dark me-2">
                          <i className="fas fa-dollar-sign"></i>
                        </span>
                                                <span className="small text-primary fw-semibold">
                          {new Intl.NumberFormat("vi-VN").format(m.price)}đ
                        </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-3 pt-2 border-top">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="fw-semibold text-black">Tổng món mới:</span>
                                        <span className="fw-bold text-black">
                      {new Intl.NumberFormat("vi-VN", {style: "currency", currency: "VND"}).format(
                          selectedMenus.reduce((total, menu) => {
                              const price = Number(menu.price);
                              return total + (isNaN(price) ? 0 : price);
                          }, 0)
                      )}
                    </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                className="btn btn-primary w-100 rounded-pill"
                                onClick={handleAddToCart}
                                disabled={!selectedRoomInfo || !selectedRoomInfo.slot || remainingToMin > 0}
                            >
                                {!selectedRoomInfo || !selectedRoomInfo.slot
                                    ? "Vui lòng chọn phòng và lịch trước"
                                    : remainingToMin > 0
                                        ? `Cần chọn thêm ${remainingToMin} món (tối thiểu ${MIN_ITEMS_REQUIRED})`
                                        : "Thêm vào giỏ hàng"}
                            </button>


                        </div>
                    )}
                </div>
            </div>

            {/* Modal phòng */}{showRoomModal && (
            <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable modal-fullscreen-md-down">
                    <div className="modal-content" style={{ maxHeight: "90vh" }}>
                        {/* Header sticky */}
                        <div className="modal-header sticky-top bg-white" style={{ zIndex: 2 }}>
                            <h5 className="modal-title">
                                <i className="fas fa-door-open me-2"></i>
                                Danh sách phòng - {selectedLocationTypeForModal?.name}
                            </h5>
                            <button type="button" className="btn-close" onClick={handleCloseRoomModal}></button>
                        </div>

                        {/* Body scrollable */}
                        <div className="modal-body pb-4" style={{ overflowY: "auto" }}>
                            <div className="mb-4">
                                <div className="card border-0 bg-light">
                                    <div className="card-body p-3">
                                        <h6 className="fw-semibold mb-3">
                                            <i className="fas fa-calendar-alt text-primary me-2"></i>
                                            Chọn ngày để xem lịch trống
                                        </h6>
                                        <div className="small text-muted mb-2">
                                            Khách lưu ý: Chỉ nhận đặt lịch từ {MIN_OFFSET_DAYS} ngày sau hôm nay.
                                        </div>

                                        <div className="d-flex flex-nowrap gap-2 overflow-auto pb-2">
                                            {getNextDays(30, MIN_OFFSET_DAYS).map((date) => (
                                                <button
                                                    key={date}
                                                    className={`btn ${selectedDate === date ? "btn-primary" : "btn-outline-primary"} btn-sm rounded-pill flex-shrink-0`}
                                                    onClick={() => setSelectedDate(date)}
                                                    title={date}
                                                >
                                                    {formatDate(date)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {rooms.length > 0 ? (
                                <div className="row g-4">
                                    {rooms.map((room) => {
                                        const roomSlotsForDate = getFilteredSlots(room.id);
                                        const hasAvailableSlots = roomSlotsForDate.some((slot) => slot.is_available);

                                        return (
                                            <div key={room.id} className="col-lg-6 col-xl-4">
                                                <div className="card h-100 shadow-sm border-0 rounded-4">
                                                    <div className="position-relative">
                                                        <img
                                                            src={`http://localhost:8000/storage/rooms/${room.image}`}
                                                            alt={room.name}
                                                            className="card-img-top rounded-top-4"
                                                            style={{ height: "180px", objectFit: "cover" }}
                                                        />
                                                        <div className="position-absolute top-0 end-0 m-2">
                          <span className={`badge ${room.status === "available" ? "bg-success" : "bg-danger"}`}>
                            {room.status === "available" ? "Hoạt động" : "Tạm dừng"}
                          </span>
                                                        </div>
                                                    </div>

                                                    <div className="card-body d-flex flex-column p-3">
                                                        <h6 className="card-title fw-bold mb-2">{room.name}</h6>
                                                        <div className="mb-3">
                                                            <p className="card-text text-muted small mb-1">
                                                                <i className="fas fa-users me-1"></i> {room.capacity} người
                                                            </p>
                                                            <p className="card-text text-primary fw-semibold mb-0">
                                                                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(room.price || 0)}
                                                            </p>
                                                        </div>

                                                        <div className="mb-3 flex-grow-1">
                                                            <h6 className="fw-semibold mb-2 small">
                                                                <i className="fas fa-clock text-primary me-1"></i>
                                                                Lịch ngày {formatDate(selectedDate)}:
                                                            </h6>

                                                            {roomSlotsForDate.length > 0 ? (
                                                                <div className="d-flex flex-column gap-2">
                                                                    {roomSlotsForDate.map((slot) => (
                                                                        <div key={slot.id} className="d-flex justify-content-between align-items-center">
                                                                            <span className="small">{getTimeSlotLabel(slot.time_slot)}</span>
                                                                            <button
                                                                                className={`btn btn-sm ${slot.is_available ? "btn-success" : "btn-danger"} ${
                                                                                    selectedSlot?.id === slot.id ? "btn-primary" : ""
                                                                                }`}
                                                                                onClick={() => slot.is_available && setSelectedSlot({ ...slot, room })}
                                                                                disabled={!slot.is_available}
                                                                            >
                                                                                {slot.is_available ? "Chọn" : "Đã đặt"}
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-2">
                                                                    <small className="text-muted">
                                                                        <i className="fas fa-calendar-times me-1"></i>
                                                                        Chưa có lịch
                                                                    </small>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="mt-auto d-flex gap-2">
                                                            <button
                                                                className="btn btn-outline-primary btn-sm flex-grow-1"
                                                                onClick={() => handleShowRoomDetail(room)}
                                                            >
                                                                <i className="fas fa-info-circle me-1"></i> Chi tiết
                                                            </button>
                                                            <button
                                                                className="btn btn-primary btn-sm flex-grow-1"
                                                                onClick={() => handleSelectSlot(selectedSlot, room)}
                                                                disabled={
                                                                    room.status !== "available" ||
                                                                    !hasAvailableSlots ||
                                                                    !selectedSlot ||
                                                                    selectedSlot.room?.id !== room.id
                                                                }
                                                            >
                                                                <i className="fas fa-check me-1"></i> Chọn phòng
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-5">
                                    <i className="fas fa-home fa-3x text-muted mb-3"></i>
                                    <p className="text-muted">Không có phòng nào thuộc loại địa điểm này.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer sticky */}
                        <div className="modal-footer bg-white" style={{ position: "sticky", bottom: 0, zIndex: 2 }}>
                            <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={handleCloseRoomModal}>
                                <i className="fas fa-times me-2"></i>Đóng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}


            {/* Modal chi tiết phòng */}
            {showRoomDetailModal && selectedRoomDetail && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-md-down">
                        <div className="modal-content" style={{ maxHeight: "90vh" }}>
                            {/* Header sticky */}
                            <div className="modal-header sticky-top bg-white" style={{ zIndex: 2 }}>
                                <h5 className="modal-title">Chi tiết phòng - {selectedRoomDetail.name}</h5>
                                <button type="button" className="btn-close" onClick={handleCloseRoomDetailModal}></button>
                            </div>

                            {/* Body scrollable */}
                            <div className="modal-body pb-4" style={{ overflowY: "auto" }}>
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <img
                                            src={`http://localhost:8000/storage/rooms/${selectedRoomDetail.image}`}
                                            alt={selectedRoomDetail.name}
                                            className="img-fluid rounded shadow w-100"
                                            style={{ height: "300px", objectFit: "cover" }}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <h4 className="mb-3 fw-bold">{selectedRoomDetail.name}</h4>

                                        <div className="mb-3">
                                            <p className="mb-2">
                                                <strong>
                                                    <i className="fas fa-map-marker-alt text-primary me-2"></i>Loại phòng:
                                                </strong>
                                                <span className="ms-1">{selectedLocationTypeForModal?.name}</span>
                                            </p>
                                            <p className="mb-2">
                                                <strong>
                                                    <i className="fas fa-users text-primary me-2"></i>Sức chứa:
                                                </strong>
                                                <span className="ms-1">{selectedRoomDetail.capacity} người</span>
                                            </p>
                                            <p className="mb-2">
                                                <strong>
                                                    <i className="fas fa-dollar-sign text-primary me-2"></i>Giá phòng:
                                                </strong>
                                                <span className="text-primary fw-semibold ms-1">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                        selectedRoomDetail.price || 0
                    )}
                  </span>
                                            </p>
                                            <p className="mb-3">
                                                <strong>
                                                    <i className="fas fa-info-circle text-primary me-2"></i>Trạng thái:
                                                </strong>{" "}
                                                <span className={selectedRoomDetail.status === "available" ? "badge bg-success" : "badge bg-danger"}>
                    {selectedRoomDetail.status === "available" ? "✅ Còn trống" : "❌ Đã đặt"}
                  </span>
                                            </p>
                                        </div>

                                        {selectedRoomDetail.description && (
                                            <div className="mb-3">
                                                <strong>
                                                    <i className="fas fa-file-alt text-primary me-2"></i>Mô tả:
                                                </strong>
                                                <div className="mt-2 p-3 bg-light rounded">
                                                    {selectedRoomDetail.description.split("\n").map((line, idx) => (
                                                        <p key={idx} className="mb-1 text-muted">
                                                            {line}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mb-3">
                                            <strong>
                                                <i className="fas fa-calendar-week text-primary me-2"></i>Chọn lịch ngày {formatDate(selectedDate)}:
                                            </strong>
                                            <div className="mt-2">
                                                {getFilteredSlots(selectedRoomDetail.id).length > 0 ? (
                                                    <div className="d-flex flex-column gap-2">
                                                        {getFilteredSlots(selectedRoomDetail.id).map((slot) => (
                                                            <div key={slot.id} className="d-flex justify-content-between align-items-center">
                                                                <span className="small">{getTimeSlotLabel(slot.time_slot)}</span>
                                                                <button
                                                                    className={`btn btn-sm ${slot.is_available ? "btn-success" : "btn-danger"} ${
                                                                        selectedSlot?.id === slot.id ? "btn-primary" : ""
                                                                    }`}
                                                                    onClick={() => slot.is_available && setSelectedSlot({ ...slot, room: selectedRoomDetail })}
                                                                    disabled={!slot.is_available}
                                                                >
                                                                    {slot.is_available ? "Chọn" : "Đã đặt"}
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-2">
                                                        <small className="text-muted">
                                                            <i className="fas fa-calendar-times me-1"></i>
                                                            Chưa có lịch
                                                        </small>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer sticky */}
                            <div className="modal-footer bg-white" style={{ position: "sticky", bottom: 0, zIndex: 2 }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary rounded-pill px-4"
                                    onClick={handleCloseRoomDetailModal}
                                >
                                    <i className="fas fa-times me-1"></i> Đóng
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary rounded-pill px-4"
                                    onClick={() => {
                                        handleSelectSlot(selectedSlot, selectedRoomDetail);
                                        handleCloseRoomDetailModal();
                                        handleCloseRoomModal();
                                    }}
                                    disabled={
                                        selectedRoomDetail.status !== "available" ||
                                        !selectedSlot ||
                                        selectedSlot.room?.id !== selectedRoomDetail.id
                                    }
                                >
                                    <i className="fas fa-check me-1"></i> Chọn phòng & lịch
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            <ToastContainer position="bottom-right"/>
        </div>
    );
}

export default ServiceDetail;
