import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { User } from "@shared/schema";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = await storage.getUserByEmail(email);
  if (!user || !user.passwordHash) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }
  
  await storage.updateUser(user.id, { lastLoginAt: new Date() });
  return user;
}

export async function createUserWithPassword(
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string,
  role: "community_member" | "participant" | "mentor" | "facilitator" | "admin" | "superadmin" = "participant",
  mustChangePassword = false
): Promise<User> {
  const passwordHash = await hashPassword(password);
  return storage.createUser({
    email,
    passwordHash,
    firstName,
    lastName,
    role,
    isActive: true,
    mustChangePassword,
  });
}

export async function seedSuperAdmin(): Promise<void> {
  const existingAdmin = await storage.getUserByEmail("admin@afaraaccelerator.org");

  // One-time emergency password reset: if RESET_SUPERADMIN_PASSWORD is set,
  // overwrite the superadmin's password on startup then log a reminder to remove the var.
  const resetPassword = process.env.RESET_SUPERADMIN_PASSWORD;
  if (resetPassword && existingAdmin) {
    const passwordHash = await hashPassword(resetPassword);
    await storage.updateUser(existingAdmin.id, { passwordHash, mustChangePassword: true });
    console.log("Superadmin password has been reset via RESET_SUPERADMIN_PASSWORD env var. Please remove this variable after logging in.");
    return;
  }

  if (existingAdmin) {
    console.log("Super admin already exists");
    return;
  }

  const { randomBytes } = await import("crypto");
  const initialPassword = randomBytes(24).toString("base64");
  const passwordHash = await hashPassword(initialPassword);
  await storage.createUser({
    email: "admin@afaraaccelerator.org",
    passwordHash,
    firstName: "Super",
    lastName: "Admin",
    role: "superadmin",
    isActive: true,
    mustChangePassword: true,
  });
  console.log(`Super admin created: admin@afaraaccelerator.org (temporary password printed once)`);
  console.log(`Temporary super-admin password: ${initialPassword}`);
}
