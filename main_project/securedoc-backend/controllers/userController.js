import bcrypt from "bcryptjs";
import User from "../models/User.js";

// GET /api/users/me
export async function getProfile(req, res) {
  res.json(req.user.toSafeJSON());
}

// PATCH /api/users/me  { name, password? }
export async function updateProfile(req, res) {
  const { name, password } = req.body;
  if (name?.trim()) req.user.name = name.trim();
  if (password) {
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
    req.user.passwordHash = await bcrypt.hash(password, 12);
  }
  await req.user.save();
  res.json(req.user.toSafeJSON());
}
