import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Workflow.css";
import API_URL from "../services/api";

function WorkflowBuilder() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [workflowName, setWorkflowName] = useState("");
  const [trigger, setTrigger] = useState("missed_call");
  const [greeting, setGreeting] = useState("");
  const [closingMessage, setClosingMessage] = useState("");
  const [action, setAction] = useState("");

  const [fields, setFields] = useState([
    {
      name: "",
      question: "",
      required: true,
    },
  ]);

  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addField() {
    setFields([
      ...fields,
      {
        name: "",
        question: "",
        required: false,
      },
    ]);
  }

  function removeField(index) {
    setFields(fields.filter((_, fieldIndex) => fieldIndex !== index));
  }

  function updateField(index, property, value) {
    const updatedFields = [...fields];
    updatedFields[index][property] = value;
    setFields(updatedFields);
  }

  function addCondition() {
    setConditions([
      ...conditions,
      {
        field: fields[0]?.name || "",
        operator: "equals",
        value: "",
        action: "",
      },
    ]);
  }

  function removeCondition(index) {
    setConditions(conditions.filter((_, conditionIndex) => conditionIndex !== index));
  }

  function updateCondition(index, property, value) {
    const updatedConditions = [...conditions];
    updatedConditions[index][property] = value;
    setConditions(updatedConditions);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      // Get business
      const businessResponse = await fetch(`${API_URL}/business`, {
        method: "GET",
        credentials: "include",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const businessData = await businessResponse.json();

      if (!businessResponse.ok) {
        throw new Error(businessData.message || "Failed to fetch business");
      }

      // Create workflow
      const response = await fetch(`${API_URL}/workflow`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          businessId: businessData.business.id,
          workflowName,
          trigger,
          greeting,
          fields,
          conditions,
          closingMessage,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create workflow");
      }

      navigate("/workflows");
    } catch (error) {
      console.error("Create workflow error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="workflow-builder">
      <div className="workflow-builder-header">
        <h1>Create Workflow</h1>
        <button type="button" onClick={() => navigate("/workflows")}>Back to Workflows</button>
      </div>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit}>
        {/* Workflow Name */}
        <div className="form-group">
          <label>Workflow Name</label>
          <input type="text" value={workflowName} onChange={(event) => setWorkflowName(event.target.value)} placeholder="Example: Cake Order" required />
        </div>

        {/* Trigger */}
        <div className="form-group">
          <label>Trigger</label>
          <select value={trigger} onChange={(event) => setTrigger(event.target.value)}>
            <option value="missed_call">Missed Call</option>
            <option value="customer_request">Customer Request</option>
          </select>
        </div>

        {/* Greeting */}
        <div className="form-group">
          <label>Greeting</label>
          <textarea value={greeting} onChange={(event) => setGreeting(event.target.value)} placeholder="Hello! Thank you for contacting us. How can I help you?" required />
        </div>

        {/* Information Fields */}
        <div className="fields-section">
          <h2>Information to Collect</h2>

          {fields.map((field, index) => (
            <div className="field-builder" key={index}>
              <h3>Field {index + 1}</h3>

              <div className="form-group">
                <label>Field Name</label>
                <input type="text" value={field.name} onChange={(event) => updateField(index, "name", event.target.value)} placeholder="customerName" required />
              </div>

              <div className="form-group">
                <label>Question</label>
                <input type="text" value={field.question} onChange={(event) => updateField(index, "question", event.target.value)} placeholder="May I have your name?" required />
              </div>

              <label><input type="checkbox" checked={field.required} onChange={(event) => updateField(index, "required", event.target.checked)} /> Required</label>

              {fields.length > 1 && <button type="button" onClick={() => removeField(index)}>Remove Field</button>}
            </div>
          ))}

          <button type="button" onClick={addField}>+ Add Field</button>
        </div>

        {/* Conditions */}
        <div className="conditions-section">
          <h2>Conditions</h2>
          <p>Define actions that should happen when captured information matches a condition.</p>

          {conditions.map((condition, index) => (
            <div className="condition-builder" key={index}>
              <h3>Condition {index + 1}</h3>

              {/* Field */}
              <div className="form-group">
                <label>Field</label>
                <select value={condition.field} onChange={(event) => updateCondition(index, "field", event.target.value)} required>
                  <option value="">Select field</option>
                  {fields.filter((field) => field.name.trim() !== "").map((field, fieldIndex) => (
                    <option key={fieldIndex} value={field.name}>{field.name}</option>
                  ))}
                </select>
              </div>

              {/* Operator */}
              <div className="form-group">
                <label>Operator</label>
                <select value={condition.operator} onChange={(event) => updateCondition(index, "operator", event.target.value)} required>
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not Equals</option>
                  <option value="contains">Contains</option>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                </select>
              </div>

              {/* Value */}
              <div className="form-group">
                <label>Value</label>
                <input type="text" value={condition.value} onChange={(event) => updateCondition(index, "value", event.target.value)} placeholder="Example: tomorrow" required />
              </div>

              {/* Action */}
              <div className="form-group">
                <label>Action</label>
                <input type="text" value={condition.action} onChange={(event) => updateCondition(index, "action", event.target.value)} placeholder="Example: urgent" required />
              </div>

              <button type="button" onClick={() => removeCondition(index)}>Remove Condition</button>
            </div>
          ))}

          <button type="button" onClick={addCondition}>+ Add Condition</button>
        </div>

        {/* Closing Message */}
        <div className="form-group">
          <label>Closing Message</label>
          <textarea value={closingMessage} onChange={(event) => setClosingMessage(event.target.value)} placeholder="Thank you. We will contact you shortly." required />
        </div>

        {/* Action */}
        <div className="form-group">
          <label>Action After Collection</label>
          <input type="text" value={action} onChange={(event) => setAction(event.target.value)} placeholder="create_order_enquiry" required />
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Workflow"}</button>
      </form>
    </div>
  );
}

export default WorkflowBuilder;