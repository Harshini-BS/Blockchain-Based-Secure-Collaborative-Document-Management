# SecureDoc Backend

Node/Express + MongoDB API covering **Document Management**, **Version Control**
(SHA-256 fingerprinting), and **Authentication & Access** (JWT, bcrypt,
Owner/Editor/Viewer roles).

Not in this module — your teammate's part: blockchain audit logging
(Solidity/Hardhat), IPFS pinning, Socket.IO real-time collaboration server,
and suspicious-activity-based dynamic access control.

## Setup

```bash
cd securedoc-backend
npm install
cp .env.example .env      # then edit MONGO_URI / JWT_SECRET
npm run dev                # nodemon, restarts on save
```

Requires a running MongoDB instance (local `mongod`, or a free Atlas cluster
— just paste its connection string into `MONGO_URI`).

## Folder structure

```
config/db.js              MongoDB connection
models/                   User, Document, Version (Mongoose schemas)
middleware/
  authMiddleware.js        verifies JWT -> req.user
  roleMiddleware.js         loads a document + resolves Owner/Editor/Viewer -> req.docRole
  uploadMiddleware.js       multer disk storage config
controllers/               request handlers, one file per resource
routes/                    route tables, one file per resource
utils/
  generateToken.js          JWT sign helper
  hashFile.js                SHA-256 for files and text content
server.js                  app entrypoint
```

## Auth flow

1. `POST /api/auth/register` — bcrypt-hashes the password (cost 12), returns a JWT.
2. `POST /api/auth/login` — 5 failed attempts locks the account for 15 minutes
   (this is the hook point for your teammate's "suspicious activity" module —
   see the comment in `authController.js`).
3. Every other route sends `Authorization: Bearer <token>`.

## Roles

Roles are **per document**, not global — `Document.owner` is always Owner;
`Document.collaborators[]` holds `{ user, role: "Editor" | "Viewer" }`.
`roleMiddleware.loadDocument` resolves this into `req.docRole`, and
`requireRole("Owner", "Editor")` gates a route by it.

## Version control

Every edit or upload creates a **new** `Version` document rather than
overwriting the current one — `sha256Hash` fingerprints the content,
`Document.currentVersion` points at whichever version is "live". Restoring an
old version doesn't delete history; it copies the old content into a brand
new version number, so V1→V4 always stays intact.

## API reference

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| POST | `/api/auth/register` | – | – | Create account |
| POST | `/api/auth/login` | – | – | Get JWT |
| GET | `/api/users/me` | ✓ | – | Current profile |
| PATCH | `/api/users/me` | ✓ | – | Update name/password |
| GET | `/api/documents` | ✓ | any | List your documents |
| POST | `/api/documents` | ✓ | – | Upload file, creates doc + v1 |
| GET | `/api/documents/:id` | ✓ | any | Get doc + current version |
| PATCH | `/api/documents/:id` | ✓ | Owner/Editor | Save edit → new version |
| PATCH | `/api/documents/:id/rename` | ✓ | Owner/Editor | Rename |
| DELETE | `/api/documents/:id` | ✓ | Owner | Soft-delete |
| GET | `/api/documents/:id/download` | ✓ | any | Download current file |
| GET | `/api/documents/:id/access` | ✓ | any | List people with access |
| POST | `/api/documents/:id/share` | ✓ | Owner | Add collaborator |
| DELETE | `/api/documents/:id/collaborators/:userId` | ✓ | Owner | Revoke access |
| GET | `/api/documents/:id/versions` | ✓ | any | Version history |
| POST | `/api/documents/:id/versions/:versionNo/restore` | ✓ | Owner/Editor | Restore old version |

This matches `securedoc-frontend/src/api/client.js` exactly — flip
`USE_MOCKS` to `false` there once this server is running on port 4000.
