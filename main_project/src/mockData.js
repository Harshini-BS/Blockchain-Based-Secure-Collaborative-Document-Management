// Placeholder data so the UI is fully browsable before the backend exists.
// Every shape here matches the API contract in API_CONTRACT.md — when the
// real endpoints are ready, api/client.js swaps this out with real fetches.

export const currentUser = { id: "u1", name: "Harshini R", role: "Owner", initials: "HR" };

export const stats = [
  { label: "Total Documents", value: 24, delta: "+12 this month", glyph: "📁", color: "#6366f1" },
  { label: "Total Collaborators", value: 18, delta: "+8 this month", glyph: "👥", color: "#22d3ee" },
  { label: "Total Versions", value: 47, delta: "+19 this month", glyph: "🧱", color: "#fbbf24" },
  { label: "Total Views", value: 352, delta: "+120 this month", glyph: "👁", color: "#a78bfa" },
];

export const documents = [
  { id: "d1", name: "Project Proposal.pdf", owner: "Harshini R", modified: "2 mins ago", status: "Encrypted" },
  { id: "d2", name: "Research Paper.docx", owner: "Harshini R", modified: "1 hour ago", status: "Encrypted" },
  { id: "d3", name: "Budget Sheet.xlsx", owner: "Arun K", modified: "3 hours ago", status: "Encrypted" },
  { id: "d4", name: "Meeting Notes.md", owner: "Harshini R", modified: "5 hours ago", status: "Encrypted" },
  { id: "d5", name: "Design Document.pdf", owner: "Vishal P", modified: "1 day ago", status: "Encrypted" },
];

export const activeDocument = {
  id: "d1",
  name: "Project Proposal.pdf",
  page: 1,
  totalPages: 10,
  wordCount: 2450,
  title: "Project Proposal",
  subtitle: "Secure Document Management System",
  body: [
    { type: "h2", text: "1. Introduction" },
    {
      type: "p",
      text: "This project aims to develop a secure and decentralized document management system using blockchain technology. It ensures data integrity, access control, and enables",
      highlight: "real-time collaboration",
      after: "among authorized users.",
    },
    { type: "h2", text: "2. Objectives" },
    {
      type: "list",
      items: [
        "Secure document storage using encryption",
        "Version control and history tracking",
        "Role-based access control",
        "Blockchain for transparency and audit",
      ],
    },
  ],
};

export const collaborators = [
  { id: "u1", name: "Harshini R", role: "Owner", initials: "HR" },
  { id: "u2", name: "Arun K", role: "Editor", initials: "AK" },
  { id: "u3", name: "Vishal P", role: "Editor", initials: "VP" },
  { id: "u4", name: "Kavya M", role: "Viewer", initials: "KM" },
];

export const liveActivity = [
  { who: "Arun K", action: "edited a section", time: "2 mins ago" },
  { who: "Vishal P", action: "added a comment", time: "5 mins ago" },
  { who: "Kavya M", action: "viewed the document", time: "10 mins ago" },
];

export const versions = [
  { version: "4.0", current: true, date: "15 May 2024, 10:30 AM", by: "Harshini R" },
  { version: "3.0", current: false, date: "15 May 2024, 09:15 AM", by: "Arun K" },
  { version: "2.0", current: false, date: "14 May 2024, 04:20 PM", by: "Vishal P" },
  { version: "1.0", current: false, date: "13 May 2024, 11:10 AM", by: "Harshini R" },
];

export const accessList = [
  { name: "Harshini R", email: "owner", role: "Owner" },
  { name: "Arun K", email: "arun.k@example.com", role: "Editor" },
  { name: "Vishal P", email: "vishal.p@example.com", role: "Editor" },
  { name: "Kavya M", email: "kavya.m@example.com", role: "Viewer" },
];

export const auditTrail = [
  { title: "Document Uploaded", time: "15 May 2024, 10:20 AM", tx: "0x8bf3a...b21e" },
  { title: "Version 4.0 Created", time: "15 May 2024, 10:30 AM", tx: "0x7ac1...d91f" },
  { title: "Access Granted", time: "15 May 2024, 10:35 AM", tx: "0x9b2d...a71c" },
  { title: "Document Viewed", time: "15 May 2024, 10:40 AM", tx: "0x3f6e...c42b" },
];

export const features = [
  { title: "End-to-End Encryption", desc: "Documents are encrypted using AES-256 before storage.", glyph: "🔒", color: "#6366f1" },
  { title: "Decentralized Storage", desc: "Encrypted files are stored on IPFS for reliability.", glyph: "🧊", color: "#22d3ee" },
  { title: "Blockchain Integrity", desc: "All document activity is recorded on-chain.", glyph: "⛓", color: "#a78bfa" },
  { title: "Real-time Collaboration", desc: "Collaborate live with your team, securely.", glyph: "👥", color: "#34d399" },
  { title: "Access Control", desc: "Granular role-based permissions per document.", glyph: "🛡", color: "#fbbf24" },
];
