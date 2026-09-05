import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/BusinessSetup.css";

function BusinessSetup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    phone: "",
    description: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to create business");
        return;
      }

      setMessage("Business created successfully!");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Business creation error:", error);
      setMessage("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="business-setup-container">
      <div className="business-setup-box">
        <h1>Set Up Your Business</h1>
        <p>Enter your business details to get started with CallFlow AI.</p>

        <form onSubmit={handleSubmit}>
          <input type="text" name="businessName" placeholder="Business Name" value={formData.businessName} onChange={handleChange} required />

          <input type="text" name="businessType" placeholder="Business Type (e.g. Cake Shop, Clinic)" value={formData.businessType} onChange={handleChange} required />

          <input type="tel" name="phone" placeholder="Business Phone Number" value={formData.phone} onChange={handleChange} required />

          <textarea name="description" placeholder="Describe your business" value={formData.description} onChange={handleChange} rows="4" />

          <button type="submit" disabled={loading}>
            {loading ? "Creating Business..." : "Create Business"}
          </button>
        </form>

        {message && <p className="business-message">{message}</p>}
      </div>
    </div>
  );
}

export default BusinessSetup;