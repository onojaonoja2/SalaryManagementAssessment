import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const TOKEN_TTL = process.env.JWT_TTL ?? "30m";
const AUDIENCE = "salary-mgmt-api";
const ISSUER = "acme-salary-mgmt";

// Revoked token IDs (in-memory; resets on restart — fine for single-instance demo).
// For multi-instance deployments this would be a shared store (e.g. Redis).
const revokedJtis = new Set<string>();

export type AuthUser = { username: string; role: "hr" };

// Fail fast in production if the JWT signing secret is missing. HR login
// credentials are now per-user (stored in the DB) and are NOT required in env.
export function validateAuthConfig(): void {
  if (process.env.NODE_ENV === "production" && !JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in production");
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

export function signToken(user: AuthUser): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ sub: user.username, role: user.role, jti: randomUUID() }, JWT_SECRET, {
    expiresIn: TOKEN_TTL as jwt.SignOptions["expiresIn"],
    audience: AUDIENCE,
    issuer: ISSUER,
  });
}

export function verifyToken(token: string): AuthUser | null {
  if (!JWT_SECRET) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      audience: AUDIENCE,
      issuer: ISSUER,
    }) as { sub?: string; role?: string; jti?: string };
    if (!payload.sub || payload.role !== "hr") return null;
    if (payload.jti && revokedJtis.has(payload.jti)) return null;
    return { username: payload.sub, role: "hr" };
  } catch {
    return null;
  }
}

// Invalidate a token by its jti (used on logout).
export function revokeToken(token: string): void {
  try {
    const payload = jwt.decode(token) as { jti?: string } | null;
    if (payload?.jti) revokedJtis.add(payload.jti);
  } catch {
    /* ignore malformed tokens */
  }
}
