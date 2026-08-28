import { Router } from "express";
import { loginSchema } from "../validation/schemas";
import { verifyCredentials, signToken, revokeToken } from "../lib/auth";
import { audit } from "../lib/audit";
import { AppError } from "../lib/errors";
import { wrap } from "../lib/asyncHandler";

const router = Router();

router.post(
  "/login",
  wrap((req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const user = verifyCredentials(parsed.data.username, parsed.data.password);
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
  "/logout",
  wrap((req, res) => {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      revokeToken(header.slice("Bearer ".length).trim());
    }
    audit("logout");
    res.json({ success: true });
  }),
);

export default router;
