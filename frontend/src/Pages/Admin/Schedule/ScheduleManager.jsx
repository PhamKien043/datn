import React, { useState, useEffect, useMemo } from "react";
import { Save, Edit, Trash2, Plus } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "../../../services/axios";

const SHOW_ONLY_ACTIVE = false;

const ScheduleManager = () => {
  const [locationTypes, setLocationTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomSlots, setRoomSlots] = useState([]);
  const [selectedLocationTypeId, setSelectedLocationTypeId] = useState(""); // tất cả loại
  const [selectedRoomId, setSelectedRoomId] = useState("");                 // tất cả phòng
  const [selectedDate, setSelectedDate] = useState("");                      // tất cả ngày
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm, setSlotForm] = useState({ room_id: "", slot_date: "", time_slot: "", is_available: true });
  const [loading, setLoading] = useState(false);

  const timeSlots = ["08:00-12:00", "13:00-19:00"];
  const timeSlotMapping = { "08:00-12:00": "morning", "13:00-19:00": "afternoon" };
  const reverseTimeSlotMapping = { morning: "08:00-12:00", afternoon: "13:00-19:00" };

  const roomNameById = useMemo(() => new Map(rooms.map((r) => [String(r.id), r.name])), [rooms]);

  // === API helpers ===
  const fetchLocationTypes = async () => {
    try {
      const res = await axios.get("admin/location-types");
      const data = Array.isArray(res.data) ? res.data : (res.data?.success ? res.data.data : []);
      setLocationTypes(data);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || "Lỗi tải loại địa điểm");
    }
  };

  const fetchRooms = async (locationTypeId = "", opts = { onlyActive: SHOW_ONLY_ACTIVE }) => {
    try {
      const params = [];
      if (locationTypeId) params.push(`location_type_id=${locationTypeId}`);
      if (opts.onlyActive) params.push("only_active=1");
      const url = "admin/rooms" + (params.length ? `?${params.join("&")}` : "");
      const res = await axios.get(url);
      let data = Array.isArray(res.data) ? res.data : (res.data?.success ? res.data.data : []);
      data = data.map((r) => ({ ...r, id: String(r.id) }));
      setRooms(data);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || "Lỗi tải phòng");
    }
  };

  const fetchRoomSlots = async ({ roomId = "", date = "", locationTypeId = "" } = {}) => {
    setLoading(true);
    try {
      let url = "admin/room-slots";
      const params = [];
      if (locationTypeId) params.push(`location_type_id=${locationTypeId}`);
      if (roomId) params.push(`room_id=${roomId}`);
      if (date) params.push(`slot_date=${date}`);
      if (params.length) url += "?" + params.join("&");

      const res = await axios.get(url);
      let data = Array.isArray(res.data) ? res.data : (res.data?.success ? res.data.data : []);
      data = data.map((s) => ({
        ...s,
        room_id: String(s.room_id),
        time_slot: reverseTimeSlotMapping[s.time_slot] || s.time_slot,
      }));
      setRoomSlots(data);
    } catch (e) {
      console.error(e);
      setRoomSlots([]);
      toast.error(e.response?.data?.message || "Lỗi tải slot");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentFilters = () => ({
    roomId: selectedRoomId || "",
    locationTypeId: selectedLocationTypeId || "",
    date: selectedDate || "",
  });

  // === CRUD (giữ nguyên, chỉ thay chỗ refresh) ===
  const createSlot = async (slotData) => {
    try {
      setLoading(true);
      const payload = { ...slotData, time_slot: timeSlotMapping[slotData.time_slot] || slotData.time_slot };
      const res = await axios.post("admin/room-slots", payload);
      if ([200, 201].includes(res.status)) {
        await fetchRoomSlots(getCurrentFilters());
        setIsModalOpen(false);
        resetForm();
        toast.success("Thêm slot thành công");
      } else throw new Error(res.data.message || "Không thể tạo slot mới");
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || "Lỗi tạo slot");
    } finally {
      setLoading(false);
    }
  };

  const updateSlot = async (slotId, slotData) => {
    try {
      setLoading(true);
      const payload = { ...slotData, time_slot: timeSlotMapping[slotData.time_slot] || slotData.time_slot };
      const res = await axios.put(`admin/room-slots/${slotId}`, payload);
      if ([200, 201].includes(res.status)) {
        await fetchRoomSlots(getCurrentFilters());
        setIsModalOpen(false);
        resetForm();
        toast.success("Cập nhật slot thành công");
      } else throw new Error(res.data.message || "Không thể cập nhật slot");
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || "Lỗi cập nhật slot");
    } finally {
      setLoading(false);
    }
  };

  const deleteSlot = async (slotId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa slot này?")) return;
    try {
      setLoading(true);
      const res = await axios.delete(`admin/room-slots/${slotId}`);
      if ([200, 204].includes(res.status)) {
        await fetchRoomSlots(getCurrentFilters());
        toast.success("Xóa slot thành công");
      } else throw new Error(res.data.message || "Không thể xóa slot");
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || "Lỗi xóa slot");
    } finally {
      setLoading(false);
    }
  };

  const updateSlotStatus = async (slotId, isAvailable) => {
    try {
      const res = await axios.put(`admin/room-slots/${slotId}`, { is_available: isAvailable });
      if ([200, 201].includes(res.status)) {
        await fetchRoomSlots(getCurrentFilters());
        toast.success("Cập nhật trạng thái thành công");
      } else throw new Error(res.data.message || "Không thể cập nhật trạng thái slot");
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || "Lỗi cập nhật trạng thái");
    }
  };

  // === Form & Filters ===
  const resetForm = () => {
    setSlotForm({ room_id: selectedRoomId, slot_date: selectedDate, time_slot: "", is_available: true });
    setEditingSlot(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!slotForm.room_id) return toast.error("Vui lòng chọn phòng");
    if (!slotForm.slot_date) return toast.error("Vui lòng chọn ngày");
    if (!timeSlots.includes(slotForm.time_slot)) return toast.error("Vui lòng chọn khung giờ hợp lệ");
    if (editingSlot) await updateSlot(editingSlot.id, slotForm);
    else await createSlot(slotForm);
  };

  const handleEditSlot = (slot) => {
    setEditingSlot(slot);
    setSlotForm({
      room_id: slot.room_id,
      slot_date: slot.slot_date,
      time_slot: reverseTimeSlotMapping[slot.time_slot] || slot.time_slot,
      is_available: slot.is_available,
    });
    setIsModalOpen(true);
  };

  const handleLocationTypeChange = async (e) => {
    const ltId = e.target.value;
    setSelectedLocationTypeId(ltId);
    setSelectedRoomId(""); // reset phòng
    await fetchRooms(ltId, { onlyActive: SHOW_ONLY_ACTIVE });
    await fetchRoomSlots({ locationTypeId: ltId, date: selectedDate || "" });
  };

  const handleRoomChange = async (e) => {
    const roomId = e.target.value;
    setSelectedRoomId(roomId);
    await fetchRoomSlots({
      roomId: roomId || "",
      locationTypeId: selectedLocationTypeId || "",
      date: selectedDate || "",
    });
  };

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    await fetchRoomSlots({
      roomId: selectedRoomId || "",
      locationTypeId: selectedLocationTypeId || "",
      date: date || "",
    });
  };

  // Lần đầu: lấy tất cả loại, tất cả phòng, tất cả slot (không lọc)
  useEffect(() => {
    fetchLocationTypes();
    fetchRooms("", { onlyActive: SHOW_ONLY_ACTIVE });
    fetchRoomSlots(); // << lấy all
  }, []);

  return (
      <div className="container-fluid">
        <h1 className="h3 mb-2 text-gray-800">Quản lý lịch phòng</h1>
        <p className="mb-4">Xem và quản lý lịch đặt phòng, trạng thái slot</p>

        <div className="row mb-3">
          <div className="col-md-4">
            <select className="form-control" value={selectedLocationTypeId} onChange={handleLocationTypeChange}>
              <option value="">Tất cả loại địa điểm</option>
              {locationTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-control" value={selectedRoomId} onChange={handleRoomChange}>
              <option value="">Tất cả phòng</option>
              {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <input type="date" className="form-control" value={selectedDate} onChange={handleDateChange} />
          </div>
          <div className="col-md-2">
            <button
                className="btn btn-primary w-100"
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                disabled={loading}
            >
              <Plus size={18} className="me-2" />
              Thêm slot mới
            </button>
          </div>
        </div>

        <div className="card shadow mb-4">
          <div className="card-header py-3">
            <h6 className="m-0 font-weight-bold text-primary">Danh sách slot phòng</h6>
          </div>
          <div className="card-body">
            {loading ? (
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                </div>
            ) : (
                <div className="table-responsive">
                  <table className="table table-bordered" width="100%" cellSpacing="0">
                    <thead>
                    <tr>
                      <th>Phòng</th>
                      <th>Ngày</th>
                      <th>Khung giờ</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                    </thead>
                    <tbody>
                    {roomSlots.length === 0 ? (
                        <tr><td colSpan="5" className="text-center">Không có slot nào</td></tr>
                    ) : (
                        roomSlots.map((slot) => (
                            <tr key={slot.id}>
                              <td>{slot?.room?.name ?? roomNameById.get(String(slot.room_id)) ?? slot.room_id}</td>
                              <td>{new Date(slot.slot_date).toLocaleDateString("vi-VN")}</td>
                              <td>{slot.time_slot}</td>
                              <td>
                          <span className={`badge bg-${slot.is_available ? "success" : "danger"}`}>
                            {slot.is_available ? "Còn trống" : "Hết phòng"}
                          </span>
                              </td>
                              <td>
                                <button className="btn btn-success btn-sm me-1 mb-1"
                                        onClick={() => updateSlotStatus(slot.id, !slot.is_available)}>Đổi trạng thái</button>
                                <button className="btn btn-warning btn-sm me-1 mb-1"
                                        onClick={() => handleEditSlot(slot)}><Edit size={16}/> Sửa</button>
                                <button className="btn btn-danger btn-sm mb-1"
                                        onClick={() => deleteSlot(slot.id)} type="button"><Trash2 size={16}/> Xóa</button>
                              </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                  </table>
                </div>
            )}
          </div>
        </div>

        {isModalOpen && (
            <div className="modal show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.3)" }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <form onSubmit={handleFormSubmit}>
                    <div className="modal-header">
                      <h5 className="modal-title">{editingSlot ? "Sửa slot" : "Thêm slot mới"}</h5>
                      <button type="button" className="btn-close"
                              onClick={() => { setIsModalOpen(false); resetForm(); }} />
                    </div>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label">Phòng</label>
                        <select value={slotForm.room_id}
                                onChange={(e) => setSlotForm({ ...slotForm, room_id: e.target.value })}
                                className="form-select" required>
                          <option value="">Chọn phòng</option>
                          {rooms.map((room) => (
                              <option key={room.id} value={room.id}>{room.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Ngày</label>
                        <input type="date" value={slotForm.slot_date}
                               onChange={(e) => setSlotForm({ ...slotForm, slot_date: e.target.value })}
                               className="form-control" required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Khung giờ</label>
                        <select value={slotForm.time_slot}
                                onChange={(e) => setSlotForm({ ...slotForm, time_slot: e.target.value })}
                                className="form-select" required>
                          <option value="">Chọn khung giờ</option>
                          {timeSlots.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-check mb-3">
                        <input type="checkbox" id="is_available" className="form-check-input"
                               checked={slotForm.is_available}
                               onChange={(e) => setSlotForm({ ...slotForm, is_available: e.target.checked })} />
                        <label htmlFor="is_available" className="form-check-label">Slot có sẵn</label>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary"
                              onClick={() => { setIsModalOpen(false); resetForm(); }}>Hủy</button>
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        <Save size={16} className="me-1" /> {editingSlot ? "Cập nhật" : "Tạo mới"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
        )}

        <ToastContainer position="bottom-right" />
      </div>
  );
};

export default ScheduleManager;
