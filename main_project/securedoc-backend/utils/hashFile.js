import crypto from "crypto";
import fs from "fs";

// Hash arbitrary text content (used for in-browser edited documents).
export function hashContent(content) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

// Hash a buffer already in memory (used for freshly uploaded files, which
// now arrive via multer's memory storage rather than sitting on disk first).
export function hashBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// Hash a file on disk (legacy path, kept in case anything still needs it).
export function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}