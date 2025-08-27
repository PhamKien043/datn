import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRoomById } from "../../../services/roomsAdmin";
import {
  Container,
  Image,
  Button,
  Row,
  Col,
  Spinner,
  Alert,
  Card,
  Badge,
} from "react-bootstrap";
import "./detail.css";

function DetailRooms() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRoom();
  }, [id]);

  const loadRoom = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRoomById(id);
      setRoom(data);
    } catch (err) {
      console.error("Lỗi khi tải chi tiết phòng:", err);
      setError("Không thể tải chi tiết phòng này. Vui lòng kiểm tra lại.");
    } finally {
      setLoading(false);
    }
  };

  // Format tiền VND
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);

  // Render badge trạng thái
  const renderStatusBadge = (status) => {
    return status === 1 ? (
      <Badge bg="success">Hoạt động</Badge>
    ) : (
      <Badge bg="warning">Bảo trì</Badge>
    );
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải thông tin phòng...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger" className="text-center">
          {error}
          <Button
            variant="link"
            onClick={() => navigate(-1)}
            className="d-block mx-auto mt-2"
          >
            Quay lại
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!room) {
    return (
      <Container className="my-5">
        <Alert variant="info" className="text-center">
          Không tìm thấy thông tin phòng.
          <Button
            variant="link"
            onClick={() => navigate(-1)}
            className="d-block mx-auto mt-2"
          >
            Quay lại
          </Button>
        </Alert>
      </Container>
    );
  }

  // Xử lý ảnh
  const imageUrl = room.image_url
    ? room.image_url
    : room.image
    ? `http://localhost:8000/storage/rooms/${room.image}`
    : "https://via.placeholder.com/800x600?text=No+Image";

  return (
    <Container className="my-5">
      <Button
        variant="outline-secondary"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <i className="bi bi-arrow-left me-2"></i> Quay lại
      </Button>

      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-lg rounded-4 overflow-hidden p-4">
            <Image
              src={imageUrl}
              alt={room.name}
              fluid
              className="rounded-4 mb-4 object-fit-cover"
              style={{ height: "400px", width: "100%" }}
            />

            <h2 className="fw-bold text-primary">{room.name}</h2>

            <Row className="mt-3">
              <Col md={6} className="mb-3">
                <strong>Giá phòng:</strong>{" "}
                <span className="text-success fw-semibold">
                  {formatCurrency(room.price)}
                </span>
              </Col>
              {/* <Col md={6} className="mb-3">
                <strong>Giá bàn:</strong>{" "}
                <span className="text-danger fw-semibold">
                  {formatCurrency(room.table_money)}
                </span>
              </Col> */}
              <Col md={6} className="mb-3">
                <strong>Sức chứa:</strong> {room.capacity} người
              </Col>
              <Col md={6} className="mb-3">
                <strong>Trạng thái:</strong> {renderStatusBadge(room.status)}
              </Col>
              <Col md={12} className="mb-3">
                <strong>Loại phòng:</strong>{" "}
                {room.location_type?.name || "Chưa xác định"}
              </Col>
            </Row>

            {room.description && (
              <div className="mt-3">
                <h5 className="fw-semibold">Mô tả phòng:</h5>
                <p className="text-muted">{room.description}</p>
              </div>
            )}

            <div className="d-flex justify-content-center mt-4">
              <Button
                variant="primary"
                onClick={() => navigate("/admin/rooms")}
              >
                Quay về danh sách phòng
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default DetailRooms;
