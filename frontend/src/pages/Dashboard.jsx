import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import API_URL from "../services/api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const { accessToken, logout } = useAuth();
  const navigate = useNavigate();

  const [business, setBusiness] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const response = await fetch(`${API_URL}/business`, {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await response.json();

        if (response.status === 404) {
          navigate("/business-setup");
          return;
        }

        if (!response.ok) {
          setError(data.message || "Failed to fetch business");
          return;
        }

        setBusiness(data.business);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (accessToken) {
      fetchBusiness();
    }
  }, [accessToken, navigate]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={logout}>Logout</button>
      </header>

      <main>
        <h2>Your Business</h2>

        {loading && <p>Loading business...</p>}

        {error && <p className="error-message">{error}</p>}

        {!loading && !error && business && (
          <div className="business-card">
            <h3>{business.businessName}</h3>

            <p>
              <strong>Type:</strong> {business.businessType}
            </p>

            <p>
              <strong>Phone:</strong> {business.phone}
            </p>

            {business.description && (
              <p>
                <strong>Description:</strong> {business.description}
              </p>
            )}

            <button
              onClick={() => {
                window.location.href = `${API_URL}/calendar/auth?businessId=${business.id}`;
              }}
            >
              Connect Google Calendar
            </button>
          </div>
        )}

        {!loading && !error && !business && (
          <p>No business found.</p>
        )}

        {!loading && business && (
          <div>
            <button onClick={() => navigate("/workflows")}>
              Manage Workflows
            </button>

            <button onClick={() => navigate("/conversations")}>
              View Conversations
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;