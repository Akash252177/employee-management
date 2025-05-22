import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";


// Pages
import AddEmployee from "./pages/AddEmployee";
import EmployeeRole from "./pages/EmployeeRole";
import RoleInformation from "./pages/RoleInformation";
import Home from "./pages/Home";
import Employees from "./pages/Employees";
import ViewEmployeeDetails from "./pages/ViewEmployeeDetails";
import Layout from "./components/layout";
import Login from "./pages/login";
import ForgotPassword from "./pages/ForgotPassword";
import EmployeeStatusPage from './pages/EmployeeStatusPage';
import RoleAllocation from './pages/RoleAllocation';
import RoleAllocationsList from './pages/RoleAllocationsList';
import ProductCreation from './pages/Product_Creation'; 
import ClientCreation from './pages/Client_Creation'; 
import ProjectCreation from './pages/Project_Creation';
import ProductReport from './pages/Product_Report';
import TaskCreation from './pages/Task_Creation';
import TaskAllocation from './pages/Task_Allocation'; 
import TaskStatusUpdate from './pages/Task_Status_Update'; // Import the new Task Status Update component
import TimeSheetEntry from './pages/Time_Sheet_Entry'; // Import the Time Sheet Entry component
import TimeSheetSummary from './pages/TimeSheet_Summary'; // Import the Time Sheet Summary component

// Error and Warning Pages
import Error404 from './pages/Error404';
import Error403 from './pages/Error403';
import Error500 from './pages/Error500';
import WarningPage from './pages/WarningPage';
import ErrorDemo from './components/ErrorDemo';

// Assets
import companyLogo from "./assets/lcode_technologies_cover_1.png";

// Global Styles
import './pages/globalStyles.css';
// Ant Design Styles
import 'antd/dist/reset.css';
// Custom Animations
import './styles/animations.css';
// Custom message styles
import './styles/messageStyles.css';

function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });

  // Sync axios base URL
  useEffect(() => {
    axios.defaults.baseURL = "http://127.0.0.1:5000 "; // Ensure this URL is correct
  }, []);


  // Logout handler
  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.setItem("isAuthenticated", "false");
    setIsAuthenticated(false);
    navigate("/login", { replace: true });
  };

  // If user gets logged out, push to login
  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated");
    if (auth !== "true") {
      setIsAuthenticated(false);
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const authStatus = useMemo(() => isAuthenticated, [isAuthenticated]);

  // Protect routes
  const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    return authStatus ? (
      <Layout handleLogout={handleLogout} logoSrc={companyLogo} children={children} />
    ) : (
      <Navigate to="/login" replace state={{ from: location }} />
    );
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          authStatus ? (
            <Navigate to="/employees" replace />
          ) : (
            <Login setIsAuthenticated={setIsAuthenticated} />
          )
        }
      />
      <Route
        path="/login"
        element={
          authStatus ? (
            <Navigate to="/employees" replace />
          ) : (
            <Login setIsAuthenticated={setIsAuthenticated} />
          )
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes */}
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
      <Route path="/add-employee" element={<ProtectedRoute><AddEmployee /></ProtectedRoute>} />
      <Route path="/employee-role" element={<ProtectedRoute><EmployeeRole /></ProtectedRoute>} />
      <Route path="/role-information" element={<ProtectedRoute><RoleInformation /></ProtectedRoute>} />
      <Route path="/role-allocation" element={<ProtectedRoute><RoleAllocation /></ProtectedRoute>} />
      <Route path="/role-allocations-list" element={<ProtectedRoute><RoleAllocationsList /></ProtectedRoute>} />
      <Route path="/employee/:employeeId" element={<ProtectedRoute><ViewEmployeeDetails /></ProtectedRoute>} />
      <Route path="/employee-status" element={<ProtectedRoute><EmployeeStatusPage /></ProtectedRoute>} />

      {/* Product Routes */}
      <Route path="/product-creation" element={<ProtectedRoute><ProductCreation /></ProtectedRoute>} />
      <Route path="/product-report" element={<ProtectedRoute><ProductReport /></ProtectedRoute>} />

      {/* Client Creation Route */}
      <Route path="/client-creation" element={<ProtectedRoute><ClientCreation /></ProtectedRoute>} />

      {/* Project Creation Route */}
      <Route path="/project-creation" element={<ProtectedRoute><ProjectCreation /></ProtectedRoute>} />

      {/* Task Routes */}
      <Route path="/task-creation" element={<ProtectedRoute><TaskCreation /></ProtectedRoute>} />
      <Route path="/task-allocation" element={<ProtectedRoute><TaskAllocation /></ProtectedRoute>} />
      <Route path="/task-status-update" element={<ProtectedRoute><TaskStatusUpdate /></ProtectedRoute>} />
      
      {/* Time Sheet Routes */}
      <Route path="/time-sheet-entry" element={<ProtectedRoute><TimeSheetEntry /></ProtectedRoute>} />
      <Route path="/time-sheet-summary" element={<ProtectedRoute><TimeSheetSummary /></ProtectedRoute>} />
      <Route path="/team-time-sheet-summary" element={<ProtectedRoute><TimeSheetSummary /></ProtectedRoute>} />

      {/* Error Pages */}
      <Route path="/error/404" element={<Error404 />} />
      <Route path="/error/403" element={<Error403 />} />
      <Route path="/error/500" element={<Error500 />} />
      <Route path="/warning" element={<WarningPage />} />
      
      {/* Demo Page for Error Pages */}
      <Route path="/error-demo" element={<ProtectedRoute><ErrorDemo /></ProtectedRoute>} />

      {/* Fallback - Replace with 404 error page */}
      <Route path="*" element={<Error404 />} />
    </Routes>
  );
}

export default App;