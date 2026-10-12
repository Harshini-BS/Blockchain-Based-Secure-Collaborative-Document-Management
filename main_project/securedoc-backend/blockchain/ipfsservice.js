
import { CID } from "multiformats/cid";
import { createHelia } from "helia";
import { unixfs } from "@helia/unixfs";
import { FsBlockstore } from "blockstore-fs";
import { FsDatastore } from "datastore-fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve persistent storage paths relative to this file.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blockstorePath = path.resolve(__dirname, "../ipfs-blocks");
const datastorePath = path.resolve(__dirname, "../ipfs-data");

console.log("[IPFS] Blockstore path:", blockstorePath);
console.log("[IPFS] Datastore path:", datastorePath);

// Persistent local IPFS storage.
const blockstore = new FsBlockstore(blockstorePath);
const datastore = new FsDatastore(datastorePath);

const helia = await createHelia({
  blockstore,
  datastore,
});

const fs = unixfs(helia);

// Upload encrypted file data to IPFS.
export async function uploadToIPFS(buffer) {
  try {
    const cid = await fs.addBytes(buffer);
    const cidString = cid.toString();

    console.log("[IPFS] Uploaded CID:", cidString);
    console.log("[IPFS] Uploaded bytes:", buffer.length);

    return cidString;
  } catch (error) {
    console.error("[IPFS] Upload failed:", error.message);
    throw error;
  }
}

// Retrieve encrypted file data using its CID.
export async function getFromIPFS(cidString) {
  console.log("[IPFS] Retrieving CID:", cidString);

  try {
    const cid = CID.parse(cidString);
    const chunks = [];

    for await (const chunk of fs.cat(cid)) {
      chunks.push(Buffer.from(chunk));
    }

    const buffer = Buffer.concat(chunks);

    if (buffer.length === 0) {
      throw new Error("IPFS returned an empty file");
    }

    console.log("[IPFS] Retrieved bytes:", buffer.length);

    return buffer;
  } catch (error) {
    console.error("[IPFS] Retrieval failed:", error.message);
    throw error;
  }
}
