import { Router } from "express";
import { requireRole } from "../middleware/roleMiddleware.js";
import { listVersions, restoreVersion } from "../controllers/versionController.js";

const router = Router({ mergeParams: true });

router.get("/", listVersions); // any role with document access can view history
router.post("/:versionNo/restore", requireRole("Owner", "Editor"), restoreVersion);

export default router;
