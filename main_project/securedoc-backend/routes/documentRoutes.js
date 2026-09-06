import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { loadDocument, loadAnyDocument, requireRole } from "../middleware/roleMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  listDocuments, createDocument, createTextDocument, getDocument, renameDocument,
  deleteDocument, downloadDocument, editDocumentContent,
  listAccess, shareDocument, revokeAccess,
  listTrash, restoreFromTrash, permanentlyDelete,
} from "../controllers/documentController.js";
import versionRoutes from "./versionRoutes.js";

const router = Router();

router.use(protect); // every route below requires a valid JWT

router.get("/", listDocuments);
router.get("/trash", listTrash);
router.post("/", upload.single("file"), createDocument);
router.post("/text", createTextDocument);

router.get("/:id", loadDocument, getDocument);
router.patch("/:id", loadDocument, requireRole("Owner", "Editor"), editDocumentContent);
router.patch("/:id/rename", loadDocument, requireRole("Owner"), renameDocument);
router.delete("/:id", loadDocument, requireRole("Owner"), deleteDocument);
router.get("/:id/download", loadDocument, downloadDocument);

router.get("/:id/access", loadDocument, listAccess);
router.post("/:id/share", loadDocument, requireRole("Owner"), shareDocument);
router.delete("/:id/collaborators/:userId", loadDocument, requireRole("Owner"), revokeAccess);

router.use("/:id/versions", loadDocument, versionRoutes);

router.post("/:id/restore", loadAnyDocument, requireRole("Owner"), restoreFromTrash);
router.delete("/:id/permanent", loadAnyDocument, requireRole("Owner"), permanentlyDelete);

export default router;
