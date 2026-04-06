import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../navigation/Navigation";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";

const ChangePassword = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setError("");

      const res = await axios.post(
        `${BASE_URL}/user/change-password`,
        {
          currentPassword,
          newPassword,
          confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(res.data.message || "Password changed successfully");

      setTimeout(() => {
        navigate("/overview");
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to change password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold text-center mb-4">
          Change Password
        </h2>

        <input
          type="password"
          placeholder="Current password"
          className="w-full p-3 border rounded mb-3"
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="New password"
          className="w-full p-3 border rounded mb-3"
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm new password"
          className="w-full p-3 border rounded mb-3"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <Button
          title="Update Password"
          width="100%"
          height="45px"
          onPress={handleChangePassword}
        />
      </div>
    </div>
  );
};

export default ChangePassword;
