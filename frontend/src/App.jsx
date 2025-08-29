import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Admin
import AdminLayout from "./Components/Layout/Admin/Layout";
import HomepagesAdmin from "./Pages/Admin/Home";
import Dashboard from "./Pages/Admin/Dashboard";
import User from "./Pages/Admin/User";
import OrderHistory from "./Pages/Admin/History/Order.jsx";


// Client
import MainLayout from "./Components/Layout/Client/MainLayout";
import Index from "./Pages/Client";
import About from "./Pages/Client/About";
// import Service from "./Pages/Client/Service";
import ServiceDetail from "./Pages/Client/Service/ServiceDetail";
import Menu from "./Pages/Client/Menu";
import Contact from "./Pages/Client/Contact";
import Checkout from "./Pages/Client/Checkout";
import Login from "./Pages/Client/Login";
import Register from "./Pages/Client/Register";
import RoomDetail from "./Pages/Client/Rooms/RoomDetail.jsx";
import CartPage from "./Pages/Client/Cart/CartPage.jsx";
import PaymentPage from "./Pages/Client/Payment/PaymentPage.jsx";
import MyOrders from "./Pages/Client/OrderDetail/MyOrders.jsx";
import OrderDetails from "./Pages/Client/OrderDetail/OrderDetails.jsx";
import OrderDetailAdmin from "./Pages/Admin/History/EditOrder.jsx";
import Blog from "./Pages/Client/Blog";
import BlogDetail from "./Pages/Client/Blog/detail.jsx";

// Rooms
import Rooms from "./Pages/Admin/Rooms";
import AddRooms from "./Pages/Admin/Rooms/addRooms";
import DetailRooms from "./Pages/Admin/Rooms/detailRooms";
import EditRooms from "./Pages/Admin/Rooms/editRooms";
// Loctation
import LocationTypes from "./Pages/Admin/location-types";
import AddLocation from "./Pages/Admin/location-types/addLocation";
import DetailLocation from "./Pages/Admin/location-types/detailLocation";
import EditLocation from "./Pages/Admin/location-types/editLocation";
// voucder
import Voucher from "./Pages/Admin/Voucher";
import AddVoucher from "./Pages/Admin/Voucher/addVoucher";
import EditVoucher from "./Pages/Admin/Voucher/editVoucher";
import AddCategory from "./Pages/Admin/CategoryServices/AddCategory.jsx";
import EditCategory from "./Pages/Admin/CategoryServices/EditCategory.jsx";
import ScheduleManager from "./Pages/Admin/Schedule/ScheduleManager.jsx";

// blog
import BlogList from "./Pages/Admin/Blog";
import AddBlog from "./Pages/Admin/Blog/addBlog";
import EditBlog from "./Pages/Admin/Blog/editBlog";

// email
import EmailList from "./Pages/Admin/Email";
import EmailDetail from "./Pages/Admin/Email/Detail.jsx";

import AddMenu from "./Pages/Admin/Menus/addMenu.jsx";
import MenusList from "./Pages/Admin/Menus/index.jsx";
import EditMenu from "./Pages/Admin/Menus/editMenu.jsx";
import DetailMenu from "./Pages/Admin/Menus/detailMenu.jsx";
import AddUser from "./Pages/Admin/User/addUser.jsx";
import EditCategoryMenu from "./Pages/Admin/Category_Menu/editCategoryMenu.jsx";
import AddCategoryMenu from "./Pages/Admin/Category_Menu/addCategoryMenu.jsx";
import CategoryMenuList from "./Pages/Admin/Category_Menu/index.jsx";
import DetailCategoryMenu from "./Pages/Admin/Category_Menu/DetaiCategoryMenu.jsx";
import { clearAuth, getUserFromStorage } from "./services/authService.js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function CategoryAdmin() {
    return null;
}

// ================= Private Route Components =================
function AdminRoute({ children }) {
    // eslint-disable-next-line no-undef
    const user = getUserFromStorage();
    if (!user) return <Navigate to="/Login" replace />;

    if (Number(user.status) === 0) {
        toast.error("Tài khoản của bạn đã bị khóa!");
        clearAuth();
        return <Navigate to="/Login" replace />;
    }

    if (Number(user.role) !== 0) {
        toast.error("Bạn không có quyền truy cập trang admin!");
        return <Navigate to="/" replace />;
    }

    return children;
}

