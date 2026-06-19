import { Router } from "express";
import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticate, getCurrentUser);

export default router;
