import express from "express";
import LogoutController from "../controllers/LogoutController.js";

const router = express.Router();

router.post("/", LogoutController);

export default router;