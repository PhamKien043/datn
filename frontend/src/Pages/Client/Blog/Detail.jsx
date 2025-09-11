import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./blog.scss"; // dùng lại style từ blog.scss

function BlogDetail() {
  const { id } = useParams(); // lấy id từ URL
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/admin/blog/${id}`);
        setBlog(res.data.data || res.data);
      } catch (err) {
        toast.error("❌ Không thể tải chi tiết bài viết");
        navigate("/blogs");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id, navigate]);

  if (loading) return <p className="text-center">⏳ Đang tải bài viết...</p>;
  if (!blog) return <p className="text-center">⚠️ Không tìm thấy bài viết</p>;

  return (
    <div className="container py-5 blog-section">
      {/* nút quay lại */}
      <button
        className="btn btn-primary mb-3"
        onClick={() => navigate("/blogs")}
        style={{ float: "right" }}
      >
        ← Quay lại
      </button>

      {/* tiêu đề */}
      <h1 className="mb-4 section-title">{blog.title}</h1>

      {/* ảnh */}
      {blog.image && (
        <img
          src={`http://localhost:8000/storage/blogs/${blog.image}`}
          alt={blog.title}
          className="img-fluid mb-4"
          style={{ borderRadius: "8px" }}
        />
      )}

      {/* nội dung */}
      <div
        className="blog-content"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />
    </div>
  );
}

export default BlogDetail;
