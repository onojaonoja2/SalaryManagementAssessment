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
    const user = await signup(parsed.data.email, parsed.data.password);
    audit("signup", { email: user.email });
    const token = signToken(user);
    res.status(201).json({ token, user: { email: user.email, role: user.role } });
  }),
);

router.post(
  "/login",
  wrap(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const user = await authenticate(parsed.data.email, parsed.data.password);
    if (!user) {
      audit("login_failure", { email: parsed.data.email });
      throw new AppError("Invalid email or password", 401);
    }
    audit("login_success", { email: user.email });
    const token = signToken(user);
    res.json({ token, user: { email: user.email, role: user.role } });
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
    await changePassword(req.user!.email, parsed.data.currentPassword, parsed.data.newPassword);
    audit("password_change", { email: req.user!.email });
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
