import React, { useEffect, useState } from "react";
import { Container, Spinner, Alert, Button, Card, Row, Col } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { getCategoryMenuById } from "../../../services/categoryMenuAdmin";
import { CheckCircleFill, XCircleFill } from "react-bootstrap-icons";

function DetailCategoryMenu() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCategoryMenuById(id)
      .then(res => {
        setCategory(res.data.data);
      })
      .catch(() => {
        setError("Không tìm thấy danh mục");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
      <Spinner animation="border" role="status" />
    </div>
  );

  if (error) return (
    <Container className="mt-4">
      <Alert variant="danger" className="text-center">{error}</Alert>
      <div className="text-center">
        <Button variant="primary" onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    </Container>
  );

  return (
    <Container className="mt-5" style={{ maxWidth: "600px" }}>
      <Card
        className="shadow-lg rounded-4"
        style={{ transition: "transform 0.3s ease", cursor: "default" }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        <Card.Header className="bg-primary text-white rounded-top-4">
          <h3 className="mb-0 fw-bold">{category.name}</h3>
          {category.description && (
            <small className="text-light fst-italic">{category.description}</small>
          )}
        </Card.Header>
        <Card.Body className="pt-4">
          <Row className="mb-4">
            <Col sm={4} className="text-secondary fw-semibold">ID:</Col>
            <Col sm={8} className="fs-5">{category.id}</Col>
          </Row>

          <Row className="mb-4">
            <Col sm={4} className="text-secondary fw-semibold">Trạng thái:</Col>
            <Col sm={8}>
              {category.status ? (
                <span className="text-success fs-5 d-flex align-items-center gap-2">
                  <CheckCircleFill /> Kích hoạt
                </span>
              ) : (
                <span className="text-muted fs-5 d-flex align-items-center gap-2">
                  <XCircleFill /> Không kích hoạt
                </span>
              )}
            </Col>
          </Row>

          <Row className="mb-4">
            <Col sm={4} className="text-secondary fw-semibold">Ngày tạo:</Col>
            <Col sm={8} className="fs-6">
              {new Date(category.created_at).toLocaleString()}
            </Col>
          </Row>

          <Row>
            <Col sm={4} className="text-secondary fw-semibold">Ngày cập nhật:</Col>
            <Col sm={8} className="fs-6">
              {new Date(category.updated_at).toLocaleString()}
            </Col>
          </Row>
        </Card.Body>
        <Card.Footer className="text-end bg-white border-top-0 pb-4 pt-3">
          <Button variant="primary" size="md" onClick={() => navigate(-1)} style={{ minWidth: "120px" }}>
            Quay lại
          </Button>
        </Card.Footer>
      </Card>
    </Container>
  );
}

export default DetailCategoryMenu;
