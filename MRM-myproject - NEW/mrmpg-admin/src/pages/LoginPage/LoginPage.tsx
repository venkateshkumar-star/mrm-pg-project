import React from "react";
import "./LoginPage.scss"
import layouts from "@layouts/index";
import loginBanner from "@images/login_page_banner.jpg"

const LoginPage: React.FC = () => {
    return (
        <div className="login-page">
            <div className="page-bg"></div>
            <div className="container">
                <div className="content">
                    <div className="left-banner">
                        <div className="banner-image">
                            <img src={loginBanner} alt="Login Banner" />
                        </div>
                    </div>
                    <div className="right-form">
                        <layouts.AuthLayout />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
