import { Router } from "express";
import {
  addAddress,
  deleteAddress,
  updateAddress,
} from "../controllers/address.controller";
import {
  changePassword,
  getCurrentUser,
  loginUser,
  registerUser,
  updateProfile,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticate, getCurrentUser);
router.put("/profile", authenticate, updateProfile);
router.put("/change-password", authenticate, changePassword);
router.post("/addresses", authenticate, addAddress);
router.put("/addresses/:addressId", authenticate, updateAddress);
router.delete("/addresses/:addressId", authenticate, deleteAddress);
router.get(
  "/admin-check",
  authenticate,
  authorizeRoles("admin"),
  (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin access granted",
    });
  }
);

export default router;
