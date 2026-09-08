import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Workflows from "./pages/Workflows.jsx";
import WorkflowBuilder from "./pages/WorkflowBuilder.jsx";
import EditWorkflow from "./pages/EditWorkflow.jsx";
import ConversationSimulator from "./pages/ConversationSimulator.jsx";
import Conversations from "./pages/Conversations.jsx";
import Signup from "./pages/Signup.jsx";
import BusinessSetup from "./pages/BusinessSetup.jsx";
import CustomerDashboard from "./pages/CustomerDashboard.jsx";
import VoiceRecorder from "./pages/VoiceRecorder.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/workflows/create" element={<WorkflowBuilder />} />
        <Route path="/workflows/edit/:workflowId" element={<EditWorkflow />} />
        <Route path="/simulator/:workflowId" element={<ConversationSimulator />} />
        <Route path="/conversations" element={<Conversations />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/business-setup" element={<BusinessSetup />} />
        <Route path="/customer-dashboard" element={<CustomerDashboard />} />
        <Route path="/customer-conversation/:businessId/:workflowId" element={<ConversationSimulator />} />
        <Route path="/voice-recorder" element={<VoiceRecorder />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;