import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API_URL from "../services/api";
import "../styles/Conversations.css";

function Conversations() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [conversations, setConversations] = useState([]);
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

        const conversationResponse = await fetch(`${API_URL}/conversation?businessId=${businessData.business.id}`, {
          method: "GET",
          credentials: "include",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const conversationData = await conversationResponse.json();

        if (!conversationResponse.ok) {
          throw new Error(conversationData.message || "Failed to fetch conversations");
        }

        setConversations(conversationData.conversations || []);
      } catch (error) {
        console.error("Conversation fetch error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (accessToken) {
      fetchData();
    }
  }, [accessToken]);

  async function updateStatus(conversationId, status) {
    try {
      const response = await fetch(`${API_URL}/conversation/${conversationId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update conversation");
      }

      setConversations((previousConversations) =>
        previousConversations.map((conversation) =>
          conversation._id === conversationId
            ? { ...conversation, status: data.conversation.status }
            : conversation
        )
      );
    } catch (error) {
      console.error("Status update error:", error);
      setError(error.message);
    }
  }

  if (loading) {
    return (
      <div className="conversations-page">
        <h1>Conversations</h1>
        <p>Loading conversations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="conversations-page">
        <h1>Conversations</h1>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="conversations-page">
      <div className="conversations-header">
        <div>
          <h1>Customer Conversations</h1>
          {business && <p>Manage conversations for <strong>{business.businessName}</strong></p>}
        </div>
        <button className="back-btn" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>

      {conversations.length === 0 && (
        <div className="empty-conversations">
          <h2>No conversations yet</h2>
          <p>Customer conversations will appear here.</p>
        </div>
      )}

      {conversations.length > 0 && (
        <div className="conversation-grid">
          {conversations.map((conversation) => (
            <div className="conversation-card" key={conversation._id}>
              <div className="conversation-card-header">
                <h2>{conversation.callerName || "Unknown Customer"}</h2>
                <span className="status-badge">{conversation.status || "in_progress"}</span>
              </div>

              <div className="conversation-card-body">
                <p><strong>Phone:</strong> {conversation.callerPhone || "Not provided"}</p>
                <p><strong>Intent:</strong> {conversation.intent || "Not detected"}</p>
                <p><strong>Action:</strong> {conversation.action || "Not triggered"}</p>
                <p><strong>Urgency:</strong> {conversation.urgency || "Not specified"}</p>
                <p><strong>Follow-up:</strong> {conversation.followUpStatus || "Pending"}</p>
                <p><strong>Workflow ID:</strong> {conversation.workflow || "Unknown"}</p>
                <p><strong>Created:</strong> {conversation.createdAt ? new Date(conversation.createdAt).toLocaleString() : "Not available"}</p>

                <div className="conversation-section">
                  <h3>Update Status</h3>
                  <div className="status-actions">
                    <button onClick={() => updateStatus(conversation._id, "contacted")}>Contacted</button>
                    <button onClick={() => updateStatus(conversation._id, "completed")}>Completed</button>
                    <button onClick={() => updateStatus(conversation._id, "closed")}>Closed</button>
                  </div>
                </div>

                <div className="conversation-section">
                  <h3>Summary</h3>
                  <p>{conversation.summary || "No summary available."}</p>
                </div>

                <div className="conversation-section">
                  <h3>Information Collected</h3>
                  {conversation.capturedData && Object.keys(conversation.capturedData).length > 0 ? (
                    Object.entries(conversation.capturedData).map(([key, value]) => (
                      <p key={key}><strong>{key}:</strong> {String(value)}</p>
                    ))
                  ) : (
                    <p>No information collected.</p>
                  )}
                </div>

                <div className="conversation-section">
                  <h3>Transcript</h3>
                  {conversation.transcript?.length > 0 ? (
                    conversation.transcript.map((message, index) => (
                      <div className="transcript-message" key={message._id || index}>
                        <strong>{message.role === "assistant" ? "AI Assistant:" : "Customer:"}</strong>
                        <span>{message.message}</span>
                      </div>
                    ))
                  ) : (
                    <p>No transcript available.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Conversations;