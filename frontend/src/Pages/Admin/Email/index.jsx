import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { getAllEmails, markEmailAsRead } from "../../../services/emailAdmin";
import "./email.css";

function EmailList() {
    const [loading, setLoading] = useState(true);
    const [emails, setEmails] = useState([]);
    const [filters, setFilters] = useState({
        name: "",
        email: "",
        fromDate: "",
        toDate: "",
        status: "",
    });
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
            <div className="my-5 text-center text-danger">❌ {error}</div>
        );
    }

    // ✅ Xử lý thay đổi filter
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({
            name: "",
            email: "",
            fromDate: "",
            toDate: "",
            status: "",
        });
        setCurrentPage(1);
    };

    // ✅ Lọc dữ liệu
    const filteredEmails = emails.filter((item) => {
        const matchesName = item.name
            ?.toLowerCase()
            .includes(filters.name.toLowerCase());
        const matchesEmail = item.email
            ?.toLowerCase()
            .includes(filters.email.toLowerCase());

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

        // ✅ lọc theo trạng thái
        let matchesStatus = true;
        if (filters.status === "unread") {
            if (item.is_read || item.is_replied) matchesStatus = false;
        }
        if (filters.status === "read") {
            if (!item.is_read || item.is_replied) matchesStatus = false;
        }
        if (filters.status === "replied") {
            if (!item.is_replied) matchesStatus = false;
        }

        return matchesName && matchesEmail && matchesDate && matchesStatus;
    });

    // ✅ Phân trang
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEmails = filteredEmails.slice(
        indexOfFirstItem,
        indexOfLastItem
    );
    const totalPages = Math.ceil(filteredEmails.length / itemsPerPage);

    // ✅ Xử lý xem chi tiết email
    const handleViewDetail = async (email) => {
        try {
            if (!email.is_read) {
                const success = await markEmailAsRead(email.id);
                if (success) {
                    setEmails((prev) =>
                        prev.map((item) =>
                            item.id === email.id ? { ...item, is_read: true } : item
                        )
                    );
                }
            }
            setActiveId(email.id);
            navigate(`/admin/email/${email.id}`);
        } catch (err) {
            console.error("Lỗi khi cập nhật email:", err);
        }
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

                <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                >
                    <option value="">-- Tất cả --</option>
                    <option value="unread">Chưa đọc</option>
                    <option value="read">Đã đọc</option>
                    <option value="replied">Đã phản hồi</option>
                </select>

                <button
                    className="btn-add btn-outline-warning"
                    onClick={resetFilters}
                >
                    Làm mới
                </button>
            </div>

            {filteredEmails.length === 0 ? (
                <p className="no-data">
                    {filters.status === "unread"
                        ? "📩 Hiện tại không có email chưa đọc."
                        : filters.status === "read"
                            ? "📬 Hiện tại không có email đã đọc."
                            : filters.status === "replied"
                                ? "✅ Hiện tại không có email đã phản hồi."
                                : "⚠️ Không có dữ liệu phù hợp."}
                </p>
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
                                        {email.is_replied ? (
                                            <span className="replied-badge">Đã phản hồi</span>
                                        ) : email.is_read ? (
                                            <span className="read-badge">Đã đọc</span>
                                        ) : (
                                            <span className="unread-dot"></span>
                                        )}
                                    </td>
                                    <td>{email.email}</td>
                                    <td>{email.phone || "—"}</td>
                                    <td className="blog-content">
                                        {email.message?.substring(0, 60)}...
                                    </td>
                                    <td>
                                        {email.created_at
                                            ? new Date(email.created_at).toLocaleDateString(
                                                "vi-VN",
                                                {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                }
                                            )
                                            : "Không có dữ liệu"}
                                    </td>
                                    <td
                                        className={`td-action ${activeId === email.id ? "active" : ""
                                            }`}
                                    >
                                        <div className="action-buttons">
                                            <button
                                                className="btn-view"
                                                onClick={() => handleViewDetail(email)}
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
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(1)}
                            >
                                ««
                            </button>
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => prev - 1)}
                            >
                                «
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
                                »
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(totalPages)}
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

export default EmailList;
