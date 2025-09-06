import React, { useEffect, useState } from "react";
import { getBlogById } from "../../../services/blogAdmin";
import { useParams, useNavigate } from "react-router-dom";
import "./detail.css";

function DetailBlog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    setLoading(true);
    try {
      const blogData = await getBlogById(id);
      setBlog(blogData);
    } catch (error) {
      alert("Lỗi khi lấy chi tiết bài viết.");
      navigate("/admin/blog");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="loading-text">⏳ Đang tải...</p>;
  if (!blog) return <p className="loading-text">❌ Không tìm thấy bài viết.</p>;

  return (
    <div className="detail-blog-container">
      {/* ✅ Ảnh trên */}
      <div className="detail-blog-image-wrapper">
        {blog.image ? (
          <img
            src={
              blog.image.startsWith("blogs/")
                ? `http://localhost:8000/storage/${blog.image}`
                : `http://localhost:8000/storage/blogs/${blog.image}`
            }
            alt={blog.title}
            className="detail-blog-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://via.placeholder.com/800x400?text=Không+có+ảnh";
            }}
          />
        ) : (
          <div className="no-image-placeholder">
            <span className="no-image-icon">📷</span>
            <p className="no-image-text">Không có ảnh</p>
          </div>
        )}
      </div>

      {/* ✅ Thông tin dưới ảnh */}
      <div className="detail-blog-info-wrapper">
        <h2 className="detail-blog-title">{blog.title}</h2>

        <div className="detail-blog-meta">
          <span
            className={`status-badge ${blog.status ? "active" : "inactive"}`}
          >
            {blog.status ? "Hiển thị" : "Ẩn"}
          </span>

          <span className="date-info">
            🗓 Ngày tạo:{" "}
            {new Date(blog.created_at).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>

          <span className="date-info">
            ✏️ Cập nhật:{" "}
            {new Date(blog.updated_at).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>

          {/* ✅ Nút hành động */}
          <div className="detail-blog-buttons">
            <button
              className="btn btn-back"
              onClick={() => navigate("/admin/blogs")}
            >
              ← Quay lại
            </button>
            <button
              className="btn btn-edit"
              onClick={() => navigate(`/admin/blog/edit/${blog.id}`)}
            >
              ✏️ Chỉnh sửa
            </button>
          </div>
        </div>
      </div>

      {/* Nội dung đặt dưới ảnh */}
      <div className="detail-blog-content"
        dangerouslySetInnerHTML={{ __html: blog.content }}>
      </div>

    </div>
  );
}

export default DetailBlog;
