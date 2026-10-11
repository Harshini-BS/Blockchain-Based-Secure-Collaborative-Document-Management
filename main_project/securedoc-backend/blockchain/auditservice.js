import "dotenv/config";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";

const artifactPath = path.resolve(
  "artifacts/contracts/AuditTrail.sol/AuditTrail.json"
);

const artifact = JSON.parse(
  fs.readFileSync(artifactPath, "utf8")
);

const provider = new ethers.JsonRpcProvider(
  "http://127.0.0.1:8545"
);

const signer = await provider.getSigner(0);

const contract = new ethers.Contract(
  process.env.AUDIT_CONTRACT_ADDRESS,
  artifact.abi,
  signer
);

// Record an audit event on the blockchain
export async function recordAudit(documentId, action, userId) {
  const tx = await contract.recordAudit(
    String(documentId),
    String(action),
    String(userId)
  );

  await tx.wait();

  return tx.hash;
}

// Retrieve audit history for a specific document
export async function getAuditHistory(documentId) {
  const count = await contract.getAuditCount();
  const items = [];

  for (let i = 0; i < Number(count); i++) {
    const entry = await contract.getAudit(i);

    const entryDocumentId = entry[0];

    if (entryDocumentId === String(documentId)) {
      items.push({
        documentId: entry[0],
        title: entry[1],
        userId: entry[2],
        time: new Date(
          Number(entry[3]) * 1000
        ).toLocaleString(),
        tx: "On-chain audit record",
      });
    }
  }

  return items.reverse();
}
