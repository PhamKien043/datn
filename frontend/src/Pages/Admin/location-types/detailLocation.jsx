import React, { useEffect, useState } from "react";
import { 
  Container, 
  Row, 
  Col, 
  Spinner, 
  Alert, 
  Image, 
  Card,
  Badge,
  Button
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { getLocationTypeById } from "../../../services/locationTypes";
import "./loc.css";

function DetailLocation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLoading(true);
        const data = await getLocationTypeById(id);
        if (data.image) {
          data.image_url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/storage/rooms/${data.image}`;
        }
        setLocation(data);
      } catch (err) {
        console.error("Error fetching location:", err);
        setError("Không thể tải chi tiết loại phòng. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchLocation();
  }, [id]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger" className="text-center shadow-sm rounded-4 p-4">
          <Alert.Heading>⚠️ Đã xảy ra lỗi</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate(-1)} className="mt-2">
            ⬅️ Quay lại
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!location) {
    return (
      <Container className="my-5">
        <Alert variant="warning" className="text-center shadow-sm rounded-4 p-4">
          Không tìm thấy thông tin loại phòng
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-4 detail-location-container">
      <Card className="shadow-lg rounded-4 border-0">
        <Card.Header className="bg-gradient-primary text-white py-3 d-flex justify-content-between align-items-center">
          <h2 className="mb-0">{location.name}</h2>
          <Badge bg={location.is_active ? "success" : "secondary"} pill className="fs-6">
            {location.is_active ? "Hoạt động" : "Không hoạt động"}
          </Badge>
        </Card.Header>

        <Card.Body className="p-4">
          <Row className="g-4">
            {/* Ảnh */}
            <Col md={5} className="d-flex flex-column align-items-center">
              <div className="w-100 rounded shadow-sm overflow-hidden" style={{ minHeight: "300px" }}>
                {location.image && !imageError ? (
                  <Image
                    src={location.image_url || `http://localhost:8000/storage/rooms/${location.image}`}
                    alt={location.name}
                    className="img-fluid"
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center bg-light h-100">
                    <i className="bi bi-image" style={{ fontSize: "3rem", color: "#ccc" }}></i>
                    <span className="text-muted mt-2">{imageError ? "Không thể tải ảnh" : "Không có ảnh"}</span>
                  </div>
                )}
              </div>
            </Col>

            {/* Thông tin */}
            <Col md={7}>
              <div className="h-100 d-flex flex-column">
                <div className="mb-4">
                  <h4 className="border-bottom pb-2 mb-3 text-primary">
                    ℹ️ Thông tin chi tiết
                  </h4>

                  <div className="mb-3">
                    <h5>Mô tả</h5>
                    <div className="p-3 bg-light rounded shadow-sm">
                      {location.descriptions || "Không có mô tả chi tiết"}
                    </div>
                  </div>
                </div>

                {/* Button */}
                <div className="mt-auto d-flex justify-content-end gap-2">
                  <Button variant="outline-secondary" onClick={() => navigate("/admin/location-types")} size="lg">
                    ⬅️ Quay lại
                  </Button>
                  <Button variant="primary" onClick={() => navigate(`/admin/location-types/edit/${id}`)} size="lg">
                    ✏️ Chỉnh sửa
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default DetailLocation;
