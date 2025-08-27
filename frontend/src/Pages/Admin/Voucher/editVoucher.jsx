import React, { useState, useEffect } from "react";
import { Container, Form, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { getVoucherById, updateVoucher, checkVoucherName } from "../../../services/voucher";

function EditVoucher() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: "",
        value: "",
        min_order_total: "",
        status: 1,
        is_used: "",
        used_at: "",
        used_by_user_id: ""
    });

    const [originalTitle, setOriginalTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [checkingName, setCheckingName] = useState(false);

    useEffect(() => {
        fetchVoucher();
    }, []);

    const fetchVoucher = async () => {
        try {
            const voucher = await getVoucherById(id);
            if (voucher) {
                setForm({
                    title: voucher.title || "",
                    value: voucher.value ?? "",
                    min_order_total: voucher.min_order_total ?? "",
                    status: voucher.status ? 1 : 0,
                    is_used: voucher.is_used ?? "",
                    used_at: voucher.used_at ? voucher.used_at.split("T")[0] : "",
                    used_by_user_id: voucher.used_by_user_id ?? ""
                });
                setOriginalTitle(voucher.title || "");
            }
        } catch (err) {
            console.error("Lỗi khi tải voucher:", err);
            setError("Không thể tải thông tin voucher.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Chỉ cho phép nhập số và dấu chấm với các trường tiền
        if (name === "value" || name === "min_order_total") {
            const numericValue = value.replace(/[^0-9.]/g, ""); 
            setForm(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }

        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const validateTitle = async () => {
        const title = form.title.trim();
        if (!title) return "Vui lòng nhập tên voucher";
        if (form.title !== title) return "Tên không được có khoảng trắng ở đầu hoặc cuối";
        if (!/^[a-zA-Z0-9À-ỹ\s\-\.,:;'"()!?]+$/.test(title)) return "Tên chứa ký tự không hợp lệ";

        if (title !== originalTitle) {
            setCheckingName(true);
            try {
                const exists = await checkVoucherName(title, id);
                if (exists) return "Tên voucher đã tồn tại";
            } catch (err) {
                console.error("Lỗi kiểm tra trùng tên:", err);
            } finally {
                setCheckingName(false);
            }
        }
        return "";
    };

    const validateForm = async () => {
        let errors = {};
        const titleError = await validateTitle();
        if (titleError) errors.title = titleError;

        if (!form.value || parseFloat(form.value) <= 0) {
            errors.value = "Giá trị phải lớn hơn 0";
        }

        if (form.min_order_total && parseFloat(form.min_order_total) < 0) {
            errors.min_order_total = "Giá trị tối thiểu phải >= 0";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!(await validateForm())) return;

        setSubmitting(true);
        setError(null);

        try {
            await updateVoucher(id, {
                title: form.title,
                value: parseFloat(form.value),
                min_order_total: form.min_order_total !== "" ? parseFloat(form.min_order_total) : null,
                status: Number(form.status),
                is_used: form.is_used !== "" ? Number(form.is_used) : null,
                used_at: form.used_at || null,
                used_by_user_id: form.used_by_user_id !== "" ? Number(form.used_by_user_id) : null
            });
            setSuccess(true);
            setTimeout(() => navigate("/admin/voucher"), 1500);
        } catch (err) {
            console.error("Lỗi khi cập nhật voucher:", err);
            setError(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật voucher");
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (value) => {
        if (!value) return "";
        const number = Number(value);
        if (isNaN(number)) return value;
        return number.toLocaleString("vi-VN");
    };

    if (loading) {
        return (
            <Container className="my-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Đang tải dữ liệu...</p>
            </Container>
        );
    }

    return (
        <Container className="my-5 py-4">
            <h2 className="text-center mb-4 text-primary fw-bold">Chỉnh Sửa Voucher</h2>
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Form onSubmit={handleSubmit} className="p-4 shadow rounded-3 bg-white" noValidate>
                        {success && <Alert variant="success" className="text-center">Cập nhật thành công! Đang chuyển hướng...</Alert>}
                        {error && <Alert variant="danger" className="text-center">{error}</Alert>}

                        <Form.Group className="mb-3">
                            <Form.Label>Tên voucher</Form.Label>
                            <Form.Control
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                isInvalid={!!formErrors.title}
                                placeholder="Nhập tên voucher"
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.title}</Form.Control.Feedback>
                            {checkingName && <small className="text-muted">Đang kiểm tra tên...</small>}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Giá trị</Form.Label>
                            <Form.Control
                                type="text"
                                name="value"
                                value={formatCurrency(form.value)}
                                onChange={handleChange}
                                isInvalid={!!formErrors.value}
                                placeholder="Nhập giá trị"
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.value}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Tổng giá trị đơn hàng tối thiểu</Form.Label>
                            <Form.Control
                                type="text"
                                name="min_order_total"
                                value={formatCurrency(form.min_order_total)}
                                onChange={handleChange}
                                isInvalid={!!formErrors.min_order_total}
                                placeholder="Có thể để trống"
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.min_order_total}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Trạng thái</Form.Label>
                            <Form.Select name="status" value={form.status} onChange={handleChange}>
                                <option value={1}>Hoạt động</option>
                                <option value={0}>Không hoạt động</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Đã sử dụng</Form.Label>
                            <Form.Select name="is_used" value={form.is_used} onChange={handleChange}>
                                <option value="">Chưa xác định</option>
                                <option value={1}>Đã sử dụng</option>
                                <option value={0}>Chưa sử dụng</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Ngày sử dụng</Form.Label>
                            <Form.Control
                                type="date"
                                name="used_at"
                                value={form.used_at}
                                onChange={handleChange}
                                placeholder="Có thể để trống"
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label>ID người dùng đã sử dụng</Form.Label>
                            <Form.Control
                                type="number"
                                name="used_by_user_id"
                                value={form.used_by_user_id}
                                onChange={handleChange}
                                placeholder="Có thể để trống"
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-center gap-3">
                            <Button variant="primary" type="submit" disabled={submitting || checkingName} className="px-4">
                                {submitting ? <Spinner as="span" size="sm" animation="border" className="me-2" /> : null}
                                {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                            <Button variant="outline-secondary" onClick={() => navigate("/admin/voucher")} className="px-4">
                                Quay lại
                            </Button>
                        </div>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

export default EditVoucher;
