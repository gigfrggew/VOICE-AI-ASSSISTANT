import express from "express";
import AuthMiddleware from "../middleware/AuthMiddleware.js";
import { CreateConversationController, GetConversationController, UpdateConversationController } from "../controllers/ConversationController.js";

const router = express.Router();

router.post("/", AuthMiddleware, CreateConversationController);
router.get("/", AuthMiddleware, GetConversationController);
router.put("/:conversationId", AuthMiddleware, UpdateConversationController);

export default router;