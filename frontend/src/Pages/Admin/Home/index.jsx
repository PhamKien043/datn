import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import axios from "axios";
import {
    Card,
    Row,
    Col,
    Table,
    Button,
    Offcanvas,
    ListGroup,
    Badge,
    Dropdown,
    Spinner,
    Alert,
    Form,
} from "react-bootstrap";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from "chart.js";
import {
    FaUser,
    FaShoppingCart,
    FaChartBar,
    FaTag,
    FaCheckCircle,
} from "react-icons/fa";
import { exportDashboardPDF } from "./StatisticsPDF";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Dashboard = () => {
    const [overview, setOverview] = useState({});
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [dailyRevenue, setDailyRevenue] = useState([]);
    const [chartMode, setChartMode] = useState("month");
    const [topServices, setTopServices] = useState([]);
    const [topRooms, setTopRooms] = useState([]);
    const [topMenus, setTopMenus] = useState([]);
    const [roomSchedule, setRoomSchedule] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState({});
    const [totalUsers, setTotalUsers] = useState(0);
    const [recentOrders, setRecentOrders] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [orderStatusRatio, setOrderStatusRatio] = useState({ total_orders: 0, data: [] });
    const [topCustomers, setTopCustomers] = useState([]);


    // loading + error
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const API_BASE = "http://localhost:8000/api/statistics";

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [
                    overviewRes,
                    revenueMonthRes,
                    revenueDayRes,
                    topServicesRes,
                    topRoomsRes,
                    topMenusRes,
                    roomScheduleRes,
                    paymentMethodsRes,
                    usersRes,
                    recentOrdersRes,
                    recentActivitiesRes,
                    orderStatusRatioRes,
                    topCustomersRes,
                ] = await Promise.all([
                    axios.get(`${API_BASE}/overview`),
                    axios.get(`${API_BASE}/revenue-monthly`),
                    axios.get(`${API_BASE}/revenue-daily`),
                    axios.get(`${API_BASE}/top-services`),
                    axios.get(`${API_BASE}/top-rooms`),
                    axios.get(`${API_BASE}/top-menus`),
                    axios.get(`${API_BASE}/room-schedule?date=${selectedDate}`),
                    axios.get(`${API_BASE}/payment-methods`),
                    axios.get(`${API_BASE}/users`),
                    axios.get(`${API_BASE}/recent-orders`),
                    axios.get(`${API_BASE}/recent-activities`),
                    axios.get(`${API_BASE}/order-status-ratio`),
                    axios.get(`${API_BASE}/top-customers`),
                ]);

                setOverview(overviewRes.data);
                setMonthlyRevenue(revenueMonthRes.data || []);
                setDailyRevenue(revenueDayRes.data || []);
                setTopServices(topServicesRes.data || []);
                setTopRooms(topRoomsRes.data || []);
                setTopMenus(topMenusRes.data || []);
                setRoomSchedule(roomScheduleRes.data.rooms || []);
                setPaymentMethods(paymentMethodsRes.data || {});
                setTotalUsers(usersRes.data?.total_users || 0);
                const sortedOrders = [...(recentOrdersRes.data || [])]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(order => ({
                        ...order,
                        date: formatDate(order.date)
                    }));
                setRecentOrders(sortedOrders.slice(0, 5));

                setRecentActivities(recentActivitiesRes.data || []);
                setOrderStatusRatio(orderStatusRatioRes.data || { total_orders: 0, data: [] });
                setTopCustomers(topCustomersRes.data.top_customers || []);

            } catch (err) {
                setError("Lỗi khi tải dữ liệu dashboard!");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedDate]);

    const handleExportPDF = () => {
        exportDashboardPDF("pdf-content", "thong_ke_dashboard.pdf");
    };

    const formatMoney = (val) =>
        Number(val || 0).toLocaleString("vi-VN") + "₫";

    const formatDate = (isoDate) => {
        const [year, month, day] = isoDate.split("-");
        return `${parseInt(day)}-${parseInt(month)}-${year}`;
    };


    // Chart data
    const monthlyData = {
        labels: monthlyRevenue.map((item) => `Tháng ${item.month}`),
        datasets: [
            {
                label: "Doanh thu theo tháng",
                data: monthlyRevenue.map((item) => item.total),
                backgroundColor: "rgba(54, 162, 235, 0.6)",
            },
        ],
    };

    const dailyData = {
        labels: dailyRevenue.map((item) => item.date),
        datasets: [
            {
                label: "Doanh thu theo ngày",
                data: dailyRevenue.map((item) => item.total),
                backgroundColor: "rgba(255, 99, 132, 0.6)",
            },
        ],
    };


    const pieData = {
        labels: Object.keys(paymentMethods || {}),
        datasets: [
            {
                label: "Phương thức thanh toán",
                data: Object.values(paymentMethods || {}).map((m) => m.total || m),
                backgroundColor: ["#007bff", "#28a745", "#ffc107", "#dc3545"],
            },
        ],
    };

    // Màu theo trạng thái (khớp badge của Bootstrap)
    const STATUS_UI = {
        pending: { label: "Chờ xác nhận", color: "#ffc107" }, // warning
        deposit_paid: { label: "Đã đặt cọc 30%", color: "#0dcaf0" }, // info
        confirmed: { label: "Đã xác nhận & chờ thực hiện", color: "#0d6efd" }, // primary
        awaiting_balance: { label: "Chờ thanh toán 70%", color: "#fd7e14" }, // orange-ish
        completed: { label: "Dịch vụ hoàn tất", color: "#198754" }, // success
        failed: { label: "Thanh toán thất bại", color: "#dc3545" }, // danger
        cancelled: { label: "Đã hủy", color: "#6c757d" }, // secondary
    };

    // Data cho Doughnut: tỉ lệ đơn hàng theo trạng thái
    const statusLabels = (orderStatusRatio.data || []).map((i) => i.text);
    const statusValues = (orderStatusRatio.data || []).map((i) => i.count);
    const statusColors = (orderStatusRatio.data || []).map(
        (i) => STATUS_UI[i.status]?.color || "#999999"
    );

    const orderStatusDoughnutData = {
        labels: statusLabels,
        datasets: [
            {
                data: statusValues,
                backgroundColor: statusColors,
                borderWidth: 1,
            },
        ],
    };

    const orderStatusDoughnutOptions = {
        plugins: {
            legend: { position: "bottom" },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const label = ctx.label || "";
                        const value = ctx.parsed || 0;
                        const total = statusValues.reduce((a, b) => a + b, 0) || 1;
                        const pct = ((value / total) * 100).toFixed(2);
                        return `${label}: ${value} (${pct}%)`;
                    }
                }
            },
        },
        cutout: "60%", // Doughnut style
    };


    const StatCard = ({ title, value }) => (
        <Card className="mb-3 shadow-sm h-100 text-center">
            <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                <Card.Title className="text-muted mb-2" style={{ fontSize: "1rem" }}>
                    {title}
                </Card.Title>
                <h3 className="fw-bold">{value}</h3>
            </Card.Body>
        </Card>
    );

    const getStatusInfo = (status) => {
        const statusMap = {
            pending: { label: "Chờ xác nhận", color: "warning" },
            deposit_paid: { label: "Đã đặt cọc 30%", color: "info" },
            confirmed: { label: "Đã xác nhận & chờ thực hiện", color: "primary" },
            awaiting_balance: { label: "Chờ thanh toán 70%", color: "warning" },
            completed: { label: "Hoàn thành", color: "success" },
            failed: { label: "Thanh toán thất bại", color: "danger" },
            cancelled: { label: "Đã hủy", color: "secondary" },
        };

        return statusMap[status] || { label: "Không xác định", color: "secondary" };
    };





    const getActivityIcon = (title = "") => {
        const text = title.toLowerCase();
        if (text.includes("khách hàng")) return <FaUser className="text-primary" />;
        if (text.includes("đơn hàng")) return <FaShoppingCart className="text-success" />;
        if (text.includes("doanh thu") || text.includes("thống kê")) return <FaChartBar className="text-info" />;
        if (text.includes("menu") || text.includes("voucher")) return <FaTag className="text-warning" />;
        return <FaCheckCircle className="text-secondary" />;
    };

    if (loading)
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );

    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <div className="container-fluid p-4">
            <h2 className="mb-4">Bảng thống kê</h2>

            <div className="d-flex justify-content-end mb-3">
                <Button variant="danger" onClick={handleExportPDF}>
                    Xuất PDF
                </Button>
            </div>

            <div id="pdf-content">
                {/* Thống kê tổng quan */}
                <Row className="mb-4 g-3">
                    <Col md={3}>
                        <StatCard title="Tổng đơn hàng" value={overview.total_orders || 0} />
                    </Col>
                    <Col md={3}>
                        <StatCard title="Tổng doanh thu" value={formatMoney(overview.total_revenue)} />
                    </Col>
                    <Col md={3}>
                        <StatCard title="Tổng người dùng" value={totalUsers} />
                    </Col>
                    <Col md={3}>
                        <StatCard
                            title="Tỷ lệ hoàn thành (%)"
                            value={
                                overview.total_orders > 0
                                    ? ((overview.orders_by_status?.completed || 0) / overview.total_orders * 100).toFixed(2) + "%"
                                    : "0%"
                            }
                        />
                    </Col>

                </Row>

                {/* Biểu đồ */}
                <Row className="mb-4">
                    <Col md={8}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h5>
                                        {chartMode === "month"
                                            ? "Doanh thu theo tháng"
                                            : "Doanh thu theo ngày"}
                                    </h5>
                                    <Dropdown>
                                        <Dropdown.Toggle variant="secondary" size="sm">
                                            {chartMode === "month" ? "Xem theo tháng" : "Xem theo ngày"}
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            <Dropdown.Item onClick={() => setChartMode("month")}>
                                                Theo tháng
                                            </Dropdown.Item>
                                            <Dropdown.Item onClick={() => setChartMode("day")}>
                                                Theo ngày
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                                <Bar data={chartMode === "month" ? monthlyData : dailyData} />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <h5>Phương thức thanh toán</h5>
                                {pieData.labels.length > 0 ? (
                                    <Pie data={pieData} />
                                ) : (
                                    <p>Chưa có dữ liệu</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>


                {/* Tỉ lệ đơn hàng theo trạng thái */}
                <Row className="mb-4">
                    <Col md={5}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h5>Tỉ lệ đơn hàng theo trạng thái</h5>
                                    <Badge bg="light" text="dark">
                                        Tổng: {orderStatusRatio.total_orders || 0}
                                    </Badge>
                                </div>

                                {orderStatusRatio.total_orders > 0 ? (
                                    <Doughnut
                                        data={orderStatusDoughnutData}
                                        options={orderStatusDoughnutOptions}
                                    />
                                ) : (
                                    <p>Chưa có dữ liệu</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={7}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <h5>Chi tiết trạng thái</h5>
                                <Table striped hover size="sm" className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Trạng thái</th>
                                            <th className="text-end">Số đơn</th>
                                            <th className="text-end">Tỷ lệ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(orderStatusRatio.data || []).map((s) => (
                                            <tr key={s.status}>
                                                <td>
                                                    <span
                                                        className="d-inline-block rounded-circle me-2"
                                                        style={{
                                                            width: 10,
                                                            height: 10,
                                                            background: STATUS_UI[s.status]?.color || "#999999",
                                                        }}
                                                    />
                                                    {s.text}
                                                </td>
                                                <td className="text-end">{s.count}</td>
                                                <td className="text-end">{Number(s.percentage).toFixed(2)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>


                {/* Hoạt động gần đây */}
                <Row>
                    <Col>
                        <Card className="shadow-sm border-0">
                            <Card.Body>
                                <h5 className="mb-3">Hoạt động gần đây</h5>
                                {recentActivities.map((activity, i) => (
                                    <div key={i} className="d-flex align-items-start mb-3">
                                        <div className="p-2 rounded me-3 bg-light">
                                            {getActivityIcon(activity.title)}
                                        </div>
                                        <div>

                                            <div className="fw-medium text-dark">{activity.title}</div>
                                            <small className="text-muted">{activity.time}</small>
                                        </div>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>


                <Row className="mb-4">
                    <Col md={6}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <h5>Top khách hàng đem lại doanh thu cao nhất</h5>
                                <Table striped size="sm" responsive>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Tên khách hàng</th>
                                            <th>Số đơn</th>
                                            <th>Doanh thu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topCustomers.length > 0 ? (
                                            topCustomers.map((cust, i) => (
                                                <tr key={cust.id}>
                                                    <td>{i + 1}</td>
                                                    <td>{cust.name}</td>
                                                    <td>{cust.total_orders}</td>
                                                    <td>{formatMoney(cust.total_revenue)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="text-center">Chưa có dữ liệu</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <h5>Phòng đặt nhiều nhất</h5>
                                <Table striped size="sm">
                                    <thead>
                                        <tr>
                                            <th>Tên phòng</th>
                                            <th>Lượt đặt</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topRooms.map((item, i) => (
                                            <tr key={i}>
                                                <td>{item.name}</td>
                                                <td>{item.total}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>


                {/* Top Menus & Room Schedule */}
                <Row className="mb-4">
                    <Col md={6}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <h5>Menu được đặt nhiều</h5>
                                <Table striped size="sm" responsive>
                                    <thead><tr><th>#</th><th>Tên menu</th><th>Lượt đặt</th><th>Số lượng</th><th>Doanh thu</th></tr></thead>
                                    <tbody>{topMenus.map((item, i) => (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            <td>{item.name}</td>
                                            <td>{item.order_count}</td>
                                            <td>{item.total_quantity}</td>
                                            <td>{formatMoney(item.total_revenue)}</td>
                                        </tr>
                                    ))}</tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={6}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h5>Thống kê lịch phòng theo ngày</h5>
                                    <Form.Control
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        size="sm"
                                        style={{ maxWidth: "200px" }}
                                    />
                                </div>
                                <Table striped size="sm">
                                    <thead>
                                        <tr>
                                            <th>Phòng</th>
                                            <th>Sáng</th>
                                            <th>Chiều</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roomSchedule.map((room, i) => (
                                            <tr key={i}>
                                                <td>{room.room_name}</td>
                                                <td>
                                                    <Badge bg={room.morning === "Đã đặt" ? "danger" : "success"}>
                                                        {room.morning}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Badge bg={room.afternoon === "Đã đặt" ? "danger" : "success"}>
                                                        {room.afternoon}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>

                </Row>

                {/*đơn hàng gần đây */}
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <h5>5 đơn hàng gần đây</h5>
                                <Table striped size="sm" responsive>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Khách hàng</th>
                                            <th>Trạng thái</th>
                                            <th>Ngày</th>
                                            <th>Tổng tiền</th>
                                            <th>Chi tiết</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map((order, i) => {
                                            const { label, color } = getStatusInfo(order.status);
                                            return (
                                                <tr key={i}>
                                                    <td>{order.id}</td>
                                                    <td>{order.user_name}</td>
                                                    <td>
                                                        <Badge bg={color}>{label}</Badge>
                                                    </td>
                                                    <td>{order.date}</td>
                                                    <td>{formatMoney(order.total_amount)}</td>
                                                    <td>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setShowDetail(true);
                                                            }}
                                                        >
                                                            Xem
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>

                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* Offcanvas Chi tiết đơn hàng */}
            <Offcanvas show={showDetail} onHide={() => setShowDetail(false)} placement="end">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>
                        Chi tiết đơn hàng #{selectedOrder?.id}
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {selectedOrder ? (
                        <>
                            <ListGroup className="mb-3">
                                <ListGroup.Item>
                                    <b>Khách hàng:</b> {selectedOrder.user_name}
                                </ListGroup.Item>
                                <ListGroup.Item><b>Trạng thái:</b> <Badge bg={getStatusInfo(selectedOrder.status).color}>
                                    {getStatusInfo(selectedOrder.status).label}</Badge>
                                </ListGroup.Item>
                                <ListGroup.Item>
                                    <b>Ngày:</b> {selectedOrder.date} {selectedOrder.time}
                                </ListGroup.Item>
                                <ListGroup.Item>
                                    <b>Tổng tiền:</b> {formatMoney(selectedOrder.total_amount)}
                                </ListGroup.Item>
                            </ListGroup>

                            {["services", "menus", "rooms"].map(
                                (key) =>
                                    selectedOrder[key]?.length > 0 && (
                                        <div key={key} className="mb-3">
                                            <h6 className="text-capitalize mb-2">{key}</h6>
                                            <ListGroup>
                                                {selectedOrder[key].map((item, i) => (
                                                    <ListGroup.Item key={i}>{item}</ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        </div>
                                    )
                            )}
                        </>
                    ) : (
                        <p>Không có dữ liệu</p>
                    )}
                </Offcanvas.Body>
            </Offcanvas>
        </div>
    );
};

export default Dashboard;