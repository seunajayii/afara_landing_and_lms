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
  role: "community_member" | "participant" | "mentor" | "facilitator" | "admin" | "superadmin" = "participant"
): Promise<User> {
  const passwordHash = await hashPassword(password);
  return storage.createUser({
    email,
    passwordHash,
    firstName,
    lastName,
    role,
    isActive: true
  });
}

export async function seedSuperAdmin(): Promise<void> {
  const existingAdmin = await storage.getUserByEmail("admin@afaraaccelerator.org");
  if (existingAdmin) {
    if (existingAdmin.role !== "superadmin") {
      await storage.updateUser(existingAdmin.id, { role: "superadmin" });
      console.log("Updated existing admin to superadmin role");
    } else {
      console.log("Super admin already exists");
    }
    return;
  }
  
  const passwordHash = await hashPassword("Admin123!");
  await storage.createUser({
    email: "admin@afaraaccelerator.org",
    passwordHash,
    firstName: "Super",
    lastName: "Admin",
    role: "superadmin",
    isActive: true
  });
  console.log("Super admin created: admin@afaraaccelerator.org");
}
