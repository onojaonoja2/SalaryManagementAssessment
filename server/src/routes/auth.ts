import { Router } from "express";
import { loginSchema } from "../validation/schemas";
import { verifyCredentials, signToken } from "../lib/auth";
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
      throw new AppError("Invalid username or password", 401);
    }
    const token = signToken(user);
    res.json({ token, user: { username: user.username, role: user.role } });
  }),
);

export default router;
