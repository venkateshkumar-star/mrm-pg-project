import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthLayout.scss"
import ui from "@/components/ui";
import type { LoginResponse } from "@/types/apiResponseTypes";
import { AuthManager, ApiClient } from "@/utils/index";

interface LoginFormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}
const AuthLayout = (): React.ReactElement => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword,] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsLoading(true); 
    
    try {
      const apiResponse = await ApiClient.postWithoutAuth('/admin/login', formData) as LoginResponse;
      if (apiResponse.success) {
        const { token, admin, expiresIn } = apiResponse.data;
        AuthManager.setAuthData({ token, admin, expiresIn });
        navigate('/');
      } else {
        setErrors({ 
          email: apiResponse.message || 'Invalid credentials',
          password: 'Please check your email and password'
        });
      }
    } catch (error) {
      console.error('Login request failed:', error);
      setErrors({ 
        email: 'Invalid email or password',
        password: 'Please check your credentials and try again'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = AuthManager.getToken();
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Login</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <ui.Label
              htmlFor="email"
              required
              className="form-label"
            >
              Email
            </ui.Label>
            <ui.Input
              id="email"
              name="email"
              type="text"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder="Enter your email"
              size="large"
              fullWidth
            />
          </div>

          <div className="form-group">
            <ui.Label
              htmlFor="password"
              required
              className="form-label"
            >
              Password
            </ui.Label>
            <ui.Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              placeholder="Enter your password"
              size="large"
              fullWidth
            />
          </div>

          <div className="form-submit">
            <ui.Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              loading={isLoading}
            >
              Login
            </ui.Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthLayout;