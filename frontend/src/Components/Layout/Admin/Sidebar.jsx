import { Link, useLocation } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import { getUnreadCount as getUnreadEmails } from "../../../services/emailAdmin";
import { getUnreadCount as getUnreadOrders, markOrdersAsRead } from "../../../services/orderAdmin";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Sidebar = () => {
    const location = useLocation();
    const [unreadEmails, setUnreadEmails] = useState(0);
    const [unreadOrders, setUnreadOrders] = useState(0);

    const prevEmailCountRef = useRef(0);
    const prevOrderCountRef = useRef(0);
    const isFirstLoadRef = useRef(true);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                // 📩 Email
                const emailCount = await getUnreadEmails();
                console.log("📩 Email count:", emailCount);

                if (!isFirstLoadRef.current && emailCount > prevEmailCountRef.current) {
                    const newEmails = emailCount - prevEmailCountRef.current;
                    toast.info(`📩 Bạn có ${newEmails} email mới`, {
                        position: "top-right",
                        autoClose: 3000,
                    });
                }

                setUnreadEmails(emailCount);
                prevEmailCountRef.current = emailCount;

                // 🛒 Orders
                const orderCount = await getUnreadOrders();
                console.log("🛒 Orders count:", orderCount);

                if (!isFirstLoadRef.current && orderCount > prevOrderCountRef.current) {
                    const newOrders = orderCount - prevOrderCountRef.current;
                    toast.info(`🛒 Bạn có ${newOrders} đơn hàng mới`, {
                        position: "top-right",
                        autoClose: 3000,
                    });
                }

                setUnreadOrders(orderCount);
                prevOrderCountRef.current = orderCount;

                // ✅ sau lần đầu load
                isFirstLoadRef.current = false;
            } catch (err) {
                console.error("❌ Lỗi fetch unread:", err);
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 5000);
        return () => clearInterval(interval);
    }, []);

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
                            <SidebarItem
                                to="/admin"
                                icon="bi-graph-up"
                                label="Thống kê"
                                isActive={location.pathname === "/admin"}
                            />
                            <SidebarItem
                                to="/admin/history"
                                icon="bi-bag"
                                label="Quản lý đơn hàng"
                                isActive={location.pathname === "/admin/history"}
                                unreadCount={unreadOrders}
                                onClick={async () => {
                                    const success = await markOrdersAsRead();
                                    if (success) {
                                        setUnreadOrders(0);
                                    }
                                }}
                            />
                            <SidebarItem
                                to="/admin/emails"
                                icon="bi-envelope"
                                label="Quản lý email"
                                isActive={location.pathname === "/admin/emails"}
                                unreadCount={unreadEmails}
                            />
                            <SidebarItem
                                to="/admin/schedule"
                                icon="bi-clock-history"
                                label="Quản lý lịch"
                                isActive={location.pathname === "/admin/schedule"}
                            />
                            <SidebarItem
                                to="/admin/rooms"
                                icon="bi-building"
                                label="Quản lý phòng"
                                isActive={location.pathname === "/admin/rooms"}
                            />
                            <SidebarItem
                                to="/admin/location-types"
                                icon="bi-geo-alt"
                                label="Quản lý loại phòng "
                                isActive={location.pathname === "/admin/location-types"}
                            />
                            <SidebarItem
                                to="/admin/menus"
                                icon="bi-card-list"
                                label="Quản lý thực đơn"
                                isActive={location.pathname.startsWith("/admin/menus")}
                            />
                            <SidebarItem
                                to="/admin/category-menus"
                                icon="bi-list-ul"
                                label="Quản lý loại thực đơn"
                                isActive={location.pathname.startsWith("/admin/category-menus")}
                            />
                            <SidebarItem
                                to="/admin/users"
                                icon="bi-person"
                                label="Quản lý người dùng"
                                isActive={location.pathname === "/admin/users"}
                            />
                            <SidebarItem
                                to="/admin/voucher"
                                icon="bi-ticket-perforated"
                                label="Quản lý voucher"
                                isActive={location.pathname === "/admin/voucher"}
                            />
                            <SidebarItem
                                to="/admin/blogs"
                                icon="bi-newspaper"
                                label="Quản lý bài viết"
                                isActive={location.pathname === "/admin/blogs"}
                            />
                            <SidebarItem
                                to="/"
                                icon="bi-box-arrow-right"
                                label="Đăng xuất"
                                isActive={location.pathname === "/"}
                            />
                        </ul>
                    </nav>
                </div>
            </aside>

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
            <div className="d-flex align-items-center">
                <i className={`bi ${icon} me-2`} />
                <span>{label}</span>
            </div>
            {unreadCount > 0 && (
                <span
                    className="badge rounded-circle bg-danger text-white d-flex align-items-center justify-content-center"
                    style={{
                        width: "22px",
                        height: "22px",
                        fontSize: "12px",
                        lineHeight: "1",
                        boxShadow: "0 0 4px rgba(255, 0, 0, 1)",
                    }}
                >
                    {unreadCount}
                </span>
            )}
        </Link>
    </li>
);

export default Sidebar;
