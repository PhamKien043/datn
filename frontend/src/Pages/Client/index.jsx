import React from "react";
import RoomList from "../../Components/Layout/Client/RoomList.jsx";


function Index() {
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
                                <h5 className="modal-title" id="exampleModalLabel">
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
                                    <span id="search-icon-1" className="input-group-text p-3">
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
                        // ảnh làm nền full width
                        backgroundImage: `
      linear-gradient(
        to right,
        rgba(255, 244, 224, 0.95) 0%,
        rgba(255, 244, 224, 0.75) 35%,
        rgba(255, 244, 224, 0.35) 60%,
        rgba(255, 244, 224, 0.05) 80%
      ),
      url('/img/banner.jpg')
    `,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        // chiều cao tối thiểu
                        minHeight: 700,
                        paddingTop: "clamp(80px, 12vw, 160px)"
                    }}
                >
                    <div className="container">
                        <div className="row g-5 align-items-center">
                            <div className="col-lg-7 col-md-12">
                                <small
                                    className="d-inline-block fw-bold text-dark text-uppercase bg-light border border-primary rounded-pill px-4 py-1 mb-4 mt-4 animated bounceInDown">
                                    Chào mừng đến với HappyEvent
                                </small>
                                <h1 className="display-1 mb-4 animated bounceInDown">
                                    Đặt <span className="text-primary">Dịch</span>Vụ cho sự kiện mơ ước của bạn
                                </h1>
                                <a href="" className="btn btn-primary border-0 rounded-pill py-3 px-4 px-md-5 me-4 animated bounceInLeft">
                                    Đặt ngay
                                </a>
                                <a href="" className="btn btn-primary border-0 rounded-pill py-3 px-4 px-md-5 animated bounceInLeft">
                                    Tìm hiểu thêm
                                </a>
                            </div>

                            {/* bỏ cột <img> bên phải để nền hiển thị full */}
                        </div>
                    </div>
                </div>
                {/* Hero End */}


                {/* Rooms Start */}
                <RoomList />
                {/* Book Us Start */}

                {/* Fact Start*/}
                <div className="container-fluid faqt py-6">
                    <div className="container">
                        <div className="row g-4 align-items-center">
                            <div className="col-lg-7">
                                <div className="row g-4">
                                    <div className="col-sm-4 wow bounceInUp" data-wow-delay="0.3s">
                                        <div className="faqt-item bg-primary rounded p-4 text-center">
                                            <i className="fas fa-users fa-4x mb-4 text-white" />
                                            <h1 className="display-4 fw-bold" data-toggle="counter-up">
                                                189
                                            </h1>
                                            <p className="text-dark text-uppercase fw-bold mb-0">
                                                Khách Hàng Hài Lòng
                                            </p>
                                        </div>
                                    </div>
                                    <div className="col-sm-4 wow bounceInUp" data-wow-delay="0.5s">
                                        <div className="faqt-item bg-primary rounded p-4 text-center">
                                            <i className="fas fa-users-cog fa-4x mb-4 text-white" />
                                            <h1 className="display-4 fw-bold" data-toggle="counter-up">
                                                56
                                            </h1>
                                            <p className="text-dark text-uppercase fw-bold mb-0">
                                                Đầu Bếp Chuyên Nghiệp
                                            </p>
                                        </div>
                                    </div>
                                    <div className="col-sm-4 wow bounceInUp" data-wow-delay="0.7s">
                                        <div className="faqt-item bg-primary rounded p-4 text-center">
                                            <i className="fas fa-check fa-4x mb-4 text-white" />
                                            <h1 className="display-4 fw-bold" data-toggle="counter-up">
                                                253
                                            </h1>
                                            <p className="text-dark text-uppercase fw-bold mb-0">
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
    )
}

export default Index;