import React from "react";
import MyHead from "./Head";
import { getUserFromStorage, serverLogout } from "/src/services/authService";

function Header() {
    const user = getUserFromStorage();

    const handleLogout = async () => {
        await serverLogout();
        window.location.href = "/login";
    };

    return (
        <div>
            <div className="container-fluid nav-bar">
                <div className="container">
                    <nav className="navbar navbar-expand-lg py-4">
                        <a href="/" className="navbar-brand">
                            <h1 className="text-primary fw-bold mb-0">
                                Happy<span className="text-dark">Event</span>{" "}
                            </h1>
                        </a>
                        <button
                            className="navbar-toggler py-2 px-3"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#navbarCollapse"
                        >
                            <span className="fa fa-bars text-primary" />
                        </button>
                        <div className="collapse navbar-collapse" id="navbarCollapse">
                            <div className="navbar-nav mx-auto">
                                <a href="/" className="nav-item nav-link">Trang chủ</a>
                                <a href="/Service" className="nav-item nav-link">Dịch vụ</a>
                                <a href="/Menu" className="nav-item nav-link">Thực đơn</a>
                                <a href="/About" className="nav-item nav-link">Giới thiệu</a>
                                <a href="/Contact" className="nav-item nav-link">Liên hệ</a>
                            </div>



                            {/* Nút giỏ hàng */}
                            <a
                                href="/cart-details"
                                className="btn btn-outline-primary btn-md-square me-3 rounded-circle d-none d-lg-inline-flex"
                                title="Giỏ hàng"
                            >
                                <i className="fas fa-shopping-cart" />
                            </a>

                            {/* Nếu đã đăng nhập thì hiện tên và logout */}
                            {user ? (
                                <div className="nav-item dropdown d-inline-block">
                                    <a href="#" className="nav-link dropdown-toggle fw-bold text-primary" data-bs-toggle="dropdown">
                                        {user.name}
                                    </a>
                                    <div className="dropdown-menu bg-light">
                                        <a href="/my-orders" className="dropdown-item">Đơn hàng của tôi</a>
                                        <button className="dropdown-item btn btn-link text-danger" onClick={handleLogout}>
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <a
                                    href="/Login"
                                    className="btn btn-primary py-2 px-4 d-none d-xl-inline-block rounded-pill"
                                >
                                    Đăng nhập
                                </a>
                            )}
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    );
}

export default Header;
