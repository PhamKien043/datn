import React, { useEffect, useState } from "react";
import { getAllRooms, deleteRoom } from "../../../services/roomsAdmin";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./rooms.css";

function Rooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 5;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterRooms();
  }, [searchTerm, statusFilter, rooms]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAllRooms();
      if (res && Array.isArray(res)) setRooms(res);
      else if (res?.data && Array.isArray(res.data)) setRooms(res.data);
      else setRooms([]);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách phòng");
    } finally {
      setLoading(false);
    }
  };

  const filterRooms = () => {
    let filtered = rooms;
    if (searchTerm.trim() !== "")
      filtered = filtered.filter((r) =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    if (statusFilter !== "") {
      filtered = filtered.filter((r) =>
        statusFilter === "available"
          ? r.status === "available"
          : r.status !== "available"
      );
    }
    setFilteredRooms(filtered);
    setCurrentPage(1);
  };

  // ✅ Xóa phòng với confirm mặc định
  const handleDeleteClick = async (room) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa phòng "${room.name}"?`
    );
    if (confirmDelete) {
      try {
        await deleteRoom(room.id);
        setRooms(rooms.filter((r) => r.id !== room.id));
        toast.success(`✅ Đã xóa phòng "${room.name}" thành công!`);
      } catch (err) {
        console.error(err);
        toast.error(`❌ Xóa phòng "${room.name}" thất bại. Vui lòng thử lại!`);
      }
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const renderImage = (image) => {
    if (!image) return <span className="text-muted">Không có ảnh</span>;
    const url = image.startsWith("rooms/")
      ? `http://localhost:8000/storage/${image}`
      : `http://localhost:8000/storage/rooms/${image}`;
    return (
      <img
        src={url}
        className="room-image"
        onError={(e) =>
          (e.target.src =
            "https://via.placeholder.com/100x70?text=No+Image")
        }
      />
    );
  };

  const renderStatus = (status) => (
    <span
      className={status === "available" ? "status-active" : "status-inactive"}
    >
      {status === "available" ? "Hoạt động" : "Bảo trì"}
    </span>
  );

  // Pagination
  const indexOfLast = currentPage * roomsPerPage;
  const indexOfFirst = indexOfLast - roomsPerPage;
  const currentRooms = filteredRooms.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredRooms.length / roomsPerPage);

  if (loading)
    return (
      <div className="my-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Đang tải danh sách phòng...</p>
      </div>
    );

  return (
    <div className="menus-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="header-section">
        <h2>🏠 Quản lý Phòng</h2>
        <button
          className="btn-add"
          onClick={() => navigate("/admin/rooms/add")}
        >
          + Thêm Mới
        </button>
      </div>

      <div className="menus-actions">
        <input
          type="text"
          placeholder="🔎 Tìm theo tên phòng"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="available">Hoạt động</option>
          <option value="maintenance">Bảo trì</option>
        </select>
        <button className="btn-add" onClick={filterRooms}>
          Áp dụng
        </button>
        <button
          className="btn-add btn-outline-warning"
          onClick={() => {
            setSearchTerm("");
            setStatusFilter("");
          }}
        >
          Làm mới
        </button>
      </div>

      {filteredRooms.length === 0 ? (
        <p className="no-data">Không tìm thấy phòng nào.</p>
      ) : (
        <>
          <table className="menus-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên phòng</th>
                <th className="d-none d-md-table-cell">Ảnh</th>
                <th className="d-none d-md-table-cell">Giá</th>
                <th className="d-none d-md-table-cell">Loại</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {currentRooms.map((room, idx) => (
                <tr key={room.id}>
                  <td>{indexOfFirst + idx + 1}</td>
                  <td>{room.name}</td>
                  <td className="d-none d-md-table-cell">
                    {renderImage(room.image)}
                  </td>
                  <td className="d-none d-md-table-cell">
                    {formatCurrency(room.price)}
                  </td>
                  <td className="d-none d-md-table-cell">
                    {room.location_type?.name || "Không rõ"}
                  </td>
                  <td>{renderStatus(room.status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() =>
                          navigate(`/admin/rooms/detail/${room.id}`)
                        }
                      >
                        👁️ Xem
                      </button>
                      <button
                        className="btn-edit"
                        onClick={() =>
                          navigate(`/admin/rooms/edit/${room.id}`)
                        }
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteClick(room)}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                ««
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                «
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  className={currentPage === i + 1 ? "active" : ""}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                »
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                »»
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Rooms;
