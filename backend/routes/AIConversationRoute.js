import express from "express";
import AIConversationController from "../controllers/AIConversationController.js";
import AuthMiddleware from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/", AuthMiddleware, AIConversationController);

export default router;