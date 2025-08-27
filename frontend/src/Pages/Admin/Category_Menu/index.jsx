import React, { useEffect, useState } from "react";
import { getCategoryMenus, deleteCategoryMenu } from "../../../services/categoryMenuAdmin";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Table, Button, Badge, Form, Pagination, Card, Row, Col, Spinner, Alert } from "react-bootstrap";
import "./CategoryMenuList.css";

function CategoryMenuList() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ name: "", status: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getCategoryMenus();
      setMenus(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách Category Menu.");
      toast.error("Không thể tải danh sách Category Menu!");
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      try {
        await deleteCategoryMenu(id);
        setMenus(prev => prev.filter(m => m.id !== id));
        toast.success("✅ Xóa thành công!");
      } catch (err) {
        console.error(err);
        toast.error("Xóa thất bại!");
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const resetFilters = () => setFilters({ name: "", status: "" });

  const filteredMenus = menus.filter(m =>
    m.name.toLowerCase().includes(filters.name.toLowerCase()) &&
    (filters.status !== "" ? m.status === Number(filters.status) : true)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMenus = filteredMenus.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMenus.length / itemsPerPage);

  if (loading) return (
    <div className="my-5 text-center">
      <Spinner animation="border" variant="primary" />
      <p className="mt-3">Đang tải danh sách Category Menu...</p>
    </div>
  );

  if (error) return (
    <div className="my-5">
      <Alert variant="danger" className="text-center">{error}</Alert>
    </div>
  );

  return (
    <div className="menus-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="header-section">
        <h2>📋 Quản lý Category Menu</h2>
        <button className="btn-add" onClick={() => navigate("/admin/category-menus/add")}>
          + Thêm Mới
        </button>
      </div>

      <div className="menus-actions">
        <input
          type="text"
          name="name"
          placeholder="🔎 Tìm theo tên..."
          value={filters.name}
          onChange={handleFilterChange}
        />
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">Tất cả trạng thái</option>
          <option value="1">Kích hoạt</option>
          <option value="0">Không kích hoạt</option>
        </select>
        <button className="btn-add btn-outline-warning" onClick={resetFilters}>Làm mới</button>
      </div>

      {filteredMenus.length === 0 ? (
        <p className="no-data">Không có dữ liệu phù hợp.</p>
      ) : (
        <>
          <table className="menus-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {currentMenus.map((menu, idx) => (
                <tr key={menu.id}>
                  <td>{indexOfFirstItem + idx + 1}</td>
                  <td>{menu.name}</td>
                  <td className="d-none d-md-table-cell">{menu.description || "-"}</td>
                  <td className={menu.status ? "status-active" : "status-inactive"}>
                    {menu.status ? "Kích hoạt" : "Không kích hoạt"}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-view" onClick={() => navigate(`/admin/category-menus/detail/${menu.id}`)}>👁️ Xem</button>
                      <button className="btn-edit" onClick={() => navigate(`/admin/category-menus/edit/${menu.id}`)}>✏️ Sửa</button>
                      <button className="btn-delete" onClick={() => handleDelete(menu.id)}>🗑️ Xóa</button>
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

export default CategoryMenuList;