function PrivateRoute({ children }) {
    const user = getUserFromStorage();
    if (!user) return <Navigate to="/Login" replace />;

    if (Number(user.status) === 0) {
        toast.error("Tài khoản của bạn đã bị khóa!");
        clearAuth();
        return <Navigate to="/Login" replace />;
    }

    return children;
}

function App() {
    return (
        <Router>
            <ToastContainer position="top-right" autoClose={3000} newestOnTop />
            <Routes>
                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminLayout />
                        </AdminRoute>
                    }
                >
                    {/* Admin Routes */}
                    {/*<Route path="/admin" element={<AdminLayout />}>*/}
                    <Route index element={<HomepagesAdmin />} />
                    <Route path="dashboard" element={<Dashboard />} />

                    {/* Các route quản lý danh mục */}
                    <Route path="category" element={<CategoryAdmin />} />
                    <Route path="addcategory" element={<AddCategory />} />
                    <Route path="editcategory/:id" element={<EditCategory />} />

                    {/* Lịch phong */}
                    <Route path="schedule" element={<ScheduleManager />} />

                    {/* Đon hang */}
                    <Route path="history" element={<OrderHistory />} />
                    <Route path="orders/:orderId" element={<OrderDetailAdmin />} />

                    {/* Các route quản lý người dùng */}
                    <Route path="users" element={<User />} />
                    <Route path="User" element={<Navigate to="/admin/users" replace />} />
                    <Route path="adduser" element={<AddUser />} />

                    {/*  router quản lý phòng */}
                    <Route path="rooms" element={<Rooms />} />
                    <Route path="rooms/add" element={<AddRooms />} />
                    <Route path="rooms/detail/:id" element={<DetailRooms />} />
                    <Route path="rooms/edit/:id" element={<EditRooms />} />

                    {/* Route địa điểm admin */}
                    <Route path="location-types" element={<LocationTypes />} />
                    <Route path="location-types/add" element={<AddLocation />} />
                    <Route path="location-types/detail/:id" element={<DetailLocation />} />
                    <Route path="location-types/edit/:id" element={<EditLocation />} />

                    {/* Voucher */}
                    <Route path="voucher" element={<Voucher />} />
                    <Route path="voucher/add" element={<AddVoucher />} />
                    <Route path="voucher/edit/:id" element={<EditVoucher />} />

                    <Route path="category-menus" element={<CategoryMenuList />} />
                    <Route path="category-menus/add" element={<AddCategoryMenu />} />
                    <Route path="category-menus/edit/:id" element={<EditCategoryMenu />} />
                    <Route path="category-menus/detail/:id" element={<DetailCategoryMenu />} />

                    {/* Menu */}
                    <Route path="menus" element={<MenusList />} />
                    <Route path="menus/add" element={<AddMenu />} />
                    <Route path="menus/edit/:id" element={<EditMenu />} />
                    <Route path="menus/detail/:id" element={<DetailMenu />} />

                    {/* Blog */}
                    <Route path="blogs" element={<BlogList />} />
                    <Route path="blog/add" element={<AddBlog />} />
                    <Route path="blog/edit/:id" element={<EditBlog />} />

                    {/* Email */}
                    <Route path="emails" element={<EmailList />} />
                    <Route path="email/:id" element={<EmailDetail />} />

                </Route>

                {/* Client Routes */}
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<Index />} />
                    <Route path="About" element={<About />} />
                    {/*<Route path="Service" element={<Service />} />*/}
                    <Route path="Service" element={<Navigate to="/services/1" replace />} />
                    <Route path="services/:id" element={<ServiceDetail />} />
                    <Route path="rooms/:id" element={<RoomDetail />} />
                    <Route path="Menu" element={<Menu />} />
                    <Route path="cart-details" element={<CartPage />} />
                    <Route path="payment" element={<PaymentPage />} />
                    <Route path="Contact" element={<Contact />} />
                    <Route path="Checkout" element={<Checkout />} />
                    <Route path="my-orders" element={<MyOrders />} />
                    <Route path="orders/:orderId" element={<OrderDetails />} />

                    <Route path="blogs" element={<Blog />} />
                    <Route path="blog/:id" element={<BlogDetail />} />

                    {/* Auth Routes */}
                    <Route path="/Login" element={<Login />} />
                    <Route path="/Register" element={<Register />} />
                </Route>


            </Routes>
        </Router>
    );
}

export default App;
