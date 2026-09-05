import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API_URL from "../services/api";
import "../styles/CustomerDashboard.css";

function CustomerDashboard() {
  const navigate = useNavigate();
  const { accessToken, logout } = useAuth();

  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFindBusiness(e) {
    e.preventDefault();

    setError("");

    if (!phone.trim()) {
      setError("Please enter the business phone number.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/customer/find-business`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          phone: phone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Business not found");
        return;
      }

      navigate(
        `/customer-conversation/${data.business._id}/${data.workflow.id}`
      );
    } catch (error) {
      console.error("Find business error:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="customer-dashboard">
      <header className="customer-header">
        <h1>CallFlow AI</h1>

        <button onClick={logout}>
          Logout
        </button>
      </header>

      <main className="customer-main">
        <div className="customer-card">
          <h2>Contact a Business</h2>

          <p>
            Enter the phone number of the business you want to contact.
          </p>

          <form onSubmit={handleFindBusiness}>
            <label>Business Phone Number</label>

            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter business phone number"
              required
            />

            {error && (
              <p className="error-message">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Finding Business..." : "Start Conversation"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CustomerDashboard;