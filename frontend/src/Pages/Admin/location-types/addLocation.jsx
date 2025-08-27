import React, { useState, useEffect } from "react";
import {
  Container,
  Form,
  Button,
  Alert,
  Spinner,
  Row,
  Col,
  Card,
  Image
} from "react-bootstrap";
import { createLocationType } from "../../../services/locationTypes";
import { useNavigate } from "react-router-dom";
import "./loc.css";

function AddLocation() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    descriptions: "",
    image: null,
    is_active: 1
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const validateForm = () => {
    const errors = {};
    const nameRegex = /^[a-zA-Z0-9\sÀ-ỹ\-]+$/u;

    if (!form.name.trim()) errors.name = "Vui lòng nhập tên loại phòng.";
    else if (/^\s/.test(form.name)) errors.name = "Tên không được có khoảng trắng đầu.";
    else if (!nameRegex.test(form.name.trim())) errors.name = "Tên chỉ chứa chữ, số, '-' và khoảng trắng.";
    else if (form.name.trim().length < 3) errors.name = "Tên phải >= 3 ký tự.";
    else if (form.name.trim().length > 100) errors.name = "Tên <= 100 ký tự.";

    if (!form.descriptions.trim()) errors.descriptions = "Vui lòng nhập mô tả.";
    else if (form.descriptions.trim().length < 10) errors.descriptions = "Mô tả >= 10 ký tự.";
    else if (form.descriptions.trim().length > 500) errors.descriptions = "Mô tả <= 500 ký tự.";

    if (!form.image) errors.image = "Vui lòng chọn ảnh.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setFormErrors({ ...formErrors, image: "Chỉ chấp nhận JPG, JPEG, PNG, WEBP." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormErrors({ ...formErrors, image: "Dung lượng tối đa 2MB." });
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    setForm({ ...form, image: file });
    setFormErrors({ ...formErrors, image: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("descriptions", form.descriptions.trim());
      formData.append("is_active", form.is_active);
      formData.append("image", form.image);

      await createLocationType(formData);
      setSubmitSuccess(true);
      setTimeout(() => navigate("/admin/location-types"), 1500);
    } catch (err) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const newFormErrors = {};
        if (errors.name) {
          const msg = errors.name[0].includes("taken")
            ? "Tên loại phòng đã tồn tại."
            : errors.name[0];
          newFormErrors.name = msg;
        }
        if (errors.descriptions) newFormErrors.descriptions = errors.descriptions[0];
        if (errors.image) newFormErrors.image = errors.image[0];
        setFormErrors(newFormErrors);
      } else {
        setError(err.response?.data?.message || "Lỗi thêm loại phòng.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow rounded-4 border-0">
            <Card.Header className="bg-primary text-white text-center py-3 rounded-top-4">
              <h2 className="mb-0 fw-bold">Thêm Loại Phòng</h2>
            </Card.Header>

            <Card.Body className="p-4">
              {submitSuccess && <Alert variant="success" className="text-center">Thêm thành công! Đang chuyển hướng...</Alert>}
              {error && <Alert variant="danger" className="text-center">{error}</Alert>}

              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-3">
                  <Form.Label>Tên loại phòng *</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                    }}
                    isInvalid={!!formErrors.name}
                    placeholder="Nhập tên loại phòng"
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Mô tả *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={form.descriptions}
                    onChange={(e) => {
                      setForm({ ...form, descriptions: e.target.value });
                      if (formErrors.descriptions) setFormErrors({ ...formErrors, descriptions: null });
                    }}
                    isInvalid={!!formErrors.descriptions}
                    placeholder="Nhập mô tả chi tiết"
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.descriptions}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Ảnh *</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/jpeg, image/jpg, image/png, image/webp"
                    onChange={handleImageChange}
                    isInvalid={!!formErrors.image}
                  />
                  {imagePreview && (
                    <div className="mt-3 d-flex justify-content-center">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        rounded
                        thumbnail
                        style={{ maxWidth: "250px", maxHeight: "200px", objectFit: "cover" }}
                      />
                    </div>
                  )}
                  <Form.Control.Feedback type="invalid">{formErrors.image}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    value={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: parseInt(e.target.value) })}
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Không hoạt động</option>
                  </Form.Select>
                </Form.Group>

                <div className="d-flex justify-content-center gap-3">
                  <Button type="submit" variant="primary" disabled={submitting} className="flex-grow-1">
                    {submitting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Đang thêm...
                      </>
                    ) : (
                      "Thêm loại phòng"
                    )}
                  </Button>
                  <Button variant="outline-secondary" onClick={() => navigate("/admin/location-types")} className="flex-grow-1">
                    ⬅️ Quay lại
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AddLocation;
