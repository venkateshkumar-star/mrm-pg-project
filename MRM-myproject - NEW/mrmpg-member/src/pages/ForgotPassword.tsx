import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/Button";
import { BASE_URL } from "../navigation/Navigation";
import { useNavigate } from "react-router-dom";
import { UsernameIcon } from "../../public/Icons";

const OTP_LENGTH = 6;

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  /* ================= OTP INPUT HANDLING ================= */

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    if (step === "otp") {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  /* ================= SEND OTP ================= */

  const sendOTP = async () => {
    if (!email) {
      setError("Email is required");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      setError("");

      const res = await axios.post(`${BASE_URL}/user/request-otp`, { email });

      if (res.data.success) {
        setStep("otp");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */

  const verifyOTP = async () => {
    const otpValue = otp.join("");

    if (otpValue.length !== OTP_LENGTH) {
      setError("Please enter valid OTP");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      setError("");

      await axios.post(`${BASE_URL}/user/otp-verify`, {
        email,
        otp: otpValue,
      });

      setStep("password");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESET PASSWORD ================= */

  const resetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      setError("");

      await axios.post(`${BASE_URL}/user/reset-password`, {
        email,
        newPassword,
        confirmPassword,
      });

      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        {/* <h2 className="text-xl font-bold text-center mb-4">
          Forgot Password
        </h2> */}

        {/* ================= EMAIL STEP ================= */}
        {step === "email" && (
          <>
            <h2 className="text-xl font-bold text-center mb-4">Enter Email</h2>
             <div className="relative w-full ">
                     <span className="absolute left-4 top-6 -translate-y-1/2 text-gray-400">
              <UsernameIcon />
              </span>
                    <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 pl-12 mb-3 border rounded-xl focus:outline-none"
            />
          </div>
           
            <Button
              title={loading ? "Sending..." : "Send OTP"}
              width="100%"
              onPress={sendOTP}
              disabled={loading}
            />
          </>
        )}

        {/* ================= OTP STEP ================= */}
        {step === "otp" && (
          <>
           <h2 className="text-xl font-bold text-center mb-4">Enter OTP</h2>
            <div className="flex justify-center gap-2 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  maxLength={1}
                  value={digit}
                  onChange={(e) =>
                    handleOtpChange(index, e.target.value)
                  }
                  onKeyDown={(e) =>
                    handleOtpKeyDown(index, e)
                  }
                  className="w-10 h-10 text-center border rounded "
                />
              ))}
            </div>
            <Button
              title={loading ? "Verifying..." : "Verify OTP"}
              width="100%"
              onPress={verifyOTP}
              disabled={loading}
            />
          </>
        )}

        {/* ================= PASSWORD STEP ================= */}
        {step === "password" && (
          <>
           <h2 className="text-xl font-bold text-center mb-4">Create New Password</h2>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border rounded mb-3"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border rounded mb-3"
            />
            <Button
              title={loading ? "Resetting..." : "Reset Password"}
              width="100%"
              onPress={resetPassword}
              disabled={loading}
            />
          </>
        )}

        {error && (
          <p className="text-red-600 text-sm mt-3 text-center">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
