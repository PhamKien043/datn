import React, { useEffect, useState } from "react";
import { Form, Button, Alert, Spinner, Container } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { getCategoryMenuById, updateCategoryMenu, checkCategoryMenuName } from "../../../services/categoryMenuAdmin";

function EditCategoryMenu() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [checkingName, setCheckingName] = useState(false);
  const [nameExists, setNameExists] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    getCategoryMenuById(id)
      .then(res => {
        setForm({
          name: res.data.data.name,
          description: res.data.data.description || "",
          status: res.data.data.status === 1 || res.data.data.status === true,
        });
      })
      .catch(() => alert("Không tìm thấy danh mục"))
      .finally(() => setLoadingInit(false));
  }, [id]);

  // Hàm kiểm tra ký tự hợp lệ cho tên: cho phép chữ tiếng Việt có dấu, số, khoảng trắng, '-' và '_'
  const isValidName = (name) => {
    const regex = /^[\p{L}0-9\s\-_]+$/u;
    return regex.test(name);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "name") {
      setNameExists(false);
      setErrors(prev => ({ ...prev, name: null }));
      if (value.trim() !== "") {
        if (!isValidName(value.trim())) {
          setErrors(prev => ({ ...prev, name: "Tên chỉ chứa chữ, số, khoảng trắng, '-' và '_'" }));
          return;
        }
        setCheckingName(true);
        checkCategoryMenuName(value.trim(), id)
          .then(res => {
            setNameExists(res.data.exists);
            if (res.data.exists) {
              setErrors(prev => ({ ...prev, name: "Tên danh mục đã tồn tại" }));
            }
          })
          .catch(() => {
            setNameExists(false);
          })
          .finally(() => setCheckingName(false));
      } else {
        setErrors(prev => ({ ...prev, name: "Tên danh mục không được để trống" }));
      }
    }

    if (name === "description") {
      if (value.trim() === "") {
        setErrors(prev => ({ ...prev, description: "Mô tả không được để trống" }));
      } else {
        setErrors(prev => ({ ...prev, description: null }));
      }
    }
  };

  const validateForm = () => {
    let valid = true;
    let newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Tên danh mục không được để trống";
      valid = false;
    } else if (!isValidName(form.name.trim())) {
      newErrors.name = "Tên chỉ chứa chữ, số, khoảng trắng, '-' và '_'";
      valid = false;
    }

    if (nameExists) {
      newErrors.name = "Tên danh mục đã tồn tại";
      valid = false;
    }

    if (!form.description.trim()) {
      newErrors.description = "Mô tả không được để trống";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      await updateCategoryMenu(id, form);
      alert("Cập nhật danh mục thành công");
      navigate("/admin/category-menus");
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setSubmitError("Lỗi khi cập nhật danh mục. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingInit) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
      <Spinner animation="border" />
    </div>
  );

  return (
    <Container style={{ maxWidth: "600px" }} className="mt-4">
      <h3 className="mb-4">Chỉnh sửa danh mục</h3>
      {submitError && <Alert variant="danger">{submitError}</Alert>}

      <Form noValidate onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="name">
          <Form.Label>Tên danh mục</Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            isInvalid={!!errors.name}
            placeholder="Nhập tên danh mục"
          />
          {checkingName && <Form.Text className="text-info">Đang kiểm tra tên...</Form.Text>}
          <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="description">
          <Form.Label>Mô tả</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="description"
            value={form.description}
            onChange={handleChange}
            isInvalid={!!errors.description}
            placeholder="Nhập mô tả danh mục"
          />
          <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-4" controlId="status">
          <Form.Check
            type="checkbox"
            label="Kích hoạt"
            name="status"
            checked={form.status}
            onChange={handleChange}
          />
        </Form.Group>

        <Button
          variant="primary"
          type="submit"
          disabled={loading || checkingName || nameExists}
          className="w-100"
        >
          {loading ? <Spinner animation="border" size="sm" /> : "Cập nhật"}
        </Button>
      </Form>
    </Container>
  );
}

export default EditCategoryMenu;
