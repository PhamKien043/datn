import React from "react";

function Footer() {
    return (
        <>
            <div
                className="container-fluid footer py-6 my-6 mb-0 bg-light wow bounceInUp"
                data-wow-delay="0.1s"
                style={{
                    visibility: "visible",
                    animationDelay: "0.1s",
                    animationName: "bounceInUp"
                }}
            >
                <div className="container">
                    <div className="row">
                        <div className="col-lg-3 col-md-6">
                            <div className="footer-item">
                                <h1 className="text-primary">
                                    Happy<span className="text-dark">Event</span>
                                </h1>
                                <p className="lh-lg mb-4">
                                    HappyEvent là nhà hàng chuyên tổ chức tiệc và sự kiện, mang đến không gian sang trọng, ẩm thực tinh tế và dịch vụ chuyên nghiệp, phù hợp cho mọi dịp đặc biệt của bạn.
                                </p>
                                <div className="footer-icon d-flex">
                                    <a
                                        className="btn btn-primary btn-sm-square me-2 rounded-circle"
                                        href=""
                                    >
                                        <i className="fab fa-facebook-f" />
                                    </a>
                                    <a
                                        className="btn btn-primary btn-sm-square me-2 rounded-circle"
                                        href=""
                                    >
                                        <i className="fab fa-twitter" />
                                    </a>
                                    <a
                                        href="#"
                                        className="btn btn-primary btn-sm-square me-2 rounded-circle"
                                    >
                                        <i className="fab fa-instagram" />
                                    </a>
                                    <a
                                        href="#"
                                        className="btn btn-primary btn-sm-square rounded-circle"
                                    >
                                        <i className="fab fa-linkedin-in" />
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="footer-item">
                                <h4 className="mb-4">Thực đơn phong phú</h4>
                                <div className="d-flex flex-column align-items-start">
                                    <a className="text-body mb-3" href="">
                                        <i className="fa fa-check text-primary me-2" />
                                        Món Khai Vị
                                    </a>
                                    <a className="text-body mb-3" href="">
                                        <i className="fa fa-check text-primary me-2" />
                                        Món Chính
                                    </a>
                                    <a className="text-body mb-3" href="">
                                        <i className="fa fa-check text-primary me-2" />
                                        Món Lẩu
                                    </a>
                                    <a className="text-body mb-3" href="">
                                        <i className="fa fa-check text-primary me-2" />
                                        Đồ Uống
                                    </a>
                                    <a className="text-body mb-3" href="">
                                        <i className="fa fa-check text-primary me-2" />
                                        Món Tráng Miệng
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="footer-item">
                                <h4 className="mb-4">Liên hệ với chúng tôi</h4>
                                <div className="d-flex flex-column align-items-start">
                                    <p>
                                        <i className="fa fa-map-marker-alt text-primary me-2" />
                                        A12 Phan Văn Trị - Phường Hạnh Thông - Tp. Hồ Chí Minh
                                    </p>
                                    <p>
                                        <i className="fa fa-phone-alt text-primary me-2" /> 0986256445
                                    </p>
                                    <p>
                                        <i className="fas fa-envelope text-primary me-2" />{" "}
                                        happy000event@gmail.com
                                    </p>
                                    <p>
                                        <i className="fa fa-clock text-primary me-2" /> Dịch vụ 24/7
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="footer-item">
                                <h4 className="mb-4">Thư viện ảnh</h4>
                                <div className="row g-2">
                                    <div className="col-4">
                                        <img
                                            src="/asset/img/menu-01.jpg"
                                            className="img-fluid rounded-circle border border-primary p-2"
                                            alt=""
                                        />
                                    </div>
                                    <div className="col-4">
                                        <img
                                            src="/asset/img/menu-02.jpg"
                                            className="img-fluid rounded-circle border border-primary p-2"
                                            alt=""
                                        />
                                    </div>
                                    <div className="col-4">
                                        <img
                                            src="/asset/img/menu-05.jpg"
                                            className="img-fluid rounded-circle border border-primary p-2"
                                            alt=""
                                        />
                                    </div>
                                    <div className="col-4">
                                        <img
                                            src="/asset/img/menu-07.jpg"
                                            className="img-fluid rounded-circle border border-primary p-2"
                                            alt=""
                                        />
                                    </div>
                                    <div className="col-4">
                                        <img
                                            src="/asset/img/menu-08.jpg"
                                            className="img-fluid rounded-circle border border-primary p-2"
                                            alt=""
                                        />
                                    </div>
                                    <div className="col-4">
                                        <img
                                            src="/asset/img/menu-04.jpg"
                                            className="img-fluid rounded-circle border border-primary p-2"
                                            alt=""
                                        />
                                    </div>
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
