import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../components/layout";
import "../shared/layout/mainContent.css";  // ⬅️ shared main content styles
import "../shared/layout/layoutWrapper.css"; // ⬅️ wrapper if needed
import "./Home.css";


  function Home({ setIsAuthenticated }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
    navigate("/", { replace: true });
  };

  return (
    <Layout onLogout={handleLogout}>
      <main className="main-content">
        <h1 className="welcome"></h1>
      </main>
    </Layout>
  );
}

export default Home;
