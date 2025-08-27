import React, { useState, useEffect } from "react";
import { Container, Form, Button, Alert, Spinner, Row, Col } from "react-bootstrap";
import { createVoucher, checkVoucherName } from "../../../services/voucher";
import { useNavigate } from "react-router-dom";

function AddVoucher() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: "",
        value: "",
        min_order_total: 0,
        status: "1",
        is_used: "0",
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [checkingName, setCheckingName] = useState(false);
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [lastCheckedTitle, setLastCheckedTitle] = useState("");

    useEffect(() => {
        if (form.title.trim() && form.title !== lastCheckedTitle) {
            setIsDuplicate(false);
        }
    }, [form.title, lastCheckedTitle]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckTitle = async () => {
        const title = form.title.trim();
        if (!title || title === lastCheckedTitle) return;

        if (form.title !== form.title.trimStart()) {
            setFormErrors(prev => ({ ...prev, title: "Tiêu đề không được có khoảng trắng ở đầu" }));
            setIsDuplicate(false);
            return;
        }

        if (!/^[a-zA-Z0-9À-ỹ\s\-\.,:;'"()!?]+$/.test(title)) {
            setFormErrors(prev => ({ ...prev, title: "Tiêu đề chứa ký tự không hợp lệ" }));
            setIsDuplicate(false);
            return;
        }

        setCheckingName(true);
        setLastCheckedTitle(title);
        
        try {
            const exists = await checkVoucherName(title);
            setIsDuplicate(exists);
            setFormErrors(prev => exists 
                ? { ...prev, title: "Tiêu đề đã tồn tại, vui lòng chọn tên khác." } 
                : (({ title, ...rest }) => rest)(prev)
            );
        } catch (err) {
            console.error("Lỗi kiểm tra tiêu đề:", err);
            setIsDuplicate(false);
        } finally {
            setCheckingName(false);
        }
    };

    const validateForm = () => {
        const errors = {};
        const title = form.title.trim();
        
        if (!title) errors.title = "Vui lòng nhập tiêu đề.";
        else if (form.title !== form.title.trimStart()) errors.title = "Tiêu đề không được có khoảng trắng ở đầu";
        else if (!/^[a-zA-Z0-9À-ỹ\s\-\.,:;'"()!?]+$/.test(title)) errors.title = "Tiêu đề chứa ký tự không hợp lệ";
        else if (isDuplicate) errors.title = "Tiêu đề đã tồn tại, vui lòng chọn tên khác.";

        if (!form.value || parseFloat(form.value) <= 0) errors.value = "Giá trị phải lớn hơn 0.";
        if (form.min_order_total === "" || parseFloat(form.min_order_total) < 0) {
            errors.min_order_total = "Giá trị đơn tối thiểu phải ≥ 0.";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) return;

        setSubmitting(true);
        try {
            await createVoucher({
                title: form.title,
                value: parseFloat(form.value),
                min_order_total: parseFloat(form.min_order_total) || 0,
                status: Number(form.status) === 1,
                is_used: Number(form.is_used) === 1,
            });
            setSubmitSuccess(true);
            setTimeout(() => navigate("/admin/voucher"), 1500);
        } catch (err) {
            setError(err.response?.data?.message || "Có lỗi xảy ra khi thêm voucher.");
            console.error("Lỗi khi thêm voucher:", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container className="my-5 py-4">
            <h2 className="text-center mb-5 text-primary fw-bold display-4">Thêm Voucher</h2>
            
            <Row className="justify-content-center">
                <Col md={8} lg={7}>
                    <Form onSubmit={handleSubmit} className="p-4 shadow rounded-4 bg-white">
                        {submitSuccess && (
                            <Alert variant="success" className="text-center">
                                Thêm voucher thành công! Đang chuyển hướng...
                            </Alert>
                        )}
                        
                        {error && (
                            <Alert variant="danger" className="text-center">
                                {error}
                            </Alert>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Tiêu đề</Form.Label>
                            <Form.Control
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                onBlur={handleCheckTitle}
                                isInvalid={!!formErrors.title}
                                placeholder="Nhập tiêu đề"
                                disabled={submitting}
                            />
                            {checkingName && <small className="text-primary">Đang kiểm tra tiêu đề...</small>}
                            <Form.Control.Feedback type="invalid">{formErrors.title}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Giá trị</Form.Label>
                            <Form.Control
                                type="number"
                                name="value"
                                value={form.value}
                                onChange={handleChange}
                                isInvalid={!!formErrors.value}
                                placeholder="Nhập giá trị"
                                min={1}
                                disabled={submitting}
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.value}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Đơn tối thiểu</Form.Label>
                            <Form.Control
                                type="number"
                                name="min_order_total"
                                value={form.min_order_total}
                                onChange={handleChange}
                                isInvalid={!!formErrors.min_order_total}
                                min={0}
                                disabled={submitting}
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.min_order_total}</Form.Control.Feedback>
                        </Form.Group>

                        <Row className="mb-3">
                        
                                <Form.Group>
                                    <Form.Label className="fw-bold">Trạng thái</Form.Label>
                                    <Form.Select name="status" value={form.status} onChange={handleChange} disabled={submitting}>
                                        <option value="1">Hoạt động</option>
                                        <option value="0">Không hoạt động</option>
                                    </Form.Select>
                                </Form.Group>
                         
                       
                        </Row>

                        <div className="d-flex justify-content-center gap-3">
                            <Button type="submit" variant="primary" disabled={submitting || checkingName}>
                                {submitting ? (
                                    <>
                                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                                        Đang thêm...
                                    </>
                                ) : "Thêm Voucher"}
                            </Button>
                            <Button variant="secondary" onClick={() => navigate("/admin/voucher")} disabled={submitting}>
                                Quay lại
                            </Button>
                        </div>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

export default AddVoucher;
