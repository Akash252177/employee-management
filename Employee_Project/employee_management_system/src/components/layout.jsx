import React, { useState, useEffect } from "react";
import {
  AppstoreAddOutlined,
  IdcardOutlined,
  ClockCircleOutlined,
  PoweroffOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Button, theme } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import companyLogo from "../assets/lcode_technologies_cover_1.png";
import compactLogo from "../assets/favicon.png";
import "./Layout.css";

const { Content, Sider } = Layout;

const LayoutComponent = ({ children }) => {
  // Load the initial state from localStorage or use false as default
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("siderCollapsed") === "true"
  );
  const [selectedKey, setSelectedKey] = useState("1");

  const navigate = useNavigate();
  const location = useLocation();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    const pathKeyMap = {
      "/employees": "1",          // Changed from /view-employees to /employees to match App.js
      "/add-employee": "2",
      "/employee-role": "3",
      "/employee-status": "4",
      "/role-allocation": "5",
      "/product-creation": "6",
      "/client-creation": "7",
      "/project-creation": "8",
      "/product-report": "9",
      "/task-creation": "10",     // This now matches the path in App.js
      "/task-allocation": "11",
      "/task-status-update": "12",
      "/time-sheet-entry": "13",
      "/time-sheet-summary": "14",
      "/team-time-sheet-summary": "15",
    };

    const matchedKey = Object.entries(pathKeyMap).find(([path]) =>
      location.pathname.startsWith(path)
    );

    if (matchedKey) {
      setSelectedKey(matchedKey[1]);
    }
  }, [location]);

  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.removeItem("isAuthenticated"); // ← just remove the auth key
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleMenuClick = ({ key }) => {
    setSelectedKey(key);
    const routeMap = {
      "1": "/employees",          // Changed from /view-employees to /employees to match App.js
      "2": "/add-employee",
      "3": "/employee-role",
      "4": "/employee-status",
      "5": "/role-allocation",
      "6": "/product-creation",
      "7": "/client-creation",
      "8": "/project-creation",
      "9": "/product-report",
      "10": "/task-creation",     // This now matches the path in App.js
      "11": "/task-allocation",
      "12": "/task-status-update",
      "13": "/time-sheet-entry",
      "14": "/time-sheet-summary",
      "15": "/team-time-sheet-summary",
    };

    navigate(routeMap[key] || "/");
  };

  const items = [
    {
      key: "sub1",
      icon: <IdcardOutlined />,
      label: "Employee Management",
      children: [
        { key: "1", label: "View Employees" },
        { key: "2", label: "Add Employee" },
        { key: "3", label: "Role Management"},
        { key: "4", label: "Employee Status" },
        { key: "5", label: "Role Allocation" },
      ],
    },
    {
      key: "sub2",
      icon: <AppstoreAddOutlined />,
      label: "Product Management",
      children: [
        { key: "6", label: "Product Creation" },
        { key: "7", label: "Client Creation" },
        { key: "8", label: "Project Creation" },
        { key: "9", label: "Product Report" },
      ],
    },
    {
      key: "sub3",
      icon: <ClockCircleOutlined />,
      label: "Time Management",
      children: [
        { key: "10", label: "Task Creation" },
        { key: "11", label: "Task Allocation" },
        { key: "12", label: "Task Status Update" },
        { key: "13", label: "Time Sheet Entry" },
        { key: "14", label: "Time Sheet Summary" },
        { key: "15", label: "Team Time Sheet Summary" },
      ],
    },
  ];

  // Save the state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("siderCollapsed", collapsed.toString());
  }, [collapsed]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(val) => setCollapsed(val)}
        width={250}
        style={{
          transition: "all 0.3s ease-in-out",
        }}
      >
        <div className="logo-container" style={{ padding: 16, textAlign: "center" }}>
          <img
            src={collapsed ? compactLogo : companyLogo}
            alt="LCODE Logo"
            style={{
              width: collapsed ? "40px" : "120px",
              height: "auto",
              transition: "all 0.3s ease-in-out",
            }}
          />
        </div>

        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          mode="inline"
          items={items}
          onClick={handleMenuClick}
        />

        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            borderTop: "1px solid #303030",
            padding: "10px",
          }}
        >
          <Button
            type="primary"
            icon={<PoweroffOutlined />}
            block
            onClick={handleLogout}
            style={{
              borderRadius: "0 0 4px 4px",
              marginBottom: "50px",
              transition: "all 0.3s ease-in-out",
            }}
          >
            {!collapsed && "Logout"}
          </Button>
        </div>
      </Sider>

      <Layout>
        <Content style={{ margin: "0 16px" }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {children || "Content goes here."}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

LayoutComponent.propTypes = {
  children: PropTypes.node,
};

export default LayoutComponent;