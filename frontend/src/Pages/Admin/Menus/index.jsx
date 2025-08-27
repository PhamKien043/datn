import React, { useEffect, useState } from "react";
import { getAllMenus, deleteMenu } from "../../../services/menuAdmin";
import { useNavigate } from "react-router-dom";
import "./menu.css";

function MenusList() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchName, setSearchName] = useState("");
  const [searchPrice, setSearchPrice] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenus();
  }, [page, searchName, searchPrice]);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const params = { 
        page, 
        limit: 5,
        name: searchName, 
        price: searchPrice 
      };
      const data = await getAllMenus(params);

      if (Array.isArray(data)) {
        setMenus(data);
        setTotalPages(1);
      } else if (data && Array.isArray(data.data)) {
        setMenus(data.data);
        setTotalPages(data.last_page || data.total_pages || 1);
      } else {
        setMenus([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching menus:", error);
      alert("Lỗi khi tải danh sách menu.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return price
      ? Number(price).toLocaleString("vi-VN", { minimumFractionDigits: 0 }) + " VND"
      : "0 VND";
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa menu này không?")) return;
    try {
      await deleteMenu(id);
      alert("Xóa menu thành công.");
      fetchMenus();
    } catch (error) {
      alert("Lỗi khi xóa menu.");
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const visiblePages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      visiblePages.push(
        <button key={1} onClick={() => setPage(1)}>
          1
        </button>
      );
      if (startPage > 2) {
        visiblePages.push(<span key="start-ellipsis">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      visiblePages.push(
        <button
          key={i}
          className={page === i ? "active" : ""}
          onClick={() => setPage(i)}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        visiblePages.push(<span key="end-ellipsis">...</span>);
      }
      visiblePages.push(
        <button key={totalPages} onClick={() => setPage(totalPages)}>
          {totalPages}
        </button>
      );
    }

    return visiblePages;
  };

  return (
    <div className="menus-container">
      <div className="header-section">
        <h2>📋 Danh sách Menu</h2>
        <button className="btn-add" onClick={() => navigate("/admin/menus/add")}>
          ➕ Thêm Menu mới
        </button>
      </div>

      <div className="menus-actions">
        <input
          type="text"
          placeholder="🔍 Tìm kiếm theo tên..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <input
          type="number"
          placeholder="💲 Tìm kiếm theo giá..."
          value={searchPrice}
          onChange={(e) => setSearchPrice(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="loading-text">⏳ Đang tải...</p>
      ) : menus.length === 0 ? (
        <p className="no-data">Không có menu nào.</p>
      ) : (
        <>
          <table className="menus-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Hình ảnh</th>
                <th>Tên</th>
                <th>Giá</th>
                <th>Loại menu</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((menu) => (
                <tr key={menu.id}>
                  <td>{menu.id}</td>
                  <td>
                    {menu.image ? (
                      <img
                        src={
                          menu.image.startsWith("menus/")
                            ? `http://localhost:8000/storage/${menu.image}`
                            : `http://localhost:8000/storage/menus/${menu.image}`
                        }
                        alt={menu.name}
                        className="menu-image"
                      />
                    ) : (
                      <span className="no-image">Không có ảnh</span>
                    )}
                  </td>
                  <td>{menu.name}</td>
                  <td>{formatPrice(menu.price)}</td>
                  <td>{menu.category?.name || "Không có loại"}</td>
                  <td className={menu.status ? "status-active" : "status-inactive"}>
                    {menu.status ? "Hoạt động" : "Không hoạt động"}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() => navigate(`/admin/menus/detail/${menu.id}`)}
                      >
                        👁 Xem
                      </button>
                      <button
                        className="btn-edit"
                        onClick={() => navigate(`/admin/menus/edit/${menu.id}`)}
                      >
                        ✏ Sửa
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(menu.id)}
                      >
                        🗑 Xóa
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
                disabled={page === 1}
                onClick={() => setPage(1)}
                className="page-nav"
              >
                ««
              </button>
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="page-nav"
              >
                «
              </button>
              
              {renderPagination()}
              
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="page-nav"
              >
                »
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
                className="page-nav"
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

export default MenusList;
