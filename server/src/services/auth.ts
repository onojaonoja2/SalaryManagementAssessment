import { prisma } from "../lib/prisma";
import { AppError } from "../lib/errors";
import { hashPassword, verifyPassword, type AuthUser } from "../lib/auth";

export async function signup(email: string, password: string): Promise<AuthUser> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("An account with this email already exists", 409);
  const user = await prisma.user.create({
    data: { email, passwordHash: hashPassword(password), role: "hr" },
  });
  return { email: user.email, role: "hr" };
}

export async function authenticate(email: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return { email: user.email, role: "hr" };
}

export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError("User not found", 404);
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    throw new AppError("Current password is incorrect", 401);
  }
  await prisma.user.update({
    where: { email },
    data: { passwordHash: hashPassword(newPassword) },
  });
}
