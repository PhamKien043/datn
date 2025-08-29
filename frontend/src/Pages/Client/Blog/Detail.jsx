import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
    <div className="container py-5">
      <button className="btn btn-dark mb-3" onClick={() => navigate("/Blogs")} style={{ float: "right" }}>
        ← Quay lại
      </button>

      <h1 className="mb-4">{blog.title}</h1>

      {blog.image && (
        <img
          src={`http://localhost:8000/storage/blogs/${blog.image}`}
          alt={blog.title}
          className="img-fluid mb-4"
          style={{ borderRadius: "8px" }}
        />
      )}

      <div
        className="blog-content"
        dangerouslySetInnerHTML={{ __html: blog.content }}
        style={{ fontSize: "20px", color: "black" }}
      />
    </div>
  );
}

export default BlogDetail;
