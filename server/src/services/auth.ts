import { prisma } from "../lib/prisma";
import { AppError } from "../lib/errors";
import { hashPassword, verifyPassword, type AuthUser } from "../lib/auth";

export async function signup(username: string, password: string): Promise<AuthUser> {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) throw new AppError("Username already taken", 409);
  const user = await prisma.user.create({
    data: { username, passwordHash: hashPassword(password), role: "hr" },
  });
  return { username: user.username, role: "hr" };
}

export async function authenticate(username: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return { username: user.username, role: "hr" };
}

export async function changePassword(
  username: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new AppError("User not found", 404);
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    throw new AppError("Current password is incorrect", 401);
  }
  await prisma.user.update({
    where: { username },
    data: { passwordHash: hashPassword(newPassword) },
  });
}
