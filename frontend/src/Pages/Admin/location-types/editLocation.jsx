import React, { useState, useEffect } from "react";
import { 
  Container, Card, Form, Button, Spinner, Alert, Row, Col, Image, Badge 
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { getLocationTypeById, updateLocationType } from "../../../services/locationTypes";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./loc.css";

function EditLocation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    descriptions: "",
    is_active: 1,
    image: null,
    image_url: ""
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getLocationTypeById(id);
        setForm({
          name: data.name || "",
          descriptions: data.descriptions || "",
          is_active: data.is_active ?? 1,
          image: null,
          image_url: data.image 
            ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/storage/rooms/${data.image}`
            : null
        });
      } catch (err) {
        setError("Không thể tải dữ liệu loại địa điểm.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const validateForm = () => {
    const errors = {};
    const nameRegex = /^[a-zA-Z0-9\sÀ-ỹ\-]+$/;

    if (!form.name.trim()) errors.name = "Tên không được để trống.";
    else if (!nameRegex.test(form.name.trim())) errors.name = "Tên không được chứa ký tự đặc biệt.";
    if (!form.descriptions.trim()) errors.descriptions = "Mô tả không được để trống.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setFormErrors(prev => ({ ...prev, image: "Chỉ chấp nhận JPG, PNG hoặc WEBP." }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormErrors(prev => ({ ...prev, image: "Dung lượng tối đa 2MB." }));
      return;
    }

    setForm(prev => ({ ...prev, image: file }));
    setPreviewImage(URL.createObjectURL(file));
    setFormErrors(prev => ({ ...prev, image: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("descriptions", form.descriptions.trim());
      formData.append("is_active", form.is_active);
      if (form.image) formData.append("image", form.image);

      await updateLocationType(id, formData);
      toast.success("✅ Cập nhật thành công!");
      setTimeout(() => navigate("/admin/location-types"), 1500);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors?.name) {
        setFormErrors({ name: "Tên loại địa điểm đã tồn tại." });
      } else {
        setError(err.response?.data?.message || "Cập nhật thất bại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <Container className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
      <Spinner animation="border" variant="primary" />
    </Container>
  );

  return (
    <Container className="my-4">
      <ToastContainer position="top-right" autoClose={3000} />

      <Card className="shadow-lg rounded-4 border-0">
        <Card.Header className="bg-gradient text-white py-3 d-flex justify-content-between align-items-center">
          <h3 className="mb-0">✏️ Chỉnh sửa loại địa điểm</h3>
          <Badge bg={form.is_active ? "success" : "secondary"} className="fs-6">
            {form.is_active ? "Hoạt động" : "Không hoạt động"}
          </Badge>
        </Card.Header>

        <Card.Body className="p-4">
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row className="g-4">
              {/* Form thông tin */}
              <Col md={7}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên loại địa điểm <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    isInvalid={!!formErrors.name}
                    placeholder="Nhập tên loại địa điểm..."
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Mô tả <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="descriptions"
                    value={form.descriptions}
                    onChange={handleChange}
                    isInvalid={!!formErrors.descriptions}
                    placeholder="Nhập mô tả loại địa điểm..."
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.descriptions}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    name="is_active"
                    value={form.is_active}
                    onChange={handleChange}
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Không hoạt động</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Form ảnh */}
              <Col md={5}>
                <Form.Group className="mb-3">
                  <Form.Label>Ảnh đại diện</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/jpeg, image/png, image/webp"
                    onChange={handleImageChange}
                    isInvalid={!!formErrors.image}
                  />
                  <Form.Text className="text-muted">Chỉ JPG, PNG, WEBP (≤ 2MB)</Form.Text>
                  <Form.Control.Feedback type="invalid">{formErrors.image}</Form.Control.Feedback>
                </Form.Group>

                <div className="border rounded shadow-sm overflow-hidden mt-2" style={{ height: "250px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  {previewImage || form.image_url ? (
                    <Image
                      src={previewImage || form.image_url}
                      alt="Preview"
                      className="img-fluid"
                      style={{ objectFit: "cover", width: "100%", height: "100%" }}
                      onError={(e) => e.target.src = "/placeholder.jpg"}
                    />
                  ) : (
                    <div className="text-center text-muted">Không có ảnh</div>
                  )}
                </div>
                <div className="text-center mt-1 small text-muted">{form.image ? "Ảnh mới" : "Ảnh hiện tại"}</div>
              </Col>
            </Row>

            {/* Button */}
            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={() => navigate("/admin/location-types")}>🔙 Quay lại</Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? <><Spinner as="span" animation="border" size="sm" className="me-2" />Đang lưu...</> : '💾 Lưu thay đổi'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default EditLocation;
