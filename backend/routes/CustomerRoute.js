import express from "express";
import AuthMiddleware from "../middleware/AuthMiddleware.js";

import {
  FindBusinessController,
  GetCustomerWorkflowController,
} from "../controllers/CustomerController.js";

const router = express.Router();

router.post(
  "/find-business",
  AuthMiddleware,
  FindBusinessController
);

router.get(
  "/business/:businessId/workflow/:workflowId",
  AuthMiddleware,
  GetCustomerWorkflowController
);

export default router;