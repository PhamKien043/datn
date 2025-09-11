import React from "react";
import RoomList from "../../Components/Layout/Client/RoomList.jsx";

function Index() {
    // Gradient style cho text
    const gradientText = {
        background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        fontWeight: "600",
    };

    // Gradient style cho nút
    const gradientButton = {
        background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
        color: "#fff",
        border: "none",
        borderRadius: "9999px",
        padding: "12px 28px",
        fontWeight: "500",
        textDecoration: "none",
        transition: "all 0.3s ease",
    };

    return (
        <div>
            <>
                {/* Modal Search Start */}
                <div
                    className="modal fade"
                    id="searchModal"
                    tabIndex={-1}
                    aria-labelledby="exampleModalLabel"
                    aria-hidden="true"
                >
                    <div className="modal-dialog modal-fullscreen">
                        <div className="modal-content rounded-0">
                            <div className="modal-header">
                                <h5 className="modal-title" id="exampleModalLabel" style={gradientText}>
                                    Tìm kiếm theo từ khóa
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    data-bs-dismiss="modal"
                                    aria-label="Đóng"
                                />
                            </div>
                            <div className="modal-body d-flex align-items-center">
                                <div className="input-group w-75 mx-auto d-flex">
                                    <input
                                        type="search"
                                        className="form-control bg-transparent p-3"
                                        placeholder="nhập từ khóa"
                                        aria-describedby="search-icon-1"
                                    />
                                    <span
                                        id="search-icon-1"
                                        className="input-group-text p-3"
                                        style={gradientText}
                                    >
                                        <i className="fa fa-search" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Modal Search End */}

                {/* Hero Start */}
                <div
                    className="container-fluid py-6 my-6 mt-0"
                    style={{
                        backgroundImage: `
      linear-gradient(
        to right,
        rgba(255, 255, 255, 0.95) 0%,
        rgba(255, 255, 255, 0.85) 35%,
        rgba(255, 255, 255, 0.65) 60%,
        rgba(255, 255, 255, 0.35) 80%
      ),
      url('/img/banner.jpg')
    `,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        minHeight: 700,
                        paddingTop: "clamp(80px, 12vw, 160px)",
                    }}
                >
                    <div className="container">
                        <div className="row g-5 align-items-center">
                            <div className="col-lg-7 col-md-12">
                                <small
                                    className="d-inline-block fw-bold text-uppercase bg-light border rounded-pill px-4 py-1 mb-4 mt-4 animated bounceInDown"
                                    style={gradientText}
                                >
                                    Chào mừng đến với HappyEvent
                                </small>
                                <h1 className="display-1 mb-4 animated bounceInDown" style={gradientText}>
                                    Đặt Dịch Vụ cho sự kiện mơ ước của bạn
                                </h1>
                                <a
                                    href=""
                                    className="me-4 animated bounceInLeft"
                                    style={gradientButton}
                                >
                                    Đặt ngay
                                </a>
                                <a
                                    href=""
                                    className="animated bounceInLeft"
                                    style={gradientButton}
                                >
                                    Tìm hiểu thêm
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Hero End */}

                {/* Rooms Start */}
                <RoomList />

                {/* Fact Start*/}
                <div className="container-fluid faqt py-6">
                    <div className="container">
                        <div className="row g-4 align-items-center">
                            <div className="col-lg-7">
                                <div className="row g-4">
                                    <div className="col-sm-4 wow bounceInUp" data-wow-delay="0.3s">
                                        <div
                                            className="faqt-item rounded p-4 text-center"
                                            style={{
                                                background: "linear-gradient(90deg,#667eea,#764ba2)",
                                                color: "#fff",
                                            }}
                                        >
                                            <i className="fas fa-users fa-4x mb-4 text-white" />
                                            <h1 className="display-4 fw-bold" data-toggle="counter-up">
                                                189
                                            </h1>
                                            <p className="text-white text-uppercase fw-bold mb-0">
                                                Khách Hàng Hài Lòng
                                            </p>
                                        </div>
                                    </div>
                                    <div className="col-sm-4 wow bounceInUp" data-wow-delay="0.5s">
                                        <div
                                            className="faqt-item rounded p-4 text-center"
                                            style={{
                                                background: "linear-gradient(90deg,#667eea,#764ba2)",
                                                color: "#fff",
                                            }}
                                        >
                                            <i className="fas fa-users-cog fa-4x mb-4 text-white" />
                                            <h1 className="display-4 fw-bold" data-toggle="counter-up">
                                                56
                                            </h1>
                                            <p className="text-white text-uppercase fw-bold mb-0">
                                                Đầu Bếp Chuyên Nghiệp
                                            </p>
                                        </div>
                                    </div>
                                    <div className="col-sm-4 wow bounceInUp" data-wow-delay="0.7s">
                                        <div
                                            className="faqt-item rounded p-4 text-center"
                                            style={{
                                                background: "linear-gradient(90deg,#667eea,#764ba2)",
                                                color: "#fff",
                                            }}
                                        >
                                            <i className="fas fa-check fa-4x mb-4 text-white" />
                                            <h1 className="display-4 fw-bold" data-toggle="counter-up">
                                                253
                                            </h1>
                                            <p className="text-white text-uppercase fw-bold mb-0">
                                                Sự Kiện Đã Hoàn Thành
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-5 wow bounceInUp" data-wow-delay="0.1s">
                                <div className="video">
                                    <button
                                        type="button"
                                        className="btn btn-play"
                                        data-bs-toggle="modal"
                                        data-src="https://www.youtube.com/embed/DWRcNpR6Kdc"
                                        data-bs-target="#videoModal"
                                    >
                                        <span />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        </div>
    );
}

export default Index;
