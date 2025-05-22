import { useNavigate, useLocation } from "react-router-dom";
import "../shared/layout/sidebar.css";

function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { label: "Home", path: "/home" },
    { label: "Employees", path: "/employees" },
    { label: "Timesheet", path: "/timesheet" },
    { label: "Payroll", path: "/payroll" },
    { label: "Reports", path: "/reports" },
    { label: "Product", path: "/product" },
  ];

  const handleNav = (path) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  const handleLogout = () => {
    // You can perform any cleanup here, like removing authentication data
    localStorage.removeItem("isAuthenticated"); // Example for clearing authentication
    navigate("/login", { replace: true }); // Redirect to login page
    onLogout(); // Call the onLogout function passed as a prop
  };

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Dashboard</h2>

      <nav className="nav-links">
        {links.map(({ label, path }) => (
          <button
            key={path}
            className={`nav-button ${location.pathname === path ? "active" : ""}`}
            onClick={() => handleNav(path)}
            aria-current={location.pathname === path ? "page" : undefined}
          >
            {label}
          </button>
        ))}
      </nav>

      <button className="sidebar-logout" onClick={handleLogout}>
        <span className="logout-icon" role="img" aria-label="logout"></span> Logout
      </button>
    </aside>
  );
}

export default Sidebar;