import React from "react";

function Footer() {
    return (
        <>
            <div
                className="container-fluid footer py-6 my-6 mb-0 wow bounceInUp bg-white"
                data-wow-delay="0.1s"
                style={{
                    visibility: "visible",
                    animationDelay: "0.1s",
                    animationName: "bounceInUp"
                }}
            >
                <div className="container">
                    <div className="row">
                        {/* Giới thiệu */}
                        <div className="col-lg-3 col-md-6">
                            <div className="footer-item">
                                <h1 className="fw-bold" style={{ color: "#6a11cb" }}>
                                    Happy<span style={{ color: "#2575fc" }}>Event</span>
                                </h1>
                                <p className="lh-lg mb-4 text-dark">
                                    HappyEvent là nhà hàng chuyên tổ chức tiệc và sự kiện, mang đến
                                    không gian sang trọng, ẩm thực tinh tế và dịch vụ chuyên nghiệp,
                                    phù hợp cho mọi dịp đặc biệt của bạn.
                                </p>
                                <div className="footer-icon d-flex">
                                    <a className="btn btn-sm-square me-2 rounded-circle"
                                       style={{ backgroundColor: "#6a11cb", color: "white" }} href="">
                                        <i className="fab fa-facebook-f" />
                                    </a>
                                    <a className="btn btn-sm-square me-2 rounded-circle"
                                       style={{ backgroundColor: "#6a11cb", color: "white" }} href="">
                                        <i className="fab fa-twitter" />
                                    </a>
                                    <a className="btn btn-sm-square me-2 rounded-circle"
                                       style={{ backgroundColor: "#6a11cb", color: "white" }} href="">
                                        <i className="fab fa-instagram" />
                                    </a>
                                    <a className="btn btn-sm-square rounded-circle"
                                       style={{ backgroundColor: "#6a11cb", color: "white" }} href="">
                                        <i className="fab fa-linkedin-in" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Thực đơn */}
                        <div className="col-lg-3 col-md-6">
                            <div className="footer-item">
                                <h4 className="mb-4" style={{ color: "#6a11cb" }}>Thực đơn phong phú</h4>
                                <div className="d-flex flex-column align-items-start">
                                    {["Món Khai Vị", "Món Chính", "Món Lẩu", "Đồ Uống", "Món Tráng Miệng"].map((item, idx) => (
                                        <a key={idx} className="mb-2" href=""
                                           style={{ color: "#2575fc", textDecoration: "none" }}>
                                            <i className="fa fa-check me-2" style={{ color: "#6a11cb" }} /> {item}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Liên hệ */}
                        <div className="col-lg-3 col-md-6">
                            <div className="footer-item">
                                <h4 className="mb-4" style={{ color: "#6a11cb" }}>Liên hệ với chúng tôi</h4>
                                <div className="d-flex flex-column align-items-start">
                                    <p style={{ color: "#2575fc" }}>
                                        <i className="fa fa-map-marker-alt me-2" style={{ color: "#6a11cb" }} />
                                        A12 Phan Văn Trị - Phường Hạnh Thông - Tp. Hồ Chí Minh
                                    </p>
                                    <p style={{ color: "#2575fc" }}>
                                        <i className="fa fa-phone-alt me-2" style={{ color: "#6a11cb" }} /> 0986256445
                                    </p>
                                    <p style={{ color: "#2575fc" }}>
                                        <i className="fas fa-envelope me-2" style={{ color: "#6a11cb" }} /> happy000event@gmail.com
                                    </p>
                                    <p style={{ color: "#2575fc" }}>
                                        <i className="fa fa-clock me-2" style={{ color: "#6a11cb" }} /> Dịch vụ 24/7
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Thư viện ảnh */}
                        <div className="col-lg-3 col-md-6">
                            <div className="footer-item">
                                <h4 className="mb-4" style={{ color: "#6a11cb" }}>Thư viện ảnh</h4>
                                <div className="row g-2">
                                    {["menu-01.jpg", "menu-02.jpg", "menu-05.jpg", "menu-07.jpg", "menu-08.jpg", "menu-04.jpg"].map((img, idx) => (
                                        <div className="col-4" key={idx}>
                                            <img
                                                src={`/asset/img/${img}`}
                                                className="img-fluid rounded-circle border p-2"
                                                style={{ borderColor: "#6a11cb" }}
                                                alt=""
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Footer;
