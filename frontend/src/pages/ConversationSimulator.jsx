import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Workflow.css";
import API_URL from "../services/api";
import "../styles/Simulator.css";

function ConversationSimulator() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const { workflowId } = useParams();

  const [workflow, setWorkflow] = useState(null);
  const [business, setBusiness] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [capturedData, setCapturedData] = useState({});
  const [status, setStatus] = useState("in_progress");
  const [action, setAction] = useState("");
  const [followUpStatus, setFollowUpStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchWorkflow() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/workflow/${workflowId}`, {
          method: "GET",
          credentials: "include",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch workflow");
        }

        setWorkflow(data.workflow);

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

        setMessages([
          {
            role: "assistant",
            message: data.workflow.greeting,
          },
        ]);
      } catch (error) {
        console.error("Simulator fetch error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (accessToken && workflowId) {
      fetchWorkflow();
    }
  }, [accessToken, workflowId]);

  async function sendMessage(event) {
    event.preventDefault();

    if (!userMessage.trim() || sending || !workflow || !business) {
      return;
    }

    const currentMessage = userMessage.trim();

    setUserMessage("");
    setSending(true);
    setError("");

    setMessages((previousMessages) => [
      ...previousMessages,
      {
        role: "user",
        message: currentMessage,
      },
    ]);

    try {
      const response = await fetch(`${API_URL}/ai-conversation`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          businessId: business.id,
          workflowId: workflowId,
          conversationId: conversationId,
          userMessage: currentMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      if (!conversationId) {
        setConversationId(data.conversationId);
      }

      setMessages(data.transcript || []);
      setCapturedData(data.capturedData || {});
      setStatus(data.status || "in_progress");
      setAction(data.action || "");
      setFollowUpStatus(data.followUpStatus || "pending");
    } catch (error) {
      console.error("Send message error:", error);
      setError(error.message);
    } finally {
      setSending(false);
    }
  }

  function resetConversation() {
    setConversationId(null);
    setCapturedData({});
    setStatus("in_progress");
    setAction("");
    setFollowUpStatus("pending");
    setError("");

    setMessages([
      {
        role: "assistant",
        message: workflow?.greeting || "",
      },
    ]);
  }

  if (loading) {
    return (
      <div className="workflow-builder">
        <h1>Conversation Simulator</h1>
        <p>Loading workflow...</p>
      </div>
    );
  }

  if (error && !workflow) {
    return (
      <div className="workflow-builder">
        <h1>Conversation Simulator</h1>
        <p className="error-message">{error}</p>
        <button type="button" onClick={() => navigate("/workflows")}>Back to Workflows</button>
      </div>
    );
  }

  return (
    <div className="simulator-page">
      <div className="simulator-header">
        <div>
          <h1>Conversation Simulator</h1>
          <p>Testing workflow: <strong>{workflow.workflowName}</strong></p>
        </div>

        <button type="button" onClick={() => navigate("/workflows")}>Back to Workflows</button>
      </div>

      <div className="simulator-layout">
        <div className="chat-section">
          <div className="chat-header">
            <h2>AI Receptionist</h2>
            <span className={`conversation-status ${status}`}>{status}</span>
          </div>

          <div className="chat-messages">
            {messages.map((message, index) => (
              <div className={`chat-message ${message.role}`} key={message._id || index}>
                <div className="message-label">{message.role === "user" ? "You" : "AI Assistant"}</div>
                <div className="message-content">{message.message}</div>
              </div>
            ))}

            {sending && (
              <div className="chat-message assistant">
                <div className="message-label">AI Assistant</div>
                <div className="message-content">Thinking...</div>
              </div>
            )}
          </div>

          {error && <p className="error-message">{error}</p>}

          <form className="chat-input-area" onSubmit={sendMessage}>
            <input type="text" value={userMessage} onChange={(event) => setUserMessage(event.target.value)} placeholder="Type your message..." disabled={sending} />
            <button type="submit" disabled={sending || !userMessage.trim()}>{sending ? "Sending..." : "Send"}</button>
          </form>

          <button className="reset-conversation-btn" type="button" onClick={resetConversation}>Reset Conversation</button>
        </div>

        <div className="simulator-info">
          <div className="info-card">
            <h2>Workflow Information</h2>
            <p><strong>Name:</strong> {workflow.workflowName}</p>
            <p><strong>Trigger:</strong> {workflow.trigger}</p>
            <p><strong>Action:</strong> {workflow.action}</p>
          </div>

          <div className="info-card">
            <h2>Information Collected</h2>

            {Object.keys(capturedData).length === 0 ? (
              <p>No information collected yet.</p>
            ) : (
              Object.entries(capturedData).map(([key, value]) => (
                <p key={key}><strong>{key}:</strong> {String(value)}</p>
              ))
            )}
          </div>

          <div className="info-card">
            <h2>Conversation Status</h2>
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Action:</strong> {action || "Not triggered"}</p>
            <p><strong>Follow-up:</strong> {followUpStatus}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConversationSimulator;