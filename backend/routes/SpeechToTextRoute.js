import express from "express";
import { SpeechToTextController } from "../controllers/SpeechToTextController.js";
import AuthMiddleware from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post(
  "/speech-to-text",
  AuthMiddleware,
  express.raw({ type: "audio/*", limit: "25mb" }),
  SpeechToTextController
);

export default router;