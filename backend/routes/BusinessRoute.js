import express from "express";
import AuthMiddleware from "../middleware/AuthMiddleware.js";
import {CreateBusinessController,GetBusinessController} from "../controllers/BusinessController.js";

const router = express.Router();

router.post("/", AuthMiddleware,CreateBusinessController);

router.get("/",AuthMiddleware,GetBusinessController)

export default router;