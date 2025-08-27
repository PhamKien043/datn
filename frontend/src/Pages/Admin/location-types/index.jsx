import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllLocationTypes, deleteLocationType } from "../../../services/locationTypes";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./loc.css";

function LocationTypes() {
  const [locationTypes, setLocationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ name: "", status: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => { loadLocationTypes(); }, []);
  useEffect(() => { setCurrentPage(1); }, [filters]);

  const loadLocationTypes = async () => {
    setLoading(true);
    try {
      const data = await getAllLocationTypes();
      setLocationTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách loại phòng.");
      toast.error("Không thể tải danh sách loại phòng");
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa loại phòng này?")) {
      try {
        await deleteLocationType(id);
        setLocationTypes(prev => prev.filter(item => item.id !== id));
        toast.success("✅ Xóa loại phòng thành công!");
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Xóa thất bại!");
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const resetFilters = () => { setFilters({ name: "", status: "" }); setCurrentPage(1); };

  const filteredLocationTypes = locationTypes.filter(item => 
    item.name.toLowerCase().includes(filters.name.toLowerCase()) &&
    (filters.status !== "" ? item.is_active === Number(filters.status) : true)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLocationTypes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLocationTypes.length / itemsPerPage);

  if (loading) return (
    <div className="my-5 text-center">
      <div className="spinner-border text-primary" role="status"></div>
      <p className="mt-3">Đang tải danh sách loại phòng...</p>
    </div>
  );

  if (error) return (
    <div className="my-5">
      <div className="alert alert-danger text-center">{error}</div>
    </div>
  );

  return (
    <div className="menus-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="header-section">
        <h2>🌟 Quản lý Loại Phòng</h2>
        <button className="btn-add" onClick={() => navigate("/admin/location-types/add")}>
          + Thêm Mới
        </button>
      </div>

      <div className="menus-actions">
        <input
          type="text"
          name="name"
          placeholder="🔎 Tìm theo tên loại phòng..."
          value={filters.name}
          onChange={handleFilterChange}
        />
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">Tất cả trạng thái</option>
          <option value="1">Hoạt động</option>
          <option value="0">Ngưng hoạt động</option>
        </select>
        <button className="btn-add btn-outline-warning" onClick={resetFilters}>Làm mới</button>
      </div>

      {filteredLocationTypes.length === 0 ? (
        <p className="no-data">Không có loại phòng nào phù hợp.</p>
      ) : (
        <>
          <table className="menus-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Ảnh</th>
                <th>Tên loại phòng</th>
                <th className="d-none d-md-table-cell">Mô tả</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((type, idx) => (
                <tr key={type.id}>
                  <td>{indexOfFirstItem + idx + 1}</td>
                  <td>
                    {type.image ? (
                      <img 
                        src={type.image.startsWith("rooms/") ? `http://localhost:8000/storage/${type.image}` : `http://localhost:8000/storage/rooms/${type.image}`}
                        alt={type.name} 
                        className="location-type-image"
                      />
                    ) : <span className="text-muted">Không có ảnh</span>}
                  </td>
                  <td>{type.name}</td>
                  <td className="d-none d-md-table-cell">{type.descriptions || "-"}</td>
                  <td className={type.is_active ? "status-active" : "status-inactive"}>
                    {type.is_active ? "Hoạt động" : "Ngưng hoạt động"}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-view" onClick={() => navigate(`/admin/location-types/detail/${type.id}`)}>
                        👁️ Xem
                      </button>
                      <button className="btn-edit" onClick={() => navigate(`/admin/location-types/edit/${type.id}`)}>
                        ✏️ Sửa
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(type.id)}>
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
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>««</button>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>«</button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  className={currentPage === i + 1 ? "active" : ""}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>»</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>»»</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LocationTypes;