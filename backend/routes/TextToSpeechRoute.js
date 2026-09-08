import express from "express";

import {
  TextToSpeechController,
} from "../controllers/TextToSpeechController.js";

import AuthMiddleware from "../middleware/AuthMiddleware.js";

const router = express.Router();


router.post(
  "/text-to-speech",
  AuthMiddleware,
  TextToSpeechController
);


export default router;