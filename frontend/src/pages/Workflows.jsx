import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Workflow.css";
import API_URL from "../services/api";

function Workflows() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError("");

        const businessResponse = await fetch(`${API_URL}/business`, {
          method: "GET",
          credentials: "include",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const businessData = await businessResponse.json();

        if (!businessResponse.ok) {
          throw new Error(businessData.message || "Failed to fetch business");
        }

        setBusiness(businessData.business);

        const workflowResponse = await fetch(`${API_URL}/workflow?businessId=${businessData.business.id}`, {
          method: "GET",
          credentials: "include",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const workflowData = await workflowResponse.json();

        if (!workflowResponse.ok) {
          throw new Error(workflowData.message || "Failed to fetch workflows");
        }

        setWorkflows(workflowData.workflows);
      } catch (error) {
        console.error("Workflow fetch error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (accessToken) {
      fetchData();
    }
  }, [accessToken]);

  if (loading) {
    return (
      <div className="workflows-page">
        <h1>Workflows</h1>
        <p>Loading workflows...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workflows-page">
        <h1>Workflows</h1>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="workflows-page">
      <div className="workflows-header">
        <div>
          <h1>Workflows</h1>
          {business && <p>Manage workflows for <strong>{business.businessName}</strong></p>}
        </div>

        <button className="create-workflow-btn" onClick={() => navigate("/workflows/create")}>+ Create Workflow</button>
      </div>

      {workflows.length === 0 && (
        <div className="empty-workflows">
          <h2>No workflows yet</h2>
          <p>Create your first workflow to configure your AI receptionist.</p>
          <button onClick={() => navigate("/workflows/create")}>Create Workflow</button>
        </div>
      )}

      {workflows.length > 0 && (
        <div className="workflow-grid">
          {workflows.map((workflow) => (
            <div className="workflow-card" key={workflow._id}>
              <div className="workflow-card-header">
                <h2>{workflow.workflowName}</h2>
              </div>

              <div className="workflow-card-body">
                <p><strong>Trigger:</strong> {workflow.trigger}</p>
                <p><strong>Fields:</strong> {workflow.fields?.length || 0}</p>
                <p><strong>Action:</strong> {workflow.action || "Not configured"}</p>
                <p><strong>Conditions:</strong> {workflow.conditions?.length || 0}</p>
                <p><strong>Follow-up:</strong> {workflow.followUpStatus || "Pending"}</p>
              </div>

              <div className="workflow-card-actions">
                <button onClick={() => navigate(`/workflows/edit/${workflow._id}`)}>Edit</button>
                <button onClick={() => navigate(`/simulator/${workflow._id}`)}>Test Workflow</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Workflows;