import Router from "express"
import SignUpController from "../controllers/SignUpController.js";

const router=Router();

router.post("/",SignUpController)

export default router;