import { Router } from "express";
import {
  changePassword,
  getCurrentUser,
  loginUser,
  registerUser,
  updateProfile,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticate, getCurrentUser);
router.put("/profile", authenticate, updateProfile);
router.put("/change-password", authenticate, changePassword);

export default router;
