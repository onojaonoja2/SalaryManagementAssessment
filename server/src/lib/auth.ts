import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

const AUDIENCE = "salary-mgmt-api";
const ISSUER = "acme-salary-mgmt";

// Revoked token IDs (in-memory; resets on restart — fine for single-instance demo).
// For multi-instance deployments this would be a shared store (e.g. Redis).
const revokedJtis = new Set<string>();

// The configured HR password hash. Computed lazily on first use (not at module
// load) so that dotenv has already populated process.env by the time it runs.
let HR_PASSWORD_HASH: string | null | undefined;
function getPasswordHash(): string | null {
  if (HR_PASSWORD_HASH !== undefined) return HR_PASSWORD_HASH;
  const pw = process.env.HR_PASSWORD ?? "";
  HR_PASSWORD_HASH = pw ? bcrypt.hashSync(pw, 10) : null;
  return HR_PASSWORD_HASH;
}

export type AuthUser = { username: string; role: "hr" };

// Fail fast in production if required secrets are missing. Read from process.env
// at call time (after dotenv loads), never from a captured module-level constant.
export function validateAuthConfig(): void {
  if (process.env.NODE_ENV === "production") {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET must be set in production");
    if (!process.env.HR_PASSWORD) throw new Error("HR_PASSWORD must be set in production");
  }
}

export function verifyCredentials(username: string, password: string): AuthUser | null {
  const expectedUser = process.env.HR_USERNAME ?? "hrmanager";
  if (username !== expectedUser) return null;
  const hash = getPasswordHash();
  if (!hash) return null;
  if (!bcrypt.compareSync(password, hash)) return null;
  return { username, role: "hr" };
}

export function signToken(user: AuthUser): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ sub: user.username, role: user.role, jti: randomUUID() }, secret, {
    expiresIn: (process.env.JWT_TTL ?? "30m") as jwt.SignOptions["expiresIn"],
    audience: AUDIENCE,
    issuer: ISSUER,
  });
}

export function verifyToken(token: string): AuthUser | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const payload = jwt.verify(token, secret, {
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
