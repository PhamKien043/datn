import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllBlogs, deleteBlog } from "../../../services/blogAdmin";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./blog.css";

function BlogList() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ title: "", status: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const navigate = useNavigate();

    useEffect(() => { loadBlogs(); }, []);

    const loadBlogs = async () => {
        setLoading(true);
        try {
            const data = await getAllBlogs();
            setBlogs(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError("Không thể tải danh sách bài viết.");
        } finally {
            setLoading(false);
        }
    };

    // Hàm loại bỏ HTML tag
    function stripHtml(html) {
        const div = document.createElement("div");
        div.innerHTML = html;
        return div.textContent || div.innerText || "";
    }

    // ✅ Hàm xóa có hiển thị thông báo + delay reload
    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
            try {
                await deleteBlog(id);
                // ✅ Cập nhật UI không cần reload
                setBlogs((prevBlogs) => prevBlogs.filter((blog) => blog.id !== id));
                toast.success("🗑️ Xóa thành công!");
            } catch (err) {
                console.error(err);
                toast.error("❌ Xóa thất bại!");
            }
        }
    };


    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({ title: "", status: "" });
        setCurrentPage(1);
    };

    const filteredBlogs = blogs.filter(v =>
        v.title?.toLowerCase().includes(filters.title.toLowerCase()) &&
        (filters.status !== "" ? Number(v.status) === Number(filters.status) : true)
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentBlogs = filteredBlogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);

    if (loading) return (
        <div className="my-5 text-center">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3">Đang tải danh sách bài viết...</p>
        </div>
    );

    if (error) return (
        <div className="my-5">
            <div className="alert alert-danger text-center">{error}</div>
        </div>
    );

    return (
        <div className="menus-container">
            {/* ✅ Toast thông báo */}
            <ToastContainer position="top-right" autoClose={3000} theme="colored" />

            <div className="header-section">
                <h2>📝 Quản lý Bài Viết</h2>
                <button className="btn-add" onClick={() => navigate("/admin/blog/add")}>
                    + Thêm Mới
                </button>
            </div>

            <div className="menus-actions">
                <input
                    type="text"
                    name="title"
                    placeholder="🔎 Tìm theo tên bài viết..."
                    value={filters.title}
                    onChange={handleFilterChange}
                />
                <select name="status" value={filters.status} onChange={handleFilterChange}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="1">Hiển thị</option>
                    <option value="0">Ẩn</option>
                </select>
                <button className="btn-add btn-outline-warning" onClick={resetFilters}>
                    Làm mới
                </button>
            </div>

            {filteredBlogs.length === 0 ? (
                <p className="no-data">Không có bài viết nào phù hợp.</p>
            ) : (
                <>
                    <table className="menus-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Hình ảnh</th>
                                <th>Tiêu đề</th>
                                <th>Nội dung</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentBlogs.map((blog, idx) => (
                                <tr key={blog.id}>
                                    <td>{indexOfFirstItem + idx + 1}</td>
                                    <td>
                                        {blog.image ? (
                                            <img
                                                src={
                                                    blog.image.startsWith("blogs/")
                                                        ? `http://localhost:8000/storage/${blog.image}`
                                                        : `http://localhost:8000/storage/blogs/${blog.image}`
                                                }
                                                alt={blog.title}
                                                className="menu-image"
                                            />
                                        ) : (
                                            <span>Không có hình</span>
                                        )}
                                    </td>
                                    <td>{blog.title}</td>
                                    <td className="blog-content">
                                        {stripHtml(blog.content).substring(0, 60)}...
                                    </td>

                                    <td className={blog.status ? "status-active" : "status-inactive"}>
                                        {blog.status ? "Hiển thị" : "Ẩn"}
                                    </td>
                                    <td>
                                        {blog.created_at
                                            ? new Date(blog.created_at).toLocaleDateString("vi-VN", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                            })
                                            : "Không có dữ liệu"}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-edit"
                                                onClick={() => navigate(`/admin/blog/edit/${blog.id}`)}
                                            >
                                                ✏️ Sửa
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDelete(blog.id)}
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
                                ⏮
                            </button>
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => prev - 1)}
                            >
                                ◀
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
                                ▶
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                            >
                                ⏭
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default BlogList;
