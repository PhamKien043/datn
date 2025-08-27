import React, { useEffect, useState } from "react";
import axios from "axios";
import "./service.css";
import "./service.scss";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API = "http://localhost:8000";

function Service() {
    const [services, setServices] = useState([]);

    // SVG fallback khi ảnh lỗi
    const FALLBACK_IMG =
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'>
        <defs>
          <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
            <stop stop-color='#f1f5f9' offset='0'/>
            <stop stop-color='#e2e8f0' offset='1'/>
          </linearGradient>
        </defs>
        <rect width='100%' height='100%' fill='url(#g)'/>
        <text x='50%' y='50%' font-family='sans-serif' font-size='28' fill='#94a3b8'
           text-anchor='middle' dominant-baseline='middle'>Không có ảnh</text>
      </svg>`
        );

    useEffect(() => {
        axios
            .get(`${API}/api/services`)
            .then((res) => setServices(res.data))
            .catch((err) => {
                console.error("Lỗi khi tải dịch vụ:", err);
                toast.error("Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.");
            });
    }, []);

    return (
        <>
            {/* Service Start */}
            <div className="container-fluid service py-5">
                <div className="container">
                    <div className="text-center" data-wow-delay="0.1s">
                        <small className="d-inline-block fw-bold text-dark text-uppercase bg-light border border-primary rounded-pill px-4 py-1 mb-3">
                            Dịch Vụ Của Chúng Tôi
                        </small>
                        <h1 className="display-5 mb-5">Chúng Tôi Cung Cấp Những Gì</h1>
                    </div>

                    <div className="row g-4">
                        {services.map((service, index) => (
                            <div
                                className="col-lg-3 col-md-6 col-sm-12"
                                data-wow-delay={`${0.1 + index * 0.2}s`}
                                key={service.id}
                            >
                                <div className="service-card bg-white rounded-4">
                                    {/* Ảnh lớn, rõ nét với tỉ lệ 4:3 */}
                                    <figure className="service-thumb">
                                        {service.image ? (
                                            <img
                                                loading="lazy"
                                                src={`${API}/storage/services/${service.image}`}
                                                alt={service.name}
                                                onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                                            />
                                        ) : (
                                            <img loading="lazy" src={FALLBACK_IMG} alt="Không có ảnh" />
                                        )}

                                        {service?.category?.name && (
                                            <span className="service-badge">{service.category.name}</span>
                                        )}
                                    </figure>

                                    <div className="service-body">
                                        <h4 className="service-title mb-2">{service.name}</h4>
                                        {service.description && (
                                            <p className="service-desc mb-3">{service.description}</p>
                                        )}
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="text-muted small">
                                                <i className="far fa-folder-open me-1" />
                                                <span>{service.category?.name || "Chưa phân loại"}</span>
                                            </div>
                                            <Link
                                                to={`/services/${service.id}`}
                                                className="btn btn-primary btn-sm px-3 rounded-pill"
                                            >
                                                Xem Thêm
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Nếu không có dữ liệu */}
                        {services.length === 0 && (
                            <div className="text-center">
                                <p>Không có dịch vụ nào được hiển thị.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Service End */}

            <ToastContainer position="bottom-right" />
        </>
    );
}

export default Service;
