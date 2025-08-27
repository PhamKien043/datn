import React, { useState, useEffect } from "react";
import { Container, Form, Button, Row, Col, Spinner, Alert } from "react-bootstrap";
import { createRoom, getAllRooms } from "../../../services/roomsAdmin";
import { getAllLocationTypes } from "../../../services/locationTypes";
import { useNavigate } from "react-router-dom";
import "./add.css";

function AddRooms() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        description: "",
        capacity: "",
        price: "",
        // table_money: "null",   // 👈 thêm vào
        status: "1", 
        image: null,
        location_type_id: "",
    });

    const [locationTypes, setLocationTypes] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loadingLocationTypes, setLoadingLocationTypes] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        loadLocationTypes();
        loadRooms();
    }, []);

    const loadLocationTypes = async () => {
        try {
            const data = await getAllLocationTypes();
            setLocationTypes(data);
        } catch {
            setError("Không thể tải danh sách loại địa điểm.");
        } finally {
            setLoadingLocationTypes(false);
        }
    };

    const loadRooms = async () => {
        try {
            const data = await getAllRooms();
            setRooms(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "image" && files && files[0]) {
            setForm({ ...form, image: files[0] });
            setImagePreview(URL.createObjectURL(files[0]));
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const validateForm = () => {
        let errors = {};
        const namePattern = /^[a-zA-Z0-9À-ỹ\s]+$/u;
        const imagePattern = /\.(jpg|jpeg|png|gif)$/i;

        if (!form.name.trim()) errors.name = "Vui lòng nhập tên phòng.";
        else if (/^\s/.test(form.name)) errors.name = "Tên phòng không được có khoảng trắng ở đầu.";
        else if (!namePattern.test(form.name)) errors.name = "Tên phòng không được chứa ký tự đặc biệt.";
        else if (rooms.some(r => r.name.toLowerCase() === form.name.trim().toLowerCase())) errors.name = "Tên phòng đã tồn tại.";

        if (!form.description.trim()) errors.description = "Vui lòng nhập mô tả.";
        if (!form.capacity || form.capacity <= 0) errors.capacity = "Sức chứa phải lớn hơn 0.";
        if (!form.price || form.price < 0) errors.price = "Giá phải lớn hơn hoặc bằng 0.";

        // 👇 validate table_money
        // if (!form.table_money || form.table_money < 0) errors.table_money = "Tiền bàn phải lớn hơn hoặc bằng 0.";

        if (!form.location_type_id) errors.location_type_id = "Vui lòng chọn loại phòng.";

        if (!form.image) errors.image = "Vui lòng chọn ảnh.";
        else if (!imagePattern.test(form.image.name)) errors.image = "Chỉ chấp nhận file ảnh JPG, JPEG, PNG, GIF.";
        else if (form.image.size > 2 * 1024 * 1024) errors.image = "Dung lượng ảnh không vượt quá 2MB.";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSubmitSuccess(false);

        if (!validateForm()) {
            setSubmitting(false);
            return;
        }

        try {
            const formData = new FormData();
            Object.entries(form).forEach(([key, value]) => {
                if (value !== null) formData.append(key, value);
            });

            await createRoom(formData);
            setSubmitSuccess(true);
            setTimeout(() => navigate("/admin/rooms"), 1500);
        } catch {
            setError("Có lỗi xảy ra khi thêm phòng.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container className="my-5 py-4">
            <h2 className="text-center mb-4 text-primary fw-bold">Thêm Phòng Mới</h2>
            <Row className="justify-content-center">
                <Col md={6}>
                    <Form onSubmit={handleSubmit} className="p-4 shadow rounded bg-white">
                        {submitSuccess && <Alert variant="success">Thêm phòng thành công! Đang chuyển hướng...</Alert>}
                        {error && <Alert variant="danger">{error}</Alert>}

                        {/* Tên phòng */}
                        <Form.Group className="mb-3">
                            <Form.Label>Tên phòng</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                isInvalid={!!formErrors.name}
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Mô tả */}
                        <Form.Group className="mb-3">
                            <Form.Label>Mô tả</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                isInvalid={!!formErrors.description}
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.description}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Sức chứa */}
                        <Form.Group className="mb-3">
                            <Form.Label>Sức chứa</Form.Label>
                            <Form.Control
                                type="number"
                                name="capacity"
                                value={form.capacity}
                                onChange={handleChange}
                                isInvalid={!!formErrors.capacity}
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.capacity}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Giá phòng */}
                        <Form.Group className="mb-3">
                            <Form.Label>Giá phòng</Form.Label>
                            <Form.Control
                                type="number"
                                name="price"
                                value={form.price}
                                onChange={handleChange}
                                isInvalid={!!formErrors.price}
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.price}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Tiền bàn 👈 thêm vào */}
                        {/* <Form.Group className="mb-3">
                            <Form.Label>Tiền bàn</Form.Label>
                            <Form.Control
                                type="number"
                                name="table_money"
                                value={form.table_money}
                                onChange={handleChange}
                                isInvalid={!!formErrors.table_money}
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.table_money}</Form.Control.Feedback>
                        </Form.Group> */}

                        {/* Loại phòng */}
                        <Form.Group className="mb-3">
                            <Form.Label>Loại phòng</Form.Label>
                            {loadingLocationTypes ? (
                                <Spinner animation="border" size="sm" />
                            ) : (
                                <Form.Select
                                    name="location_type_id"
                                    value={form.location_type_id}
                                    onChange={handleChange}
                                    isInvalid={!!formErrors.location_type_id}
                                >
                                    <option value="">-- Chọn loại phòng --</option>
                                    {locationTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            )}
                            <Form.Control.Feedback type="invalid">{formErrors.location_type_id}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Trạng thái */}
                        <Form.Group className="mb-3">
                            <Form.Label>Trạng thái</Form.Label>
                            <Form.Select name="status" value={form.status} onChange={handleChange}>
                                <option value="1">Hoạt động</option>
                                <option value="0">Bảo trì</option>
                            </Form.Select>
                        </Form.Group>

                        {/* Ảnh */}
                        <Form.Group className="mb-3">
                            <Form.Label>Ảnh phòng</Form.Label>
                            <Form.Control
                                type="file"
                                name="image"
                                onChange={handleChange}
                                accept="image/*"
                                isInvalid={!!formErrors.image}
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.image}</Form.Control.Feedback>
                            {imagePreview && (
                                <div className="mt-3 text-center">
                                    <img src={imagePreview} alt="Preview" className="img-thumbnail" style={{ maxHeight: "200px" }} />
                                </div>
                            )}
                        </Form.Group>

                        <div className="d-flex justify-content-center gap-3">
                            <Button type="submit" variant="primary" disabled={submitting}>
                                {submitting ? "Đang thêm..." : "Thêm phòng"}
                            </Button>
                            <Button variant="secondary" onClick={() => navigate("/admin/rooms")} disabled={submitting}>
                                Quay lại
                            </Button>
                        </div>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

export default AddRooms;
