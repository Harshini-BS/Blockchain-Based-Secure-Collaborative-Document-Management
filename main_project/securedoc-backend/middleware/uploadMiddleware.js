import multer from "multer";

// Memory storage — we need the raw buffer in the controller to both (a) hash
// it, and (b) attempt text extraction (docx/pdf) BEFORE anything is written
// to disk. The controller encrypts it and writes it out itself.
const storage = multer.memoryStorage();

export const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });