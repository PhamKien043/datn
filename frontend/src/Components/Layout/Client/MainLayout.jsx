import React from "react";
import { useLocation } from "react-router-dom";
import MyHead from "./Head";
import Header from "./Header";
import Footer from "./Footer";
// import Index from "../../../Pages/Client";
import { Outlet } from "react-router-dom";
import jQuery from "jquery";
import Chatbot from "../../../Pages/Client/Chatbot/chatbot.jsx";


const MainLayout = () => {
    const location = useLocation();


    // const isHomePage = location.pathname === "/";

    return (
        
        <div className="main-layout">
        <MyHead />
        <Header />
            <Chatbot/>
        <main className="content">
            <Outlet />
        </main>
        <Footer />
    </div>
    );
};

export default MainLayout;