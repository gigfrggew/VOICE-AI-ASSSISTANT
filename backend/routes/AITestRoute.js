import express from "express";
import AITestController from "../controllers/AITestController.js";

const router = express.Router();

router.get("/", AITestController);

export default router;