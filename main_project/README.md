# SecureDoc Frontend

React + Vite. Covers Login/Register, Dashboard, document list/upload,
document viewer/editor, version history UI, and profile — everything talks
to `securedoc-backend` through `src/api/client.js`.

## Setup

```bash
cd securedoc-frontend
npm install
npm run dev       # http://localhost:5173
```

By default the app runs on **mock data** (`USE_MOCKS = true` in
`src/api/client.js` and `src/context/AuthContext.jsx` calls those mocked
functions) so you can build/demo the UI with no backend running. Once your
backend is up on port 4000:

1. Set `USE_MOCKS = false` in `src/api/client.js`.
2. `npm run dev` — Vite proxies `/api/*` to `http://localhost:4000` (see `vite.config.js`).

## Folder structure

```
src/
  api/
    client.js          REST calls — the contract your backend implements
    socket.js            Socket.IO client (teammate's real-time module)
  context/
    AuthContext.jsx      login state, token, current user
  routes/
    AppRoutes.jsx         route table + protected-route guard
  pages/
    Login/Login.jsx
    Register/Register.jsx
    Dashboard/Dashboard.jsx     wraps the dashboard UI below
    Profile/Profile.jsx
  components/            dashboard building blocks (Sidebar, DocumentEditor, etc.)
  mockData.js             placeholder data matching the API shapes exactly
```

## Auth

`AuthProvider` stores the JWT + user in `localStorage` (`sd_token`,
`sd_user`) and exposes `login`, `register`, `logout`, `user`. `AppRoutes`
redirects to `/login` if there's no user, and to `/dashboard` once there is.

## What's still a stub

- `src/api/socket.js` connects to `ws://localhost:4000` but your teammate
  still needs to build the actual Socket.IO server (`doc:join`, `doc:edit`,
  `doc:activity`, `access:changed` events — documented in that file).
- Blockchain audit trail (`AuditTrail.jsx`) and IPFS storage are rendered
  from mock data until the blockchain module is wired in.
