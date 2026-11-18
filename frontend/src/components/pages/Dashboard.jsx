import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";


function Dashboard() {
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);

const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
            const response = await api.get("/auth/me");
            setUser(response.data.user);
            } catch {
            navigate("/");
            } finally {
            setLoading(false);
            }
        };

    checkAuth();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
            navigate("/");
        } catch {
            console.log("Logout failed");
        }
    };

if (loading) {
  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <p>Checking your account...</p>
      </div>
    </div>
  );
}

return (
  <div className="dashboard-page">
    <div className="dashboard-container">

      <div className="dashboard-header">
        <div>
          <p className="dashboard-subtitle">YOUR ACCOUNT</p>
          <h1>Welcome, {user?.name}!</h1>
          <p className="dashboard-description">
            You are successfully logged in.
          </p>
        </div>

        <div className="profile-avatar">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="dashboard-card">
        <h2>Profile Information</h2>

        <div className="profile-detail">
          <span>Full Name</span>
          <strong>{user?.name}</strong>
        </div>

        <div className="profile-detail">
          <span>Email Address</span>
          <strong>{user?.email}</strong>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <p className="dashboard-footer">
        Secure Account Dashboard
      </p>

    </div>
  </div>
);

}

export default Dashboard;