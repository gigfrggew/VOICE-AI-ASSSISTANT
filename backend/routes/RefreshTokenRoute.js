import Router from "express";
import RefreshTokenController from "../controllers/RefreshTokenController.js";

const router = Router();

router.post("/", RefreshTokenController);

export default router;