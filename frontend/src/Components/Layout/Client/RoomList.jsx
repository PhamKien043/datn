import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function RoomList() {
    const [locationTypes, setLocationTypes] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:8000/api/location-types")
            .then(res => setLocationTypes(res.data))
            .catch(err => console.error("Lỗi tải loại phòng", err));
    }, []);

    return (
        <div className="container-fluid service">
            <div className="container py-4">
                <div className="text-center wow bounceInUp" data-wow-delay="0.1s">
                    <small className="d-inline-block fw-bold text-dark text-uppercase bg-light border border-primary rounded-pill px-4 py-1 mb-3">
                        Loại Phòng Của Chúng Tôi
                    </small>
                    <h1 className="display-5 mb-5">Chúng Tôi Cung Cấp Gì</h1>
                </div>
                <div className="row g-4">
                    {locationTypes.map((type, index) => (
                        <div className="col-lg-4 col-md-6 col-sm-12 wow bounceInUp" key={type.id} data-wow-delay={`${0.1 + index * 0.2}s`}>
                            <div className="bg-light rounded overflow-hidden shadow">
                                <img
                                    src={`http://localhost:8000/storage/rooms/${type.image}`}
                                    alt={type.name}
                                    className="img-fluid w-100"
                                    style={{ height: "250px", objectFit: "cover" }}
                                />
                                <div className="service-content p-4 text-center">
                                    <h4 className="mb-3">{type.name}</h4>
                                    <p className="mb-4">{type.descriptions}</p>
                                    <Link to={`/rooms/${type.id}`} className="btn btn-primary px-4 py-2 rounded-pill">
                                        Xem chi tiết
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                    {locationTypes.length === 0 && (
                        <div className="text-center">Đang tải danh sách phòng...</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RoomList;
