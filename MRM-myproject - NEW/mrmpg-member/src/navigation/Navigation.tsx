import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Layout } from "../components";
import * as Pages from "../pages";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import NewUserChangePassword from "../pages/NewUserChangePassword";
import ChangePassword from "../pages/ChangePassword";

/* =========================
   ENV CONFIG (VITE)
========================= */
export const BASE_URL = import.meta.env.VITE_MEMBER_BASE_URL;
export const IMAGE_BASE_URL=import.meta.env.VITE_MEMBER_IMAGE_BASE_URL

/* =========================
   AUTH HELPERS
========================= */
export const getToken = () => localStorage.getItem("token");
const getUser = () => {
  const user = localStorage.getItem("member");
  return user ? JSON.parse(user) : null;
};

/* =========================
   ROUTE CONFIG
========================= */
const dashboardPages = [
  "/overview",
  "/document",
  "/profile-details",
  "/upload-proof",
  "/leaving-request"
];

const Navigation: React.FC = () => {
  const location = useLocation();

  const token = getToken();
  const user = getUser();

  const isAuthenticated = Boolean(token);
  const showSidebar = dashboardPages.includes(location.pathname);

  return (
    <Routes>
      {/* ================= PUBLIC ROUTES ================= */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/change-password" element={<NewUserChangePassword />} />
      <Route path="/reset-password" element={<ChangePassword/>}/>
      {/* Redirect root */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/overview" />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* ================= PROTECTED ROUTES ================= */}
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <Layout showSidebar={showSidebar} user={user}>
              <Routes>
                <Route path="/overview" element={<Pages.Overview />} />
                <Route path="/document" element={<Pages.Document />} />
                {/* <Route path="/request-form" element={<Pages.RequestForm />} /> */}
                <Route path="/profile-details" element={<Pages.ProfileDetails />} />
                <Route path="/upload-proof" element={<Pages.UploadProof />} />
                <Route path="/leaving-request" element={<Pages.LeavingRequestStatus/>}/>
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

export default Navigation;
