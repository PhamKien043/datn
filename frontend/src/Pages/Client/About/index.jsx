import React from "react";
import "./about.scss"; // dùng 1 file SCSS là đủ

export default function About() {
    return (
        <>
            {/* HERO */}
            <section
                className="about-hero d-flex align-items-center"
                style={{ backgroundImage: "url('/asset/img/about-22.jpg')" }}
            >
                <div className="container">
                    <div className="row align-items-center gy-4">
                        <div className="col-lg-7">
                            <span className="badge rounded-pill px-3 py-2 about-badge">
                                Giới thiệu về chúng tôi
                            </span>
                            <h1 className="display-4 fw-bold mt-3 mb-3 text-dark">
                                Tổ chức sự kiện <span className="text-gradient">đẳng cấp</span>,{" "}
                                trải nghiệm <span className="text-gradient">đáng nhớ</span>
                            </h1>
                            <p className="lead text-muted mb-4">
                                20+ năm kiến tạo những buổi tiệc hoàn hảo – cưới hỏi, hội nghị, sự
                                kiện doanh nghiệp. Đội ngũ tận tâm, không gian sang trọng, thực đơn
                                tinh tế.
                            </p>
                            <div className="d-flex gap-2 flex-wrap">
                                <a href="/Service" className="btn btn-primary rounded-pill px-4 py-2">
                                    <i className="fas fa-calendar-check me-2" />
                                    Đặt dịch vụ ngay
                                </a>
                                <a href="/Contact" className="btn btn-outline-dark rounded-pill px-4 py-2">
                                    <i className="fas fa-phone-alt me-2" />
                                    Liên hệ nhanh
                                </a>
                            </div>
                        </div>

                        <div className="col-lg-5">
                            <div className="hero-card glass rounded-4 p-3 p-md-4 shadow-lg">
                                <div className="d-flex align-items-center mb-3">
                                    <div className="icon-blob me-3">
                                        <i className="fas fa-award" />
                                    </div>
                                    <h5 className="mb-0 fw-semibold">Vì sao chọn HappyEvent?</h5>
                                </div>
                                <ul className="feature-list">
                                    <li>
                                        <i className="fas fa-check-circle me-2 text-primary" />
                                        Vị trí thuận tiện, không gian sang trọng
                                    </li>
                                    <li>
                                        <i className="fas fa-check-circle me-2 text-primary" />
                                        Quy trình rõ ràng, đội ngũ tận tâm
                                    </li>
                                    <li>
                                        <i className="fas fa-check-circle me-2 text-primary" />
                                        Thực đơn đa dạng, lựa chọn theo sở thích
                                    </li>
                                    <li>
                                        <i className="fas fa-check-circle me-2 text-primary" />
                                        Âm thanh – ánh sáng hiện đại
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION: GIỚI THIỆU */}
            <section className="py-6">
                <div className="container">
                    <div className="row align-items-center g-4">
                        <div className="col-lg-6">
                            <div className="ratio ratio-16x9 rounded-4 overflow-hidden shadow-sm">
                                <img
                                    src="/asset/img/about-31.jpg"
                                    alt="Không gian sảnh tiệc"
                                    className="w-100 h-100 object-cover"
                                />
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <small className="d-inline-block fw-bold text-dark text-uppercase bg-light border border-primary rounded-pill px-3 py-1 mb-3">
                                Về chúng tôi
                            </small>
                            <h2 className="fw-bold mb-3">Không gian tân cổ điển Châu Âu</h2>
                            <p className="text-muted">
                                Kiến trúc tối giản để tôn lên vẻ sang trọng. Mỗi sảnh tiệc có chủ đề
                                riêng, phù hợp xu hướng hiện đại và được trang bị hệ thống âm thanh –
                                ánh sáng tối tân, màn hình LED sắc nét.
                            </p>

                            <div className="row g-3 mt-3">
                                {[
                                    { ic: "fa-map-marker-alt", text: "Vị trí dễ tìm" },
                                    { ic: "fa-user-friends", text: "Nhân viên chu đáo" },
                                    { ic: "fa-utensils", text: "Thực đơn tinh tế" },
                                    { ic: "fa-gem", text: "Trang trí sang trọng" },
                                ].map((item, i) => (
                                    <div className="col-sm-6" key={i}>
                                        <div className="mini-card rounded-4 p-3">
                                            <i className={`fas ${item.ic} text-primary me-2`} />
                                            {item.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* GIÁ TRỊ CỐT LÕI */}
            <section className="py-6 bg-light">
                <div className="container">
                    <div className="text-center mb-5">
                        <span className="badge rounded-pill px-3 py-2 about-badge">Giá trị cốt lõi</span>
                        <h2 className="fw-bold mt-3">Chúng tôi theo đuổi sự hoàn hảo</h2>
                        <p className="text-muted">Từng chi tiết, từng phút giây – để ngày trọng đại trọn vẹn.</p>
                    </div>

                    <div className="row g-4">
                        {[
                            { icon: "fa-heart", title: "Tận tâm", desc: "Đồng hành từ ý tưởng đến bế mạc sự kiện." },
                            { icon: "fa-lightbulb", title: "Sáng tạo", desc: "Concept độc đáo, trải nghiệm khác biệt." },
                            { icon: "fa-shield-alt", title: "Chất lượng", desc: "Quy trình chuẩn, thiết bị hiện đại." },
                            { icon: "fa-handshake", title: "Uy tín", desc: "Rõ chi phí, đúng cam kết, đúng thời gian." },
                        ].map((v, i) => (
                            <div className="col-md-6 col-lg-3" key={i}>
                                <div className="value-card rounded-4 p-4 h-100">
                                    <div className="icon-blob mb-3"><i className={`fas ${v.icon}`} /></div>
                                    <h5 className="fw-semibold mb-2">{v.title}</h5>
                                    <p className="text-muted mb-0">{v.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TEAM */}
            <section className="py-4">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="fw-bold mt-3">Những người đứng sau thành công</h2>
                    </div>

                    <div className="row g-4">
                        {[
                            { name: "Henry", role: "Đầu bếp trang trí", img: "/asset/img/team-1.jpg" },
                            { name: "James Born", role: "Bếp chính", img: "/asset/img/team-2.jpg" },
                            { name: "Martin Hill", role: "Nhân viên bếp", img: "/asset/img/team-3.jpg" },
                            { name: "Adam Smith", role: "Bếp trưởng", img: "/asset/img/team-4.jpg" },
                        ].map((m, idx) => (
                            <div className="col-6 col-lg-3" key={idx}>
                                <div className="team-card rounded-4 overflow-hidden h-100">
                                    <div className="team-photo">
                                        <img src={m.img} alt={m.name} />
                                        <div className="team-overlay">
                                            <div className="d-flex gap-2">
                                                <a href="#" className="btn btn-light btn-sm rounded-circle"><i className="fab fa-facebook-f" /></a>
                                                <a href="#" className="btn btn-light btn-sm rounded-circle"><i className="fab fa-instagram" /></a>
                                                <a href="#" className="btn btn-light btn-sm rounded-circle"><i className="fab fa-twitter" /></a>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 text-center bg-white">
                                        <h6 className="fw-bold mb-1">{m.name}</h6>
                                        <small className="text-muted">{m.role}</small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-6 cta-gradient">
                <div className="container">
                    <div className="row align-items-center gy-3">
                        <div className="col-lg-8">
                            <h3 className="fw-bold mb-2 text-white">Sẵn sàng cho sự kiện tiếp theo?</h3>
                            <p className="mb-0 text-white-50">
                                Hãy để HappyEvent đồng hành, biến ý tưởng của bạn thành hiện thực.
                            </p>
                        </div>
                        <div className="col-lg-4 text-lg-end">
                            <a href="/Service" className="btn btn-light rounded-pill px-4 py-2">
                                Bắt đầu ngay
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
