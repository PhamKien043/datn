import React, { useEffect, useState } from "react";
import { getMenuById } from "../../../services/menuAdmin";
import { useParams, useNavigate } from "react-router-dom";
import "./detail.css";

function DetailMenu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, [id]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const menuData = await getMenuById(id);
      setMenu(menuData);
    } catch (error) {
      alert("Lỗi khi lấy chi tiết menu.");
      navigate("/admin/menus");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="loading-text">⏳ Đang tải...</p>;
  if (!menu) return <p className="loading-text">❌ Không tìm thấy menu.</p>;

  return (
    <div className="detail-menu-container">
      <div className="detail-menu-image-wrapper">
        {menu.image ? (
          <img
            src={
              menu.image.startsWith("menus/")
                ? `http://localhost:8000/storage/${menu.image}`
                : `http://localhost:8000/storage/menus/${menu.image}`
            }
            alt={menu.name}
            className="detail-menu-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/350x250?text=Không+có+ảnh";
            }}
          />
        ) : (
          <div className="no-image-placeholder">
            <span className="no-image-icon">📷</span>
            <p className="no-image-text">Không có ảnh</p>
          </div>
        )}
      </div>

      <div className="detail-menu-info-wrapper">
        <h2 className="detail-menu-title">
          {menu.name}
          <span className={`status-badge ${menu.status ? "active" : "inactive"}`}>
            {menu.status ? "Hoạt động" : "Ngừng bán"}
          </span>
        </h2>

        <div className="detail-menu-info-grid">
          <div className="info-item">
            <label>Mô tả:</label>
            <p>{menu.description || "Không có mô tả"}</p>
          </div>

          <div className="info-item">
            <label>Giá:</label>
            <p className="price">{Number(menu.price).toLocaleString("vi-VN")} VND</p>
          </div>

          {/* <div className="info-item">
            <label>Loại:</label>
            <p>{menu.type || "Không xác định"}</p>
          </div> */}

          <div className="info-item">
            <label>Chay:</label>
            <p>{menu.is_chay ? "✅ Có" : "❌ Không"}</p>
          </div>

          <div className="info-item">
            <label>Danh mục:</label>
            <p>{menu.category?.name || "Không có danh mục"}</p>
          </div>

          {/* <div className="info-item">
            <label>Ngày tạo:</label>
            <p>{new Date(menu.created_at).toLocaleDateString()}</p>
          </div> */}
        </div>

        <div className="detail-menu-buttons">
          <button 
            className="btn btn-back" 
            onClick={() => navigate("/admin/menus")}
          >
            ← Quay lại
          </button>
          <button 
            className="btn btn-edit" 
            onClick={() => navigate(`/admin/menus/edit/${menu.id}`)}
          >
            ✏️ Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetailMenu;