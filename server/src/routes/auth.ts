import { Router } from "express";
import { loginSchema, signupSchema, changePasswordSchema } from "../validation/schemas";
import { authenticate, signup, changePassword } from "../services/auth";
import { signToken, revokeToken } from "../lib/auth";
import { audit } from "../lib/audit";
import { authMiddleware } from "../middleware/auth";
import { AppError } from "../lib/errors";
import { wrap } from "../lib/asyncHandler";

const router = Router();

router.post(
  "/signup",
  wrap(async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const user = await signup(parsed.data.username, parsed.data.password);
    audit("signup", { username: user.username });
    const token = signToken(user);
    res.status(201).json({ token, user: { username: user.username, role: user.role } });
  }),
);

router.post(
  "/login",
  wrap(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const user = await authenticate(parsed.data.username, parsed.data.password);
    if (!user) {
      audit("login_failure", { username: parsed.data.username });
      throw new AppError("Invalid username or password", 401);
    }
    audit("login_success", { username: user.username });
    const token = signToken(user);
    res.json({ token, user: { username: user.username, role: user.role } });
  }),
);

router.post(
  "/change-password",
  authMiddleware,
  wrap(async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    await changePassword(req.user!.username, parsed.data.currentPassword, parsed.data.newPassword);
    audit("password_change", { username: req.user!.username });
    res.json({ success: true });
  }),
);

router.post(
  "/logout",
  wrap(async (req, res) => {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      revokeToken(header.slice("Bearer ".length).trim());
    }
    audit("logout");
    res.json({ success: true });
  }),
);

export default router;
