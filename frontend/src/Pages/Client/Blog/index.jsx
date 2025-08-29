import React, { useState, useEffect } from 'react';
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

function Blog() {
  const [blogs, setBlogs] = useState([]);

  // ✅ Hàm lấy dữ liệu
  const getBlogs = async () => {
    const res = await axios.get("http://localhost:8000/api/admin/blog");
    console.log("API response:", res.data); // debug
    return res.data.data || res.data || []; // tuỳ backend
  };

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const data = await getBlogs();
        setBlogs(data);
      } catch (err) {
        toast.error("❌ Không thể tải bài viết");
        console.error("API error:", err);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <section>
      <div className="container-fluid blog py-4">
        <div className="container">
          <div className="text-center wow bounceInUp" data-wow-delay="0.1s">
            <small className="d-inline-block fw-bold text-dark text-uppercase bg-light border border-primary rounded-pill px-4 py-1 mb-3">
              Bài viết của chúng tôi
            </small>
            <h1 className="display-5 mb-5">Hãy là người đầu tiên đọc tin tức</h1>
          </div>

          <div className="row gx-4 justify-content-center">
            {blogs.length > 0 ? (
              blogs.map((blog, index) => (
                <div
                  key={blog.id}
                  className="col-md-6 col-lg-4 wow bounceInUp"
                  data-wow-delay={`${0.1 * (index + 1)}s`}
                >
                  <div className="blog-item">
                    <div className="overflow-hidden rounded">
                      <img
                        src={`http://localhost:8000/storage/blogs/${blog.image}`}
                        className="img-fluid w-100"
                        alt={blog.title}
                      />
                    </div>
                    <div className="blog-content mx-4 d-flex rounded bg-light">
                      <div className="text-dark bg-primary rounded-start">
                        <div className="h-100 p-3 d-flex flex-column justify-content-center text-center">
                          <p className="fw-bold mb-0">
                            {new Date(blog.created_at).getDate()}
                          </p>
                          <p className="fw-bold mb-0">
                            {new Date(blog.created_at).toLocaleString("default", {
                              month: "short",
                            })}
                          </p>
                        </div>
                      </div>
                      <Link to={`/blog/${blog.id}`} className="h5 lh-base my-auto h-100 p-3">
                        {blog.title}
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center">⏳ Đang tải bài viết...</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Blog;
