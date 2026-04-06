import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../navigation/Navigation";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";

const NewUserChangePassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      return setError("Passwords do not match");
    }

    try {
      await axios.post(
        `${BASE_URL}/user/setup-password`,
      {
    password,
    confirmPassword: confirm,
  },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      navigate("/overview");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to set password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-6 rounded-xl shadow"
      >
        <h2 className="text-xl font-bold mb-4">Set New Password</h2>

        <input
          type="password"
          placeholder="New password"
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded mb-3"
        />

        <input
          type="password"
          placeholder="Confirm password"
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full p-3 border rounded mb-3"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <Button title="Save Password" width="100%" height="45px" />
      </form>
    </div>
  );
};

export default NewUserChangePassword;
