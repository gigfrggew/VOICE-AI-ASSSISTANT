import express from "express";
import {
  GoogleAuthController,
  GoogleCallbackController,
  CheckAvailabilityController,
  CreateEventController,
  UpdateEventController,
  DeleteEventController,
} from "../controllers/CalendarController.js";
import AuthMiddleware from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.get("/auth", AuthMiddleware, GoogleAuthController);

router.get("/callback", AuthMiddleware, GoogleCallbackController);

router.post("/availability", AuthMiddleware, CheckAvailabilityController);

router.post("/event", AuthMiddleware, CreateEventController);

router.put("/event/:eventId", AuthMiddleware, UpdateEventController);

router.delete("/event/:eventId", AuthMiddleware, DeleteEventController);

export default router;