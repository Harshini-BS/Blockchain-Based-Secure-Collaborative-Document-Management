import { CID } from "multiformats/cid";
import { createHelia } from "helia";
import { unixfs } from "@helia/unixfs";

const helia = await createHelia();
const fs = unixfs(helia);

export async function uploadToIPFS(buffer) {
  const cid = await fs.addBytes(buffer);

  return cid.toString();
}
export async function getFromIPFS(cidString) {
  const cid = CID.parse(cidString);
  const chunks = [];

  for await (const chunk of fs.cat(cid)) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}