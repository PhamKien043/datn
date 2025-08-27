import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

function RoomDetail() {
    const { id } = useParams(); // location_type_id
    const [locationType, setLocationType] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [roomSlots, setRoomSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const locationResponse = await axios.get(`http://localhost:8000/api/location-types/${id}`);
                setLocationType(locationResponse.data);

                const roomsResponse = await axios.get(`http://localhost:8000/api/rooms?location_type_id=${id}`);
                setRooms(roomsResponse.data);

                const slotsResponse = await axios.get("http://localhost:8000/api/room-slots");
                setRoomSlots(slotsResponse.data);

                // const today = new Date().toISOString().split('T')[0];
                // setSelectedDate(today);
                const firstAllowed = getNextDays(1, 7)[0]; // ngày đầu tiên hợp lệ = H+7
                setSelectedDate(firstAllowed);

            } catch (error) {
                console.error("Lỗi khi tải dữ liệu:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const getFilteredSlots = (roomId) => {
        return roomSlots.filter(slot =>
            slot.room_id === roomId &&
            slot.slot_date === selectedDate
        );
    };

    // const getNext7Days = () => {
    //     const dates = [];
    //     for (let i = 0; i < 7; i++) {
    //         const date = new Date();
    //         date.setDate(date.getDate() + i);
    //         dates.push(date.toISOString().split('T')[0]);
    //     }
    //     return dates;
    // };
    const toYMD = (d) => {
            d.setHours(0, 0, 0, 0);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${day}`;
          };

          const getNextDays = (days = 7, offsetDays = 7) => {
            const dates = [];
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            start.setDate(start.getDate() + offsetDays); // bắt đầu từ H+offsetDays
            for (let i = 0; i < days; i++) {
                  const d = new Date(start);
                  d.setDate(start.getDate() + i);
                  dates.push(toYMD(d));
                }
            return dates;
          };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit'
        });
    };

    const getTimeSlotLabel = (timeSlot) => {
        return timeSlot === 'morning' ? 'Buổi sáng (8:00-12:00)' : 'Buổi chiều (13:00-17:00)';
    };

    const getSlotStatusBadge = (isAvailable) => {
        return isAvailable ? (
            <span className="badge bg-success">Còn trống</span>
        ) : (
            <span className="badge bg-danger">Đã đặt</span>
        );
    };

    const openRoomDetailModal = (room) => {
        setSelectedRoom(room);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedRoom(null);
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                </div>
                <p className="mt-3">Đang tải thông tin phòng...</p>
            </div>
        );
    }

    if (!locationType) {
        return (
            <div className="container py-5">
                <div className="alert alert-warning text-center">
                    Không tìm thấy thông tin loại phòng này.
                </div>
            </div>
        );
    }

    return (
        <div className="container py-5">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <Link to="/rooms" className="btn btn-outline-secondary rounded-pill px-4 shadow-sm mb-3">
                        <i className="fas fa-arrow-left me-2"></i> Quay lại danh sách
                    </Link>
                    <div className="text-center">
                        <h1 className="display-6 fw-bold text-primary">{locationType.name}</h1>
                        <p className="lead text-muted">{locationType.descriptions}</p>
                    </div>
                </div>
            </div>

            {/* Date Selector */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-body p-4">
                            <h5 className="fw-semibold mb-3">
                                <i className="fas fa-calendar-alt text-primary me-2"></i>
                                Chọn ngày
                            </h5>
                            <div className="d-flex gap-2 flex-wrap">
                                {getNextDays(7, 7).map(date => (
                                    <button
                                        key={date}
                                        className={`btn ${selectedDate === date ? 'btn-primary' : 'btn-outline-primary'} rounded-pill px-3 py-2`}
                                        onClick={() => setSelectedDate(date)}
                                    >
                                        {formatDate(date)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rooms List */}
            <div className="row">
                <div className="col-12">
                    <h4 className="fw-semibold mb-4">
                        <i className="fas fa-door-open text-primary me-2"></i>
                        Danh sách phòng ({rooms.length} phòng)
                    </h4>

                    {rooms.length > 0 ? (
                        <div className="row g-4">
                            {rooms.map(room => {
                                const roomSlotsForDate = getFilteredSlots(room.id);

                                return (
                                    <div key={room.id} className="col-lg-6 col-md-12">
                                        <div className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
                                            <div className="row g-0 h-100">
                                                {/* Room Image */}
                                                <div className="col-md-5">
                                                    <div className="position-relative h-100">
                                                        <img
                                                            src={`http://localhost:8000/storage/rooms/${room.image}`}
                                                            alt={room.name}
                                                            className="img-fluid h-100 w-100"
                                                            style={{ objectFit: "cover", minHeight: "300px" }}
                                                        />
                                                        <div className="position-absolute top-0 end-0 m-2">
                                                            <span className={`badge ${room.status === 'available' ? 'bg-success' : 'bg-danger'}`}>
                                                                {room.status === 'available' ? 'Hoạt động' : 'Tạm dừng'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Room Info */}
                                                <div className="col-md-7">
                                                    <div className="card-body h-100 d-flex flex-column p-4">
                                                        <div className="flex-grow-1">
                                                            <h4 className="mb-3 fw-bold">{room.name}</h4>

                                                            <div className="mb-3">
                                                                <p className="mb-2">
                                                                    <i className="fas fa-users text-primary me-2"></i>
                                                                    <strong>Sức chứa:</strong> {room.capacity} người
                                                                </p>
                                                                <p className="mb-2">
                                                                    <i className="fas fa-dollar-sign text-primary me-2"></i>
                                                                    <strong>Giá:</strong>
                                                                    <span className="text-primary fw-semibold ms-1">
                                                                        {new Intl.NumberFormat("vi-VN", {
                                                                            style: "currency",
                                                                            currency: "VND",
                                                                        }).format(room.price || 0)}
                                                                    </span>
                                                                </p>
                                                            </div>

                                                            {room.description && (
                                                                <div className="mb-3">
                                                                    <p className="text-muted small mb-0">
                                                                        {room.description.length > 100
                                                                            ? room.description.substring(0, 100) + '...'
                                                                            : room.description
                                                                        }
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Time Slots */}
                                                            <div className="mb-3">
                                                                <h6 className="fw-semibold mb-2">
                                                                    <i className="fas fa-clock text-primary me-2"></i>
                                                                    Lịch trống ngày {formatDate(selectedDate)}:
                                                                </h6>
                                                                {roomSlotsForDate.length > 0 ? (
                                                                    <div className="d-flex flex-column gap-2">
                                                                        {roomSlotsForDate.map(slot => (
                                                                            <div key={slot.id} className="d-flex justify-content-between align-items-center">
                                                                                <span className="small">
                                                                                    {getTimeSlotLabel(slot.time_slot)}
                                                                                </span>
                                                                                {getSlotStatusBadge(slot.is_available)}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center py-3">
                                                                        <small className="text-muted">
                                                                            <i className="fas fa-calendar-times me-1"></i>
                                                                            Chưa có lịch cho ngày này
                                                                        </small>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="mt-auto">
                                                            <div className="d-flex gap-2">
                                                                <button
                                                                    className="btn btn-outline-primary btn-sm flex-grow-1"
                                                                    onClick={() => openRoomDetailModal(room)}
                                                                >
                                                                    <i className="fas fa-info-circle me-1"></i>
                                                                    Chi tiết
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <div className="card shadow-sm border-0 rounded-4">
                                <div className="card-body p-5">
                                    <i className="fas fa-home fa-3x text-muted mb-3"></i>
                                    <h5 className="text-muted">Không có phòng nào</h5>
                                    <p className="text-muted mb-0">
                                        Hiện tại chưa có phòng nào thuộc loại "{locationType.name}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {/* Modal */}
            {showModal && selectedRoom && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    {/* Thêm modal-dialog-scrollable và fullscreen cho màn hình nhỏ */}
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down">
                        {/* Giới hạn chiều cao toàn modal */}
                        <div className="modal-content border-0 rounded-4 shadow-lg" style={{ maxHeight: '90vh' }}>
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold text-primary">
                                    <i className="fas fa-door-open me-2"></i>
                                    Chi tiết phòng {selectedRoom.name}
                                </h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>

                            {/* Cho phần thân modal cuộn dọc */}
                            <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
                                <div className="row">
                                    {/* Hình + Lịch trống */}
                                    <div className="col-md-6 mb-4">
                                        <div className="position-relative rounded-4 overflow-hidden mb-3">
                                            <img
                                                src={`http://localhost:8000/storage/rooms/${selectedRoom.image}`}
                                                alt={selectedRoom.name}
                                                className="img-fluid w-100"
                                                style={{ height: "300px", objectFit: "cover" }}
                                            />
                                            <div className="position-absolute top-0 end-0 m-2">
                  <span className={`badge ${selectedRoom.status === 'available' ? 'bg-success' : 'bg-danger'}`}>
                    {selectedRoom.status === 'available' ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                                            </div>
                                        </div>

                                        <h6 className="fw-semibold text-dark mb-3">
                                            <i className="fas fa-calendar-week text-primary me-2"></i>
                                            Lịch trống 7 ngày tới
                                        </h6>
                                        <div className="ps-1">
                                            <div className="row g-2" style={{ maxHeight: "200px", overflowY: "auto", paddingRight: "5px" }}>
                                                {getNextDays(7, 7).map(date => {
                                                    const slotsForThisDate = roomSlots.filter(slot =>
                                                        slot.room_id === selectedRoom.id && slot.slot_date === date
                                                    );
                                                    const availableSlots = slotsForThisDate.filter(slot => slot.is_available);
                                                    return (
                                                        <div key={date} className="col-12 mb-2">
                                                            <div className="d-flex justify-content-between align-items-center p-2 border rounded-3">
                                                                <span className="small fw-medium">{formatDate(date)}</span>
                                                                <div>
                                                                    {slotsForThisDate.length === 0 ? (
                                                                        <small className="text-muted">Chưa có lịch</small>
                                                                    ) : availableSlots.length === 0 ? (
                                                                        <span className="badge bg-danger">Hết phòng</span>
                                                                    ) : (
                                                                        <span className="badge bg-success">
                                {availableSlots.length} buổi trống
                              </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Thông tin chi tiết */}
                                    <div className="col-md-6">
                                        <div className="mb-4">
                                            <h6 className="fw-semibold text-dark mb-3">
                                                <i className="fas fa-info-circle text-primary me-2"></i>
                                                Thông tin cơ bản
                                            </h6>
                                            <div className="ps-3">
                                                <p className="mb-2">
                                                    <i className="fas fa-users text-muted me-2"></i>
                                                    <strong>Sức chứa:</strong> {selectedRoom.capacity} người
                                                </p>
                                                <p className="mb-2">
                                                    <i className="fas fa-dollar-sign text-muted me-2"></i>
                                                    <strong>Giá thuê:</strong>
                                                    <span className="text-primary fw-semibold ms-1">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(selectedRoom.price || 0)}
                    </span>
                                                    <small className="text-muted"> / buổi</small>
                                                </p>
                                                <p className="mb-0">
                                                    <i className="fas fa-tag text-muted me-2"></i>
                                                    <strong>Loại phòng:</strong> {locationType.name}
                                                </p>
                                            </div>
                                        </div>

                                        {selectedRoom.description && (
                                            <div className="mb-4">
                                                <h6 className="fw-semibold text-dark mb-3">
                                                    <i className="fas fa-file-alt text-primary me-2"></i>
                                                    Mô tả
                                                </h6>
                                                {/* Hiển thị mô tả dài, giữ xuống dòng và cho phép wrap */}
                                                <div className="ps-3 text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                                                    {selectedRoom.description}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer border-0 pt-0">
                                <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={closeModal}>
                                    <i className="fas fa-times me-2"></i> Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default RoomDetail;
