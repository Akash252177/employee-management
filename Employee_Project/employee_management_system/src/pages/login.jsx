import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Input, 
  Button, 
  Form, 
  notification, 
  Card,
  Checkbox,
  Divider,
  Typography,
  Spin,
  message
} from "antd";
import { 
  LockOutlined, 
  UserOutlined, 
  LoginOutlined,
  GoogleOutlined,
  QuestionCircleOutlined,
  EyeTwoTone,
  EyeInvisibleOutlined
} from "@ant-design/icons";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import "./login.css";

const { Title, Text } = Typography;

function Login({ setIsAuthenticated }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Check for remembered credentials on component mount
  useEffect(() => {
    const rememberedUser = localStorage.getItem("rememberedUser");
    if (rememberedUser) {
      try {
        const userData = JSON.parse(rememberedUser);
        form.setFieldsValue({
          username: userData.username,
          password: userData.password
        });
        setRememberMe(true);
      } catch (error) {
        console.error("Error parsing remembered user", error);
        localStorage.removeItem("rememberedUser");
      }
    }
  }, [form]);

  const handleSubmit = async (values) => {
    const { username, password } = values;
    setLoading(true);

    try {
      // Admin special case
      if (username === "admin" && password === "admin123") {
        authenticateAdmin();
        return;
      }

      // Regular user login
      const response = await axios.post("http://127.0.0.1:5000/login", {
        username,
        password,
      });

      if (response.status === 200) {
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem("rememberedUser", JSON.stringify({ username, password }));
        } else {
          localStorage.removeItem("rememberedUser");
        }
        
        authenticateUser(response.data);
        message.success("Login successful!");
      }
    } catch (error) {
      // Handle specific error cases
      if (error.response) {
        const { status } = error.response;
        if (status === 401) {
          message.error("Invalid username or password");
        } else {
          message.error("Login failed. Please try again.");
        }
      } else {
        // Network error
        message.error("Cannot connect to server. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const authenticateAdmin = () => {
    // Save admin info
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("role", "admin");
    localStorage.setItem("username", "Admin");
    
    // Handle remember me for admin
    if (rememberMe) {
      localStorage.setItem("rememberedUser", JSON.stringify({ 
        username: "admin", 
        password: "admin123" 
      }));
    }
    
    setIsAuthenticated(true);
    message.success("Welcome back, Admin!");
    navigate("/employees");
  };

  const authenticateUser = (userData) => {
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("role", "user");
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("username", userData.username || userData.email || "User");
    setIsAuthenticated(true);
    navigate("/employees");
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const handleGoogleLogin = async (response) => {
    if (!response || !response.credential) {
      message.error("Google login failed");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/google-login", {
        token: response.credential,
      });

      if (res.status === 200) {
        authenticateUser(res.data);
      }
    } catch (err) {
      message.error("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background"></div>
      
      <div className="login-content">
        <div className="login-left-panel">
          <div className="company-branding">
            <div className="company-logo-container">
              <div className="company-logo"></div>
            </div>
            <Title level={2} className="company-name">Employee Management System</Title>
            <div className="decorative-pattern"></div>
          </div>
        </div>
        
        <div className="login-right-panel">
          <Card className="login-card" bordered={false}>
            <Spin spinning={loading} tip="Signing in...">
              <div className="login-header">
                <Title level={2} className="login-title">
                  <LoginOutlined className="title-icon" /> Sign In
                </Title>
                <Text className="login-subtitle">Welcome back! Please sign in to continue.</Text>
              </div>

              <Form
                form={form}
                name="login_form"
                className="login-form"
                onFinish={handleSubmit}
                layout="vertical"
                requiredMark={false}
              >
                <Form.Item
                  name="username"
                  label="Username"
                  rules={[
                    { required: true, message: "Please enter your username" },
                    { min: 3, message: "Username must be at least 3 characters" }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined className="field-icon" />}
                    size="large"
                    placeholder="Enter your username"
                    className="login-input"
                    autoComplete="username"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[{ required: true, message: "Please enter your password" }]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="field-icon" />}
                    size="large"
                    placeholder="Enter your password"
                    className="login-input"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    autoComplete="current-password"
                  />
                </Form.Item>

                <Form.Item>
                  <div className="login-options">
                    <Checkbox 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    >
                      Remember me
                    </Checkbox>
                    <Button 
                      type="link" 
                      onClick={handleForgotPassword}
                      className="forgot-password-link"
                    >
                      Forgot Password?
                    </Button>
                  </div>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    className="login-button"
                    icon={<LoginOutlined />}
                    loading={loading}
                  >
                    Sign In
                  </Button>
                </Form.Item>
              </Form>

              <Divider>
                <Text type="secondary">OR</Text>
              </Divider>

              <div className="social-login-section">
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() => message.error("Google login failed")}
                  useOneTap
                  shape="rectangular"
                  theme="filled_blue"
                  text="signin_with"
                  size="large"
                  width="full"
                />
              </div>
            </Spin>
            
            <div className="login-footer">
              <Text type="secondary">© {new Date().getFullYear()} Employee Management System</Text>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Login;
