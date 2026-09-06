import mammoth from "mammoth";
import { createRequire } from "module";

// pdf-parse ships as CommonJS; this is the standard way to import a CJS
// package from an ESM file in Node.
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PDF_MIME = "application/pdf";

// Given an uploaded file's mimetype/extension and its raw bytes, try to pull
// out editable text/HTML. Returns null if the format isn't one we know how
// to extract (images, zips, etc. just stay as pure encrypted binary blobs).
export async function extractEditableContent(file) {
  const ext = (file.originalname.split(".").pop() || "").toLowerCase();

  try {
    if (file.mimetype === DOCX_MIME || ext === "docx") {
      const { value: html } = await mammoth.convertToHtml({ buffer: file.buffer });
      return html || "<p><em>(empty document)</em></p>";
    }

    if (file.mimetype === PDF_MIME || ext === "pdf") {
      const parser = new pdfParse.PDFParse({ data: file.buffer });
      const { text } = await parser.getText();
      await parser.destroy();
      const paragraphs = text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter((p) => p && !/^--\s*\d+\s*of\s*\d+\s*--$/.test(p)) // strip pdf-parse's page-separator lines
        .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
        .join("\n");
      return paragraphs || "<p><em>(no extractable text — this PDF may be scanned images)</em></p>";
    }
  } catch (err) {
    console.warn(`[extractEditableContent] Couldn't extract from ${file.originalname}:`, err.message);
    return null; // fall back to binary-only, no editing — better than crashing the upload
  }

  return null; // unsupported format for extraction
}