import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { getAllEmails } from "../../../services/emailAdmin";
import "./email.css";

function EmailList() {
    const [loading, setLoading] = useState(true);
    const [emails, setEmails] = useState([]);
    const [filters, setFilters] = useState({ name: "", email: "", fromDate: "", toDate: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState(null);
    const [activeId, setActiveId] = useState(null);
    const itemsPerPage = 5;
    const navigate = useNavigate();

    useEffect(() => {
        loadEmail();
    }, []);

    // ✅ Gọi API lấy email
    const loadEmail = async () => {
        setLoading(true);
        try {
            const data = await getAllEmails();
            setEmails(
                Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data)
                        ? data
                        : []
            );
        } catch (err) {
            console.error(err);
            setError("Không thể tải danh sách email.");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Khi đang load
    if (loading) {
        return (
            <div className="my-5 text-center">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3">Đang tải danh sách email...</p>
            </div>
        );
    }

    // ✅ Khi lỗi
    if (error) {
        return (
            <div className="my-5 text-center text-danger">
                ❌ {error}
            </div>
        );
    }

    // ✅ Xử lý tìm kiếm
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({ name: "", email: "", fromDate: "", toDate: "" });
        setCurrentPage(1);
    };

    // ✅ Lọc dữ liệu
    const filteredEmails = emails.filter((item) => {
        const matchesName = item.name?.toLowerCase().includes(filters.name.toLowerCase());
        const matchesEmail = item.email?.toLowerCase().includes(filters.email.toLowerCase());

        // so sánh ngày
        const createdAt = item.created_at ? new Date(item.created_at) : null;
        const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
        const toDate = filters.toDate ? new Date(filters.toDate) : null;

        let matchesDate = true;
        if (fromDate && createdAt < fromDate) matchesDate = false;
        if (toDate) {
            toDate.setHours(23, 59, 59, 999);
            if (createdAt > toDate) matchesDate = false;
        }

        return matchesName && matchesEmail && matchesDate;
    });

    // ✅ Phân trang
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEmails = filteredEmails.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredEmails.length / itemsPerPage);

    // ✅ Hàm kiểm tra có phải là email mới hôm nay không
    const isNewToday = (createdAt) => {
        if (!createdAt) return false;
        const today = new Date();
        const createdDate = new Date(createdAt);

        return (
            createdDate.getDate() === today.getDate() &&
            createdDate.getMonth() === today.getMonth() &&
            createdDate.getFullYear() === today.getFullYear()
        );
    };

    return (
        <div className="menus-container">

            <div className="header-section">
                <h2>📩 Quản lý Liên Hệ / Email</h2>
            </div>

            {/* Bộ lọc */}
            <div className="menus-actions">
                <input
                    type="text"
                    name="name"
                    placeholder="🔎 Tìm theo họ tên..."
                    value={filters.name}
                    onChange={handleFilterChange}
                />
                <input
                    type="text"
                    name="email"
                    placeholder="🔎 Tìm theo email..."
                    value={filters.email}
                    onChange={handleFilterChange}
                />
                <div className="date-input">
                    <input
                        type="date"
                        name="fromDate"
                        value={filters.fromDate}
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="date-input">
                    <input
                        type="date"
                        name="toDate"
                        value={filters.toDate}
                        onChange={handleFilterChange}
                    />
                </div>

                <button className="btn-add btn-outline-warning" onClick={resetFilters}>
                    Làm mới
                </button>
            </div>

            {filteredEmails.length === 0 ? (
                <p className="no-data">⚠️ Không có dữ liệu phù hợp.</p>
            ) : (
                <>
                    <table className="menus-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tên người gửi</th>
                                <th>Email</th>
                                <th>Số điện thoại</th>
                                <th>Nội dung</th>
                                <th>Ngày gửi</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentEmails.map((email, idx) => (
                                <tr key={email.id}>
                                    <td>{indexOfFirstItem + idx + 1}</td>
                                    <td>
                                        {email.name}{" "}
                                        {isNewToday(email.created_at) && (
                                            <span className="new-badge">Mới</span>
                                        )}
                                    </td>
                                    <td>{email.email}</td>
                                    <td>{email.phone || "—"}</td>
                                    <td className="blog-content">
                                        {email.message?.substring(0, 60)}...
                                    </td>
                                    <td>
                                        {email.created_at
                                            ? new Date(email.created_at).toLocaleDateString("vi-VN", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                            })
                                            : "Không có dữ liệu"}
                                    </td>
                                    <td
                                        className={`td-action ${activeId === email.id ? "active" : ""}`}
                                    >
                                        <div className="action-buttons">
                                            <button
                                                className="btn-view"
                                                onClick={() => {
                                                    setActiveId(email.id);
                                                    navigate(`/admin/email/${email.id}`);
                                                }}
                                            >
                                                👁️ Xem chi tiết
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* ✅ Phân trang */}
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

export default EmailList;
