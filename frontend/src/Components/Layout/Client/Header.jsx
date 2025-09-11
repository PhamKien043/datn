import React from "react";
import MyHead from "./Head";
import { getUserFromStorage, serverLogout } from "/src/services/authService";

function Header() {
  const user = getUserFromStorage();

  const handleLogout = async () => {
    await serverLogout();
    window.location.href = "/login";
  };

  // style gradient chữ
  const gradientText = {
    background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontWeight: "600",
  };

  // style gradient nút
  const gradientButton = {
    background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "9999px",
    padding: "10px 24px",
    fontWeight: "500",
    textDecoration: "none",
    transition: "all 0.3s ease",
  };

  return (
    <div>
      <div
        className="container-fluid nav-bar"
        style={{
          backgroundColor: "#fff", // nền trắng
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)", // bóng nhẹ
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <div className="container">
          <nav className="navbar navbar-expand-lg py-4">
            {/* Logo */}
            <a href="/" className="navbar-brand">
              <h1 className="fw-bold mb-0" style={gradientText}>
                Happy<span style={{ color: "#000" }}>Event</span>
              </h1>
            </a>

            <button
              className="navbar-toggler py-2 px-3"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarCollapse"
            >
              <span
                className="fa fa-bars"
                style={{ color: "rgb(102,126,234)" }}
              />
            </button>

            <div className="collapse navbar-collapse" id="navbarCollapse">
              {/* Menu */}
              <div className="navbar-nav mx-auto">
                <a href="/" className="nav-item nav-link" style={gradientText}>
                  Trang chủ
                </a>
                <a
                  href="/Service"
                  className="nav-item nav-link"
                  style={gradientText}
                >
                  Dịch vụ
                </a>
                <a
                  href="/Menu"
                  className="nav-item nav-link"
                  style={gradientText}
                >
                  Thực đơn
                </a>
                <a
                  href="/About"
                  className="nav-item nav-link"
                  style={gradientText}
                >
                  Giới thiệu
                </a>
                <a
                  href="/Blogs"
                  className="nav-item nav-link"
                  style={gradientText}
                >
                  Bài viết
                </a>
                <a
                  href="/Contact"
                  className="nav-item nav-link"
                  style={gradientText}
                >
                  Liên hệ
                </a>
              </div>

              {/* Nút giỏ hàng */}
              <a
                href="/cart-details"
                className="d-none d-lg-inline-flex me-3"
                style={{
                  ...gradientButton,
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  alignItems: "center",
                  justifyContent: "center",
                  display: "flex",
                  padding: "0",
                }}
                title="Giỏ hàng"
              >
                <i className="fas fa-shopping-cart" />
              </a>

              {/* Nếu đã đăng nhập */}
              {user ? (
                <div className="nav-item dropdown d-inline-block">
                  <a
                    href="#"
                    className="nav-link dropdown-toggle fw-bold"
                    data-bs-toggle="dropdown"
                    style={gradientText}
                  >
                    {user.name}
                  </a>
                  <div className="dropdown-menu bg-light">
                    <a
                      href="/my-orders"
                      className="dropdown-item"
                      style={gradientText}
                    >
                      Đơn hàng của tôi
                    </a>
                    <a
                      className="dropdown-item"
                      onClick={handleLogout}
                    style={gradientText}
                    >
                      Đăng xuất
                    </a>
                  </div>
                </div>
              ) : (
                <a
                  href="/Login"
                  className="d-none d-xl-inline-block"
                  style={gradientButton}
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
