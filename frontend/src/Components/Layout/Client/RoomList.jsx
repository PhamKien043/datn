import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import WOW from "wowjs";               // ✅ import WOW
import "animate.css";                  // ✅ import animate.css
import "./RoomList.css";               // style riêng

function RoomList() {
    const [locationTypes, setLocationTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get("http://localhost:8000/api/location-types")
            .then(res => {
                setLocationTypes(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Lỗi tải loại phòng", err);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        // ✅ Khởi tạo wow sau khi render
        new WOW.WOW({ live: false }).init();
    }, [locationTypes]);

    return (
        <div className="container-fluid service">
            <div className="container py-4">
                <div class="text-center mb-5">
                    <span class="section-subtitle">LOẠI PHÒNG CỦA CHÚNG TÔI</span>
                    <h2 class="section-title">Chúng Tôi Cung Cấp Gì</h2>
                </div>


                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3">Đang tải danh sách phòng...</p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {locationTypes.map((type, index) => (
                            <div
                                className="col-lg-4 col-md-6 col-sm-12 wow bounceInUp"
                                key={type.id}
                                data-wow-delay={`${0.1 + index * 0.2}s`}
                            >
                                <div className="room-card bg-light rounded overflow-hidden shadow">
                                    <div className="room-card-image">
                                        <img
                                            src={`http://localhost:8000/storage/rooms/${type.image}`}
                                            alt={type.name}
                                            className="img-fluid w-100"
                                            onError={(e) => {
                                                e.target.src = "https://via.placeholder.com/400x300?text=Ảnh+Không+Tồn+Tại";
                                            }}
                                        />
                                        <div className="room-card-overlay"></div>
                                    </div>
                                    <div className="service-content p-4 text-center room-card-content">
                                        <h4 className="mb-3 room-card-title">{type.name}</h4>
                                        <p className="mb-4 room-card-description">{type.descriptions}</p>
                                        <Link to={`/rooms/${type.id}`} className="btn btn-primary px-4 py-2 rounded-pill room-card-button">
                                            Xem chi tiết
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ms-2">
                                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && locationTypes.length === 0 && (
                    <div className="text-center py-5">
                        <div className="empty-icon display-1">🏢</div>
                        <h3 className="mt-3">Chưa có loại phòng nào</h3>
                        <p className="text-muted">Hiện tại không có loại phòng nào để hiển thị</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RoomList;
