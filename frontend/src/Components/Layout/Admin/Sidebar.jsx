import { Link, useLocation } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import { getUnreadCount, markEmailsAsRead } from "../../../services/emailAdmin";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Sidebar = () => {
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);
    const prevCountRef = useRef(0); // lưu giá trị cũ để so sánh

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const count = await getUnreadCount();

                // Nếu có email mới hơn số trước đó thì báo
                if (count > prevCountRef.current) {
                    toast.info(`📩 Bạn có ${count - prevCountRef.current} email mới`, {
                        position: "top-right",
                    });
                }

                setUnreadCount(count);
                prevCountRef.current = count;
            } catch (err) {
                console.error(err);
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 5000); // refresh mỗi 10s
        return () => clearInterval(interval);
    }, []);

    const handleEmailClick = async () => {
        await markEmailsAsRead();
        setUnreadCount(0);
        prevCountRef.current = 0; // reset luôn
    };

    return (
        <>
            <aside className="main-sidebar sidebar-dark-primary elevation-4">
                <div className="sidebar">
                    {/* Sidebar User Panel */}
                    <div className="user-panel mt-3 pb-3 mb-3 d-flex align-items-center justify-content-start ps-3">
                        <div className="image">
                            <img
                                src="/asset/img/logo.png"
                                className="img-circle elevation-2"
                                alt="User"
                                style={{ width: "45px", height: "45px", objectFit: "cover" }}
                            />
                        </div>
                        <div className="info ms-3">
                            <span className="d-block text-white">HAPPY EVENT</span>
                        </div>
                    </div>

                    {/* Sidebar Menu */}
                    <nav className="mt-2">
                        <ul className="nav nav-pills nav-sidebar flex-column">
                            <SidebarItem to="/admin/history" icon="bi-clock-history" label="Quản lý đơn hàng" isActive={location.pathname === "/admin/history"} />
                            <SidebarItem
                                to="/admin/emails"
                                icon="bi-envelope"
                                label="Quản lý email"
                                isActive={location.pathname === "/admin/emails"}
                                unreadCount={unreadCount}
                                onClick={handleEmailClick}
                            />
                            <SidebarItem to="/admin/schedule" icon="bi-clock-history" label="Quản lý lịch" isActive={location.pathname === "/admin/schedule"} />
                            <SidebarItem to="/admin/rooms" icon="bi-building" label="Quản lý phòng" isActive={location.pathname === "/admin/rooms"} />
                            <SidebarItem to="/admin/location-types" icon="bi-geo-alt" label="Quản lý loại phòng " isActive={location.pathname === "/admin/location-types"} />
                            <SidebarItem to="/admin/menus" icon="bi-card-list" label="Quản lý thực đơn" isActive={location.pathname.startsWith("/admin/menus")} />
                            <SidebarItem to="/admin/category-menus" icon="bi-list-ul" label="Quản lý loại thực đơn" isActive={location.pathname.startsWith("/admin/category-menus")} />
                            <SidebarItem to="/admin/users" icon="bi-person" label="Quản lý người dùng" isActive={location.pathname === "/admin/users"} />
                            <SidebarItem to="/admin/voucher" icon="bi-ticket-perforated" label="Quản lý voucher" isActive={location.pathname === "/admin/voucher"} />
                            <SidebarItem to="/admin/blogs" icon="bi-newspaper" label="Quản lý bài viết" isActive={location.pathname === "/admin/blogs"} />
                            <SidebarItem to="/" icon="bi-box-arrow-right" label="Đăng xuất" isActive={location.pathname === "/"} />
                        </ul>
                    </nav>
                </div>
            </aside>

            {/* Toast Container để hiển thị thông báo */}
            <ToastContainer />
        </>
    );
};

const SidebarItem = ({ to, icon, label, isActive, unreadCount, onClick }) => (
    <li className="nav-item">
        <Link
            to={to}
            className={`nav-link d-flex align-items-center justify-content-between ${isActive ? "active" : ""}`}
            onClick={onClick}
        >
            {/* Icon + label */}
            <div className="d-flex align-items-center">
                <i className={`bi ${icon} me-2`} />
                <span>{label}</span>
            </div>

            {/* Badge hiển thị số chưa đọc */}
            {unreadCount > 0 && (
                <span
                    className="badge rounded-circle bg-danger text-white d-flex align-items-center justify-content-center"
                    style={{
                        width: "22px",
                        height: "22px",
                        fontSize: "12px",
                        lineHeight: "1",
                    }}
                >
                    {unreadCount}
                </span>
            )}
        </Link>
    </li>
);

export default Sidebar;
