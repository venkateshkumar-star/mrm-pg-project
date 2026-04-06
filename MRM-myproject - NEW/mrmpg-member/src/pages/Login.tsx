
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/Button";
import { assets } from "../assets/assets";
import { BASE_URL } from "../navigation/Navigation";
import * as icon from '../../public/Icons'

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/user/login`, form);

      const { token, member, requirePasswordSetup } = res.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("member", JSON.stringify(member));

      if (requirePasswordSetup) {
        navigate("/change-password");
      } else {
        navigate("/overview");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage: `url(${assets.loginbg})`,
        backgroundSize: "cover",
      }}
    >
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-6">Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative w-full">
            {/* Icon */}
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <icon.UsernameIcon />
            </span>

            {/* Input */}
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              required
              className="w-full p-3 pl-12 border rounded-xl focus:outline-none "
            />
          </div>
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <icon.PasswordIcon />
            </span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password / OTP"
              required
              className="w-full p-3 pl-12 border rounded-xl focus:outline-none "
            />
          </div>
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-blue-600">
              Forgot password?
            </Link>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <Button
            title={loading ? "Please wait..." : "Login"}
            width="100%"
            height="48px"
            backgroundColor="#FC2C03"
            disabled={loading}
            icon={<icon.LoginIcon width={18} height={18} />}
          />
        </form>
      </div>
    </div>
  );
};

export default Login;
