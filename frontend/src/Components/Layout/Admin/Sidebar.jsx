import { Link, useLocation } from "react-router-dom";
import React from "react";

const Sidebar = () => {
    const location = useLocation();

    return (
        <aside className="main-sidebar sidebar-dark-primary elevation-4">
            <div className="sidebar">
                {/* Sidebar User Panel */}
                <div className="user-panel mt-3 pb-3 mb-3 d-flex align-items-center justify-content-start ps-3">
                    <div className="image">
                        <img
                            src="/asset/img/logo.png"
                            className="img-circle elevation-2"
                            alt="User"
                            style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                        />
                    </div>
                    <div className="info ms-3">
                        <span className="d-block text-white">HAPPY EVENT</span>
                    </div>
                </div>

                {/* Sidebar Menu */}
                <nav className="mt-2">
                    <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
                        <SidebarItem to="/admin/history" icon="bi-clock-history" label="Quản lý đơn hàng" isActive={location.pathname === "/admin/history"} />
                        <SidebarItem to="/admin/schedule" icon="bi-clock-history" label="Quản lý lịch" isActive={location.pathname === "/admin/schedule"} />
                        <SidebarItem to="/admin/rooms" icon="bi-building" label="Quản lý phòng" isActive={location.pathname === "/admin/rooms"} />
                        <SidebarItem to="/admin/location-types" icon="bi-geo-alt" label="Quản lý loại phòng " isActive={location.pathname === "/admin/location-types"} />
                        <SidebarItem to="/admin/menus" icon="bi-card-list" label="Quản lý thực đơn" isActive={location.pathname.startsWith("/admin/menus")} />
                        <SidebarItem to="/admin/category-menus" icon="bi-list-ul" label="Quản lý loại thực đơn" isActive={location.pathname.startsWith("/admin/category-menus")} />
                        <SidebarItem to="/admin/users" icon="bi-person" label="Quản lý người dùng" isActive={location.pathname === "/admin/users"} />
                        <SidebarItem to="/admin/voucher" icon="bi-ticket-perforated" label="Quản lý voucher" isActive={location.pathname === "/admin/voucher"} />
                        {/*<SidebarItem to="/admin/Commnent" icon="bi-chat-dots" label="Bình luận" isActive={location.pathname === "/admin/Comment"} />*/}
                        {/* Thêm quản lý đơn hàng */}


                        <SidebarItem to="/" icon="bi-box-arrow-right" label="Đăng xuất" isActive={location.pathname === "/"} />
                    </ul>
                </nav>
            </div>
        </aside>
    );
};

const SidebarItem = ({ to, icon, label, isActive }) => (
    <li className="nav-item">
        <Link to={to} className={`nav-link ${isActive ? 'active' : ''}`}>
            <i className={`nav-icon bi ${icon}`} />
            <p>{label}</p>
        </Link>
    </li>
);

export default Sidebar;
