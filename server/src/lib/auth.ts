import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const HR_USERNAME = process.env.HR_USERNAME ?? "hrmanager";
const HR_PLAIN_PASSWORD = process.env.HR_PASSWORD ?? "hr@2026!";
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me-in-production";
const TOKEN_TTL = "8h";

// Hash the configured HR password once at boot so we never compare plaintext secrets.
const HR_PASSWORD_HASH = bcrypt.hashSync(HR_PLAIN_PASSWORD, 10);

export type AuthUser = { username: string; role: "hr" };

export function verifyCredentials(username: string, password: string): AuthUser | null {
  if (username !== HR_USERNAME) return null;
  if (!bcrypt.compareSync(password, HR_PASSWORD_HASH)) return null;
  return { username, role: "hr" };
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ sub: user.username, role: user.role }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string; role?: string };
    if (payload.sub && payload.role === "hr") {
      return { username: payload.sub, role: "hr" };
    }
    return null;
  } catch {
    return null;
  }
}
