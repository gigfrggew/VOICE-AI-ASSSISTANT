import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Workflows from "./pages/Workflows";
import WorkflowBuilder from "./pages/WorkflowBuilder";
import EditWorkflow from "./pages/EditWorkflow";
import ConversationSimulator from "./pages/ConversationSimulator";
import Conversations from "./pages/Conversations";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workflows"element={<Workflows />}/>
        <Route path="/workflows/create" element={<WorkflowBuilder />} />
        <Route path="/workflows/edit/:workflowId" element={<EditWorkflow />} />
        <Route path="/simulator/:workflowId" element={<ConversationSimulator />} />
        <Route path="/conversations" element={<Conversations />} />

        <Route path="*"element={<Navigate to="/login" replace />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;