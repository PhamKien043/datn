import React, { useState, useEffect } from "react";
import { Container, Form, Button, Row, Col, Spinner, Alert } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { getRoomById, updateRoom, getAllRooms } from "../../../services/roomsAdmin";
import { getAllLocationTypes } from "../../../services/locationTypes";
import "./edit.css";

function EditRooms() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    name: "",
    description: "",
    capacity: "",
    price: "",
    // table_money: "",
    status: "1", // 1 = Hoạt động
    image: null,
    location_type_id: "",
  });

  const [locationTypes, setLocationTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocationTypes, setLoadingLocationTypes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const API_URL = "http://localhost:8000";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomData, types, allRooms] = await Promise.all([
        getRoomById(id),
        getAllLocationTypes(),
        getAllRooms(),
      ]);

      setForm({
        name: roomData.name || "",
        description: roomData.description || "",
        capacity: roomData.capacity || "",
        price: roomData.price || "",
        // table_money: roomData.table_money || "",
        status: String(roomData.status ?? "1"),
        image: null,
        location_type_id: roomData.location_type_id || "",
      });

      setImagePreview(
        roomData.image
          ? `${API_URL}/storage/rooms/${roomData.image}`
          : "https://via.placeholder.com/150x100?text=Không+có+ảnh"
      );

      setLocationTypes(types);
      setRooms(allRooms);
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu:", err);
      setError("Không thể tải dữ liệu phòng.");
    } finally {
      setLoading(false);
      setLoadingLocationTypes(false);
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
    else if (rooms.some(r => r.id !== Number(id) && r.name.toLowerCase() === form.name.trim().toLowerCase()))
      errors.name = "Tên phòng đã tồn tại.";

    if (!form.description.trim()) errors.description = "Vui lòng nhập mô tả.";
    if (!form.capacity || form.capacity <= 0) errors.capacity = "Sức chứa phải lớn hơn 0.";
    if (!form.price || form.price < 0) errors.price = "Giá phải lớn hơn hoặc bằng 0.";

    // if (!form.table_money || form.table_money < 0) {
    //   errors.table_money = "Tiền bàn phải lớn hơn hoặc bằng 0.";
    // }

    if (!form.location_type_id) errors.location_type_id = "Vui lòng chọn loại phòng.";

    if (form.image) {
      if (!(form.image instanceof File)) errors.image = "File ảnh không hợp lệ.";
      else if (!imagePattern.test(form.image.name)) errors.image = "Chỉ chấp nhận file JPG, JPEG, PNG, GIF.";
      else if (form.image.size > 2 * 1024 * 1024) errors.image = "Dung lượng ảnh không vượt quá 2MB.";
    }

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
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("capacity", form.capacity);
      formData.append("price", form.price);
      // formData.append("table_money", form.table_money);
      formData.append("status", form.status === "1" ? 1 : 0);
      formData.append("location_type_id", form.location_type_id);

      if (form.image instanceof File) {
        formData.append("image", form.image);
      }

      const response = await updateRoom(id, formData);

      if (response?.success || response?.message === "Room updated successfully") {
        setSubmitSuccess(true);
        setTimeout(() => navigate("/admin/rooms"), 1500);
      } else {
        setError(response?.message || "Cập nhật không thành công");
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật:", err);
      setError(err.response?.data?.message || err.message || "Có lỗi xảy ra khi cập nhật phòng");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <Container className="text-center my-5">
      <Spinner animation="border" />
    </Container>
  );

  return (
    <Container className="my-5 py-4">
      <h2 className="text-center mb-4 text-primary fw-bold">Chỉnh Sửa Phòng</h2>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Form onSubmit={handleSubmit} className="p-4 shadow rounded bg-white">
            {submitSuccess && <Alert variant="success" className="text-center">
              Cập nhật phòng thành công! Đang chuyển hướng...
            </Alert>}
            {error && <Alert variant="danger" className="text-center">{error}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Tên phòng <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                isInvalid={!!formErrors.name}
                placeholder="Nhập tên phòng"
              />
              <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mô tả <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={form.description}
                onChange={handleChange}
                isInvalid={!!formErrors.description}
                placeholder="Nhập mô tả phòng"
              />
              <Form.Control.Feedback type="invalid">{formErrors.description}</Form.Control.Feedback>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sức chứa <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    name="capacity"
                    value={form.capacity}
                    onChange={handleChange}
                    isInvalid={!!formErrors.capacity}
                    placeholder="Nhập sức chứa"
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.capacity}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giá phòng <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="1000"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    isInvalid={!!formErrors.price}
                    placeholder="Nhập giá phòng"
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.price}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            {/* Thêm ô nhập tiền bàn
            <Form.Group className="mb-3">
              <Form.Label>Tiền bàn <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="1000"
                name="table_money"
                value={form.table_money}
                onChange={handleChange}
                isInvalid={!!formErrors.table_money}
                placeholder="Nhập tiền bàn"
              />
              <Form.Control.Feedback type="invalid">{formErrors.table_money}</Form.Control.Feedback>
            </Form.Group> */}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Loại phòng <span className="text-danger">*</span></Form.Label>
                  {loadingLocationTypes ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <Form.Select
                        name="location_type_id"
                        value={form.location_type_id}
                        onChange={handleChange}
                        isInvalid={!!formErrors.location_type_id}
                      >
                        <option value="">-- Chọn loại phòng --</option>
                        {locationTypes.map((type) => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{formErrors.location_type_id}</Form.Control.Feedback>
                    </>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select name="status" value={form.status} onChange={handleChange}>
                    <option value="1">Hoạt động</option>
                    <option value="0">Bảo trì</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
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
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="img-thumbnail"
                    style={{ maxHeight: "200px", maxWidth: "100%", objectFit: "cover" }}
                  />
                </div>
              )}
            </Form.Group>

            <div className="d-flex justify-content-center gap-3">
              <Button type="submit" variant="primary" disabled={submitting} className="px-4">
                {submitting ? <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang cập nhật...
                </> : "Cập nhật phòng"}
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate("/admin/rooms")} disabled={submitting} className="px-4">
                Quay lại
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default EditRooms;
