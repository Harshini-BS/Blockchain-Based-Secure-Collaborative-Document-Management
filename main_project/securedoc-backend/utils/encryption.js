import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

function getKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY is missing or invalid in .env — it must be a 64-character hex string (32 bytes). " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(keyHex, "hex");
}

// Encrypts a Buffer (file bytes or UTF-8 text) with AES-256-CBC.
// Returns the ciphertext and the random IV used, so it can be decrypted later.
export function encryptBuffer(buffer) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { encrypted, iv: iv.toString("hex") };
}

export function decryptBuffer(encryptedBuffer, ivHex) {
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}

export function encryptText(text) {
  const { encrypted, iv } = encryptBuffer(Buffer.from(text ?? "", "utf8"));
  return { encrypted: encrypted.toString("base64"), iv };
}

export function decryptText(base64Ciphertext, ivHex) {
  if (!base64Ciphertext) return "";
  return decryptBuffer(Buffer.from(base64Ciphertext, "base64"), ivHex).toString("utf8");
}