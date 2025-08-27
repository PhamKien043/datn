import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import './Layout.css';

const AdminLayout = () => {
    return (
        <div className="wrapper">
            {/* Header */}
            <Header />

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="content-wrapper">
                <main className="content">
                    <div className="container-fluid mt-3">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
