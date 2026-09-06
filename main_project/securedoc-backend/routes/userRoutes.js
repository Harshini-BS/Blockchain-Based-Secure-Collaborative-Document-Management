import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getProfile, updateProfile } from "../controllers/userController.js";

const router = Router();

router.use(protect);
router.get("/me", getProfile);
router.patch("/me", updateProfile);

export default router;
