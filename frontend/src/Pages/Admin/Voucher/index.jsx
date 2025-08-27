import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllVouchers, deleteVoucher } from "../../../services/voucher";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./voucher.css";

function Voucher() {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ title: "", status: "", min_order_total: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const navigate = useNavigate();

    useEffect(() => { loadVouchers(); }, []);

    const loadVouchers = async () => {
        setLoading(true);
        try {
            const data = await getAllVouchers();
            setVouchers(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError("Không thể tải danh sách voucher.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa voucher này?")) {
            try {
                await deleteVoucher(id);
                toast.success("Xóa thành công!");
                loadVouchers();
            } catch (err) {
                console.error(err);
                toast.error("Xóa thất bại!");
            }
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({ title: "", status: "", min_order_total: "" });
        setCurrentPage(1);
    };

    const filteredVouchers = vouchers.filter(v =>
        v.title.toLowerCase().includes(filters.title.toLowerCase()) &&
        (filters.status !== "" ? Number(v.status) === Number(filters.status) : true) &&
        (filters.min_order_total !== "" ? Number(v.min_order_total) >= Number(filters.min_order_total) : true)
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentVouchers = filteredVouchers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);

    const formatPrice = (value) => new Intl.NumberFormat("vi-VN").format(value) + " VND";

    if (loading) return (
        <div className="my-5 text-center">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3">Đang tải danh sách voucher...</p>
        </div>
    );

    if (error) return (
        <div className="my-5">
            <div className="alert alert-danger text-center">{error}</div>
        </div>
    );

    return (
        <div className="menus-container">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="header-section">
                <h2>🎟️ Quản lý Voucher</h2>
                <button className="btn-add" onClick={() => navigate("/admin/voucher/add")}>
                    + Thêm Mới
                </button>
            </div>

            <div className="menus-actions">
                <input
                    type="text"
                    name="title"
                    placeholder="🔎 Tìm theo tên voucher..."
                    value={filters.title}
                    onChange={handleFilterChange}
                />
                <select name="status" value={filters.status} onChange={handleFilterChange}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="1">Hoạt động</option>
                    <option value="0">Ngưng hoạt động</option>
                </select>
                <input
                    type="number"
                    name="min_order_total"
                    placeholder="Đơn tối thiểu"
                    value={filters.min_order_total}
                    onChange={handleFilterChange}
                    min="0"
                />
                <button className="btn-add btn-outline-warning" onClick={resetFilters}>Làm mới</button>
            </div>

            {filteredVouchers.length === 0 ? (
                <p className="no-data">Không có voucher nào phù hợp.</p>
            ) : (
                <>
                    <table className="menus-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tên Voucher</th>
                                <th>Giá trị</th>
                                <th>Đơn tối thiểu</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentVouchers.map((voucher, idx) => (
                                <tr key={voucher.id}>
                                    <td>{indexOfFirstItem + idx + 1}</td>
                                    <td>{voucher.title}</td>
                                    <td>{voucher.type === "percent" ? `${voucher.value}%` : formatPrice(voucher.value)}</td>
                                    <td>{formatPrice(voucher.min_order_total)}</td>
                                    <td className={voucher.status ? "status-active" : "status-inactive"}>
                                        {voucher.status ? "Hoạt động" : "Ngưng hoạt động"}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-edit" onClick={() => navigate(`/admin/voucher/edit/${voucher.id}`)}>
                                                ✏️ Sửa
                                            </button>
                                            <button className="btn-delete" onClick={() => handleDelete(voucher.id)}>
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

export default Voucher;
