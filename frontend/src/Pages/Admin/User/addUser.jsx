import React, { useState } from "react";
import { Form, Button, Spinner, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createUser, checkUnique } from "../../../services/userService";

const AddUser = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: 1, // default User
    status: true,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = async () => {
    let newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Tên không được để trống";
    if (!formData.username.trim()) newErrors.username = "Username không được để trống";
    else if (/\s/.test(formData.username)) newErrors.username = "Username không được chứa khoảng trắng";
    if (!formData.email.trim()) newErrors.email = "Email không được để trống";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email không hợp lệ";
    if (!formData.password) newErrors.password = "Mật khẩu không được để trống";
    else if (formData.password.length < 6) newErrors.password = "Mật khẩu phải ít nhất 6 ký tự";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    try {
      if (await checkUnique("name", formData.name.trim())) newErrors.name = "Tên đã tồn tại";
      if (await checkUnique("username", formData.username.trim())) newErrors.username = "Username đã tồn tại";
      if (await checkUnique("email", formData.email.trim())) newErrors.email = "Email đã tồn tại";
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi kiểm tra dữ liệu trùng");
      return false;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return toast.error("Vui lòng kiểm tra lại các trường");

    setLoading(true);
    // Convert role string -> number trước khi gửi
    const payload = { ...formData, role: Number(formData.role) };
    const result = await createUser(payload);
    setLoading(false);

    if (result.success) {
      toast.success(result.data.message);
      navigate("/admin/users");
    } else {
      if (result.error?.errors) {
        const backendErrors = Object.fromEntries(
          Object.entries(result.error.errors).map(([k, v]) => [k, v[0]])
        );
        setErrors(backendErrors);
        toast.error("Vui lòng kiểm tra lại các trường");
      } else {
        toast.error(result.error?.message || "Không thể thêm User");
      }
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}
    >
      <Card style={{ width: "100%", maxWidth: "500px", borderRadius: "12px" }}>
        <Card.Body>
          <h3 className="text-center mb-4">Thêm User/Admin</h3>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Tên</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!errors.name}
              />
              <Form.Text className="text-danger">{errors.name}</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                isInvalid={!!errors.username}
              />
              <Form.Text className="text-danger">{errors.username}</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
              />
              <Form.Text className="text-danger">{errors.email}</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                isInvalid={!!errors.password}
              />
              <Form.Text className="text-danger">{errors.password}</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Vai trò</Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value={0}>Admin</option>
                <option value={1}>User</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value === "true" })
                }
              >
                <option value={true}>Kích hoạt</option>
                <option value={false}>Khóa</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-between">
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate("/admin/users")}
              >
                Quay lại
              </Button>
              <Button variant="warning" type="submit" disabled={loading}>
                {loading ? <Spinner size="sm" /> : "Thêm User/Admin"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AddUser;
