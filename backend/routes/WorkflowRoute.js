import express from "express";
import AuthMiddleware from "../middleware/AuthMiddleware.js";
import { CreateWorkflowController, GetWorkflowController, GetSingleWorkflowController, UpdateWorkflowController } from "../controllers/WorkflowController.js";

const router = express.Router();

router.post("/", AuthMiddleware, CreateWorkflowController);
router.get("/", AuthMiddleware, GetWorkflowController);
router.get("/:workflowId", AuthMiddleware, GetSingleWorkflowController);
router.put("/:workflowId", AuthMiddleware, UpdateWorkflowController);

export default router;