import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

// --- Risk-based login policy ---
// Normal user → normal access.
// A few failed attempts → warn (still lets them try, but flags rising risk).
// Too many failed attempts → risk crosses the line → account is restricted
// (locked) for a cooldown period, same shape as the diagram you sketched.
const WARN_AFTER_ATTEMPTS = 3;   // "risk increases" stage — warn, don't block yet
const MAX_FAILED_ATTEMPTS = 5;   // "restrict / lock" stage
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function initials(name) {
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      avatarInitials: initials(name),
    });

    const token = generateToken(user);
    res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minsLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return res.status(423).json({ message: `Account locked. Try again in ${minsLeft} min.` });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        // Risk crossed the threshold — restrict the account.
        user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
        user.failedLoginAttempts = 0;
        await user.save();
        return res.status(423).json({
          message: "Too many failed attempts. This looks like suspicious activity — your account is locked for 15 minutes.",
          riskLevel: "restricted",
        });
      }

      await user.save();

      if (user.failedLoginAttempts >= WARN_AFTER_ATTEMPTS) {
        const remaining = MAX_FAILED_ATTEMPTS - user.failedLoginAttempts;
        return res.status(401).json({
          message: `Incorrect password. ${remaining} attempt${remaining === 1 ? "" : "s"} left before your account is temporarily locked.`,
          riskLevel: "suspicious",
        });
      }

      return res.status(401).json({ message: "Invalid email or password", riskLevel: "normal" });
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    const token = generateToken(user);
    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
}
