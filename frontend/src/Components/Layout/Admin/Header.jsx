import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
    return (
        <>
            <nav className="main-header navbar navbar-expand navbar-dark bg-primary px-3">
                {/* Left navbar links */}
                <ul className="navbar-nav">
                    <li className="nav-item">
                        <button className="btn btn-link nav-link text-white" title="Menu">
                            <i className="bi bi-list" />
                        </button>
                    </li>
                    <li className="nav-item d-none d-sm-inline-block">
                        <Link to="/admin" className="nav-link text-white">Trang chủ</Link>
                    </li>
                </ul>

                {/* Right navbar links */}
                <ul className="navbar-nav ms-auto">
                    {/* User / Settings */}
                    <li className="nav-item dropdown">
                        <button className="btn btn-link nav-link text-white dropdown-toggle" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                            <i className="bi bi-person-circle" />
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                            <li><Link className="dropdown-item" to="/">Đăng xuất</Link></li>
                        </ul>
                    </li>
                </ul>
            </nav>
        </>
    );
};

export default Header;
