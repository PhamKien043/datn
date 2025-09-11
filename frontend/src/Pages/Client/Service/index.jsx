import React from "react";
import { Link } from "react-router-dom";

function Service() {
  return (
    <div
      className="container-fluid py-5"
      style={{
        background: "#fff", // nền trắng
      }}
    >
      <div className="container py-5">
        <div className="text-center mx-auto mb-5" style={{ maxWidth: "600px" }}>
          <small
            className="d-inline-block fw-bold text-uppercase rounded-pill px-4 py-1 mb-3"
            style={{
              border: "2px solid #764ba2",
              color: "#667eea", // xanh tím
              background: "#fff",
              transition: "all 0.3s ease",
              cursor: "default",
            }}
          >
            Dịch Vụ Của Chúng Tôi
          </small>
          <h1
            className="display-5 mb-5"
            style={{
              background: "linear-gradient(90deg, #667eea, #764ba2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "'Playfair Display', serif",
              fontWeight: "700",
            }}
          >
            Chúng Tôi Cung Cấp Những Gì
          </h1>
        </div>

        <div className="row g-4">
          {/* Service Item */}
          <div className="col-lg-3 col-md-6">
            <div
              className="bg-white p-4 text-center h-100 shadow rounded"
              style={{
                border: "1px solid #e0e0e0",
                transition: "transform 0.3s, box-shadow 0.3s",
              }}
            >
              <div
                className="mb-3 d-flex align-items-center justify-content-center"
                style={{
                  width: "70px",
                  height: "70px",
                  margin: "0 auto",
                  borderRadius: "50%",
                  background: "linear-gradient(90deg, #667eea, #764ba2)",
                  color: "#fff",
                  fontSize: "28px",
                }}
              >
                <i className="fas fa-birthday-cake"></i>
              </div>
              <h5 style={{ color: "#4c51bf" }}>Sinh Nhật</h5>
              <p className="mb-0">
                Chúng tôi tổ chức sinh nhật với phong cách độc đáo, mang lại
                những kỷ niệm khó quên.
              </p>
              <Link
                to="/services"
                className="btn btn-link mt-3"
                style={{ color: "#667eea", textDecoration: "none" }}
              >
                Xem thêm <i className="fas fa-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>

          {/* Service Item */}
          <div className="col-lg-3 col-md-6">
            <div
              className="bg-white p-4 text-center h-100 shadow rounded"
              style={{
                border: "1px solid #e0e0e0",
              }}
            >
              <div
                className="mb-3 d-flex align-items-center justify-content-center"
                style={{
                  width: "70px",
                  height: "70px",
                  margin: "0 auto",
                  borderRadius: "50%",
                  background: "linear-gradient(90deg, #667eea, #764ba2)",
                  color: "#fff",
                  fontSize: "28px",
                }}
              >
                <i className="fas fa-heart"></i>
              </div>
              <h5 style={{ color: "#4c51bf" }}>Tiệc Cưới</h5>
              <p className="mb-0">
                Tổ chức tiệc cưới sang trọng, tinh tế với dịch vụ chuyên nghiệp
                và chu đáo.
              </p>
              <Link
                to="/services"
                className="btn btn-link mt-3"
                style={{ color: "#667eea", textDecoration: "none" }}
              >
                Xem thêm <i className="fas fa-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>

          {/* Service Item */}
          <div className="col-lg-3 col-md-6">
            <div
              className="bg-white p-4 text-center h-100 shadow rounded"
              style={{
                border: "1px solid #e0e0e0",
              }}
            >
              <div
                className="mb-3 d-flex align-items-center justify-content-center"
                style={{
                  width: "70px",
                  height: "70px",
                  margin: "0 auto",
                  borderRadius: "50%",
                  background: "linear-gradient(90deg, #667eea, #764ba2)",
                  color: "#fff",
                  fontSize: "28px",
                }}
              >
                <i className="fas fa-building"></i>
              </div>
              <h5 style={{ color: "#4c51bf" }}>Sự Kiện Công Ty</h5>
              <p className="mb-0">
                Cung cấp giải pháp tổ chức sự kiện doanh nghiệp, hội thảo và
                team building.
              </p>
              <Link
                to="/services"
                className="btn btn-link mt-3"
                style={{ color: "#667eea", textDecoration: "none" }}
              >
                Xem thêm <i className="fas fa-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>

          {/* Service Item */}
          <div className="col-lg-3 col-md-6">
            <div
              className="bg-white p-4 text-center h-100 shadow rounded"
              style={{
                border: "1px solid #e0e0e0",
              }}
            >
              <div
                className="mb-3 d-flex align-items-center justify-content-center"
                style={{
                  width: "70px",
                  height: "70px",
                  margin: "0 auto",
                  borderRadius: "50%",
                  background: "linear-gradient(90deg, #667eea, #764ba2)",
                  color: "#fff",
                  fontSize: "28px",
                }}
              >
                <i className="fas fa-glass-cheers"></i>
              </div>
              <h5 style={{ color: "#4c51bf" }}>Party & Sự Kiện Khác</h5>
              <p className="mb-0">
                Tổ chức mọi loại hình tiệc tùng và sự kiện khác theo yêu cầu
                riêng.
              </p>
              <Link
                to="/services"
                className="btn btn-link mt-3"
                style={{ color: "#667eea", textDecoration: "none" }}
              >
                Xem thêm <i className="fas fa-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Service;
