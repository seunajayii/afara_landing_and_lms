import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { authenticateUser, createUserWithPassword } from "./auth";
import { 
  insertUserSchema, insertProfileSchema, insertMentorProfileSchema, insertFacilitatorProfileSchema,
  insertCourseSchema, insertModuleSchema, insertLessonSchema, insertEnrollmentSchema,
  insertMentorshipRequestSchema, insertMentorshipSessionSchema,
  insertEventSchema, insertEventRegistrationSchema, insertResourceSchema,
  insertDiscussionThreadSchema, insertDiscussionPostSchema, insertCertificateSchema,
  insertNotificationSchema, insertApplicationSchema
} from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check endpoint for Railway/production monitoring
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth Routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await authenticateUser(email, password);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ error: "Account is deactivated" });
      }
      
      req.session.userId = user.id;
      req.session.userRole = user.role;
      
      const { passwordHash, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      const user = await createUserWithPassword(email, password, firstName, lastName, "participant");
      
      // Only auto-login the new user if no one is currently logged in
      // (avoids overwriting an admin's session when they create users)
      if (!req.session.userId) {
        req.session.userId = user.id;
        req.session.userRole = user.role;
      }
      
      const { passwordHash, ...safeUser } = user;
      res.status(201).json({ user: safeUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }
      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      // Always respond success to avoid user enumeration
      if (!user || !user.isActive) {
        return res.json({ success: true });
      }
      const { randomBytes } = await import("crypto");
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await storage.updateUser(user.id, {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      } as any);
      const baseUrl = req.headers.origin || `${req.protocol}://${req.get("host")}`;
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;
      const { sendPasswordResetEmail } = await import("./email");
      await sendPasswordResetEmail(user.email, user.firstName, resetUrl);
      res.json({ success: true });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      if (!token || !password || typeof token !== "string" || typeof password !== "string") {
        return res.status(400).json({ error: "Token and password are required" });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      const user = await storage.getUserByResetToken(token);
      if (!user || !user.passwordResetExpiresAt) {
        return res.status(400).json({ error: "Invalid or expired reset link" });
      }
      if (new Date() > new Date(user.passwordResetExpiresAt)) {
        return res.status(400).json({ error: "This reset link has expired. Please request a new one." });
      }
      const { hashPassword } = await import("./auth");
      const passwordHash = await hashPassword(password);
      await storage.updateUser(user.id, {
        passwordHash,
        mustChangePassword: false,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      } as any);
      res.json({ success: true });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.post("/api/auth/change-password", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const { newPassword } = req.body;
      if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters" });
      }
      const { hashPassword } = await import("./auth");
      const passwordHash = await hashPassword(newPassword);
      const updated = await storage.updateUser(req.session.userId, {
        passwordHash,
        mustChangePassword: false,
      });
      if (!updated) return res.status(404).json({ error: "User not found" });
      const { passwordHash: _ph, ...safeUser } = updated;
      res.json({ user: safeUser });
    } catch (error) {
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "User not found" });
    }
    
    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  // --- Auth middleware helpers ---
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  };

  const requireAdminRole = (req: Request, res: Response, next: NextFunction) => {
    const role = req.session?.userRole;
    if (!role || (role !== "admin" && role !== "superadmin")) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  };

  const requireSuperAdminRole = (req: Request, res: Response, next: NextFunction) => {
    const role = req.session?.userRole;
    if (role !== "superadmin") {
      return res.status(403).json({ error: "Super admin access required" });
    }
    next();
  };

  // Visibility filter helper
  const canAccessVisibility = (visibility: string | null, userRole: string | null): boolean => {
    const v = visibility || "community";
    if (v === "public") return true;
    if (v === "community") return userRole !== null;
    if (v === "cohort_only") return userRole !== null && userRole !== "community_member";
    return true;
  };

  app.get("/api/users", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/users/role/:role", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsersByRole(req.params.role);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users by role" });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Admin-only endpoint: create a team member (mentor/facilitator/admin) with role set immediately
  // and send a welcome email containing login credentials.
  app.post("/api/admin/users", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        role: z.enum(["community_member", "participant", "mentor", "facilitator", "admin", "superadmin"]),
      });
      const { email, password, firstName, lastName, role } = schema.parse(req.body);

      const existing = await storage.getUserByEmail(email.toLowerCase().trim());
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const teamRoles = ["mentor", "facilitator", "admin", "superadmin"];
      const user = await createUserWithPassword(
        email.toLowerCase().trim(),
        password,
        firstName,
        lastName,
        role,
        teamRoles.includes(role) // mustChangePassword = true for team members
      );

      // Send welcome email with credentials for team roles (fire-and-forget)
      if (teamRoles.includes(role)) {
        import("./email").then(({ sendTeamWelcomeEmail }) => {
          sendTeamWelcomeEmail(user.email, firstName, role, password).catch(err => {
            console.error("Team welcome email failed:", err);
          });
        }).catch(err => console.error("Failed to import email module:", err));
      }

      const { passwordHash, ...safeUser } = user;
      res.status(201).json({ user: safeUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.post("/api/users/:id/reset-password", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { hashPassword } = await import("./auth");
      const DEFAULT_PASSWORD = "Admin123!";
      const passwordHash = await hashPassword(DEFAULT_PASSWORD);
      // Always enforce password change on next login when an admin resets a password
      const user = await storage.updateUser(req.params.id, { passwordHash, mustChangePassword: true });
      if (!user) return res.status(404).json({ error: "User not found" });
      // Send notification email so the user knows to expect the forced change
      try {
        const { sendAdminPasswordResetNotificationEmail } = await import("./email");
        const baseUrl = req.headers.origin || `${req.protocol}://${req.get("host")}`;
        await sendAdminPasswordResetNotificationEmail(user.email, user.firstName, `${baseUrl}/login`);
      } catch (emailErr) {
        console.error("Failed to send password reset notification email:", emailErr);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireSuperAdminRole, async (req: Request, res: Response) => {
    try {
      if (req.params.id === req.session.userId) {
        return res.status(400).json({ error: "You cannot delete your own account" });
      }
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      await storage.deleteUser(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (error) {
      console.error("DELETE /api/users/:id error:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.get("/api/profiles/:userId", async (req: Request, res: Response) => {
    try {
      const profile = await storage.getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/profiles", async (req: Request, res: Response) => {
    try {
      const data = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(data);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  app.patch("/api/profiles/:userId", async (req: Request, res: Response) => {
    try {
      const profile = await storage.updateProfile(req.params.userId, req.body);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/mentors", async (req: Request, res: Response) => {
    try {
      const mentors = await storage.getAllMentors();
      res.json(mentors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentors" });
    }
  });

  app.get("/api/mentors/:userId", async (req: Request, res: Response) => {
    try {
      const mentorProfile = await storage.getMentorProfile(req.params.userId);
      if (!mentorProfile) return res.status(404).json({ error: "Mentor profile not found" });
      const user = await storage.getUser(req.params.userId);
      const profile = await storage.getProfile(req.params.userId);
      res.json({ ...user, mentorProfile, profile });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentor" });
    }
  });

  app.post("/api/mentors", async (req: Request, res: Response) => {
    try {
      const data = insertMentorProfileSchema.parse(req.body);
      const mentorProfile = await storage.createMentorProfile(data);
      res.status(201).json(mentorProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create mentor profile" });
    }
  });

  app.patch("/api/mentors/:userId", async (req: Request, res: Response) => {
    try {
      const mentorProfile = await storage.updateMentorProfile(req.params.userId, req.body);
      if (!mentorProfile) return res.status(404).json({ error: "Mentor profile not found" });
      res.json(mentorProfile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update mentor profile" });
    }
  });

  app.get("/api/facilitators", async (req: Request, res: Response) => {
    try {
      const facilitators = await storage.getAllFacilitators();
      res.json(facilitators);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch facilitators" });
    }
  });

  app.get("/api/facilitators/:userId", async (req: Request, res: Response) => {
    try {
      const facilitatorProfile = await storage.getFacilitatorProfile(req.params.userId);
      if (!facilitatorProfile) return res.status(404).json({ error: "Facilitator profile not found" });
      const user = await storage.getUser(req.params.userId);
      const profile = await storage.getProfile(req.params.userId);
      res.json({ ...user, facilitatorProfile, profile });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch facilitator" });
    }
  });

  app.post("/api/facilitators", async (req: Request, res: Response) => {
    try {
      const data = insertFacilitatorProfileSchema.parse(req.body);
      const facilitatorProfile = await storage.createFacilitatorProfile(data);
      res.status(201).json(facilitatorProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create facilitator profile" });
    }
  });

  app.patch("/api/facilitators/:userId", async (req: Request, res: Response) => {
    try {
      const facilitatorProfile = await storage.updateFacilitatorProfile(req.params.userId, req.body);
      if (!facilitatorProfile) return res.status(404).json({ error: "Facilitator profile not found" });
      res.json(facilitatorProfile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update facilitator profile" });
    }
  });

  app.get("/api/courses", async (req: Request, res: Response) => {
    try {
      const courses = req.query.published === "true" 
        ? await storage.getPublishedCourses()
        : await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req: Request, res: Response) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) return res.status(404).json({ error: "Course not found" });
      const courseModules = await storage.getModulesByCourse(req.params.id);
      const modulesWithLessons = await Promise.all(
        courseModules.map(async (module) => {
          const moduleLessons = await storage.getLessonsByModule(module.id);
          return { ...module, lessons: moduleLessons };
        })
      );
      res.json({ ...course, modules: modulesWithLessons });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", async (req: Request, res: Response) => {
    try {
      const data = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(data);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  app.patch("/api/courses/:id", async (req: Request, res: Response) => {
    try {
      const course = await storage.updateCourse(req.params.id, req.body);
      if (!course) return res.status(404).json({ error: "Course not found" });
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteCourse(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  app.get("/api/courses/:courseId/modules", async (req: Request, res: Response) => {
    try {
      const courseModules = await storage.getModulesByCourse(req.params.courseId);
      res.json(courseModules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  app.post("/api/modules", async (req: Request, res: Response) => {
    try {
      const data = insertModuleSchema.parse(req.body);
      const module = await storage.createModule(data);
      res.status(201).json(module);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create module" });
    }
  });

  app.patch("/api/modules/:id", async (req: Request, res: Response) => {
    try {
      const module = await storage.updateModule(req.params.id, req.body);
      if (!module) return res.status(404).json({ error: "Module not found" });
      res.json(module);
    } catch (error) {
      res.status(500).json({ error: "Failed to update module" });
    }
  });

  app.delete("/api/modules/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteModule(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete module" });
    }
  });

  app.get("/api/modules/:moduleId/lessons", async (req: Request, res: Response) => {
    try {
      const moduleLessons = await storage.getLessonsByModule(req.params.moduleId);
      res.json(moduleLessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.get("/api/lessons/:id", async (req: Request, res: Response) => {
    try {
      const lesson = await storage.getLesson(req.params.id);
      if (!lesson) return res.status(404).json({ error: "Lesson not found" });
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  app.post("/api/lessons", async (req: Request, res: Response) => {
    try {
      const data = insertLessonSchema.parse(req.body);
      const lesson = await storage.createLesson(data);
      res.status(201).json(lesson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });

  app.patch("/api/lessons/:id", async (req: Request, res: Response) => {
    try {
      const lesson = await storage.updateLesson(req.params.id, req.body);
      if (!lesson) return res.status(404).json({ error: "Lesson not found" });
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lesson" });
    }
  });

  app.delete("/api/lessons/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteLesson(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });

  app.get("/api/enrollments/user/:userId", async (req: Request, res: Response) => {
    try {
      const userEnrollments = await storage.getEnrollmentsByUser(req.params.userId);
      const enrollmentsWithCourses = await Promise.all(
        userEnrollments.map(async (enrollment) => {
          const course = await storage.getCourse(enrollment.courseId);
          return { ...enrollment, course };
        })
      );
      res.json(enrollmentsWithCourses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.get("/api/enrollments/course/:courseId", async (req: Request, res: Response) => {
    try {
      const courseEnrollments = await storage.getEnrollmentsByCourse(req.params.courseId);
      res.json(courseEnrollments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", async (req: Request, res: Response) => {
    try {
      const data = insertEnrollmentSchema.parse(req.body);
      const existing = await storage.getEnrollment(data.userId, data.courseId);
      if (existing) {
        return res.status(400).json({ error: "Already enrolled in this course" });
      }
      const enrollment = await storage.createEnrollment(data);
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create enrollment" });
    }
  });

  app.patch("/api/enrollments/:id", async (req: Request, res: Response) => {
    try {
      const enrollment = await storage.updateEnrollment(req.params.id, req.body);
      if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update enrollment" });
    }
  });

  app.get("/api/progress/user/:userId", async (req: Request, res: Response) => {
    try {
      const progress = await storage.getLessonProgressByUser(req.params.userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post("/api/progress", async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const existing = await storage.getLessonProgress(data.userId, data.lessonId);
      if (existing) {
        const updated = await storage.updateLessonProgress(existing.id, data);
        return res.json(updated);
      }
      const progress = await storage.createLessonProgress(data);
      res.status(201).json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  app.get("/api/mentorship/requests/mentee/:menteeId", async (req: Request, res: Response) => {
    try {
      const requests = await storage.getMentorshipRequestsByMentee(req.params.menteeId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentorship requests" });
    }
  });

  app.get("/api/mentorship/requests/mentor/:mentorId", async (req: Request, res: Response) => {
    try {
      const requests = await storage.getMentorshipRequestsByMentor(req.params.mentorId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentorship requests" });
    }
  });

  app.post("/api/mentorship/requests", async (req: Request, res: Response) => {
    try {
      const data = insertMentorshipRequestSchema.parse(req.body);
      const request = await storage.createMentorshipRequest(data);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create mentorship request" });
    }
  });

  app.patch("/api/mentorship/requests/:id", async (req: Request, res: Response) => {
    try {
      const request = await storage.updateMentorshipRequest(req.params.id, req.body);
      if (!request) return res.status(404).json({ error: "Request not found" });
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to update mentorship request" });
    }
  });

  app.get("/api/mentorship/sessions/mentor/:mentorId", async (req: Request, res: Response) => {
    try {
      const sessions = await storage.getMentorshipSessionsByMentor(req.params.mentorId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentorship sessions" });
    }
  });

  app.get("/api/mentorship/sessions/mentee/:menteeId", async (req: Request, res: Response) => {
    try {
      const sessions = await storage.getMentorshipSessionsByMentee(req.params.menteeId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentorship sessions" });
    }
  });

  app.post("/api/mentorship/sessions", async (req: Request, res: Response) => {
    try {
      const data = insertMentorshipSessionSchema.parse(req.body);
      const session = await storage.createMentorshipSession(data);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create mentorship session" });
    }
  });

  app.patch("/api/mentorship/sessions/:id", async (req: Request, res: Response) => {
    try {
      const session = await storage.updateMentorshipSession(req.params.id, req.body);
      if (!session) return res.status(404).json({ error: "Session not found" });
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to update mentorship session" });
    }
  });

  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const allEvents = req.query.upcoming === "true"
        ? await storage.getUpcomingEvents()
        : await storage.getAllEvents();
      const userRole = (req.session?.userRole as string) || null;
      const isAdminUser = userRole === "admin" || userRole === "superadmin";
      const visibleEvents = isAdminUser
        ? allEvents
        : allEvents.filter(e => canAccessVisibility(e.visibility, userRole));
      res.json(visibleEvents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      const userRole = (req.session?.userRole as string) || null;
      const isAdminUser = userRole === "admin" || userRole === "superadmin";
      if (!isAdminUser && !canAccessVisibility(event.visibility, userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const registrations = await storage.getEventRegistrationsByEvent(req.params.id);
      res.json({ ...event, registrations });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      // Convert datetime-local strings to Date objects
      const body = { ...req.body };
      if (body.startTime && typeof body.startTime === 'string') {
        body.startTime = new Date(body.startTime);
      }
      if (body.endTime && typeof body.endTime === 'string') {
        body.endTime = new Date(body.endTime);
      }
      
      const data = insertEventSchema.parse(body);
      const event = await storage.createEvent(data);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.patch("/api/events/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      // Convert datetime-local strings to Date objects
      const body = { ...req.body };
      if (body.startTime && typeof body.startTime === 'string') {
        body.startTime = new Date(body.startTime);
      }
      if (body.endTime && typeof body.endTime === 'string') {
        body.endTime = new Date(body.endTime);
      }
      
      const event = await storage.updateEvent(req.params.id, body);
      if (!event) return res.status(404).json({ error: "Event not found" });
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      await storage.deleteEvent(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  app.get("/api/events/:eventId/registrations", async (req: Request, res: Response) => {
    try {
      const registrations = await storage.getEventRegistrationsByEvent(req.params.eventId);
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  app.get("/api/registrations/user/:userId", async (req: Request, res: Response) => {
    try {
      const registrations = await storage.getEventRegistrationsByUser(req.params.userId);
      const registrationsWithEvents = await Promise.all(
        registrations.map(async (reg) => {
          const event = await storage.getEvent(reg.eventId);
          return { ...reg, event };
        })
      );
      res.json(registrationsWithEvents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  app.post("/api/events/:eventId/register", async (req: Request, res: Response) => {
    try {
      const data = { eventId: req.params.eventId, userId: req.body.userId };
      const existing = await storage.getEventRegistration(data.userId, data.eventId);
      if (existing) {
        return res.status(400).json({ error: "Already registered for this event" });
      }
      const registration = await storage.createEventRegistration(data);
      res.status(201).json(registration);
    } catch (error) {
      res.status(500).json({ error: "Failed to register for event" });
    }
  });

  app.get("/api/resources", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const allResources = category
        ? await storage.getResourcesByCategory(category)
        : await storage.getAllResources();
      const userRole = (req.session?.userRole as string) || null;
      const isAdminUser = userRole === "admin" || userRole === "superadmin";
      const visibleResources = isAdminUser
        ? allResources
        : allResources.filter(r =>
            r.status === "published" && canAccessVisibility(r.visibility, userRole)
          );
      res.json(visibleResources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });

  app.get("/api/resources/:id", async (req: Request, res: Response) => {
    try {
      const resource = await storage.getResource(req.params.id);
      if (!resource) return res.status(404).json({ error: "Resource not found" });
      const userRole = (req.session?.userRole as string) || null;
      const isAdminUser = userRole === "admin" || userRole === "superadmin";
      if (!isAdminUser && !canAccessVisibility(resource.visibility, userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(resource);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resource" });
    }
  });

  // Resource file upload
  const resourceUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB
  });

  app.post(
    "/api/resources/upload",
    requireAuth,
    requireAdminRole,
    (req: Request, res: Response, next: NextFunction) => {
      resourceUpload.single("file")(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File exceeds 4 MB limit. Please upload a smaller file." });
        }
        if (err) {
          return res.status(400).json({ error: err.message || "Upload error" });
        }
        next();
      });
    },
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file provided" });
        }

        const { isR2Configured, uploadFile } = await import("./r2-storage");
        const originalName = req.file.originalname || "file";
        const ext = originalName.includes(".") ? originalName.split(".").pop()! : "bin";
        const { randomUUID } = await import("crypto");
        const key = `resources/${randomUUID()}.${ext}`;

        let fileUrl: string;
        if (isR2Configured()) {
          const result = await uploadFile(key, req.file.buffer, req.file.mimetype, true);
          fileUrl = result.url;
        } else {
          const base64 = req.file.buffer.toString("base64");
          fileUrl = `data:${req.file.mimetype};base64,${base64}`;
        }

        res.json({
          fileUrl,
          fileName: originalName,
          fileSize: req.file.size,
          contentType: req.file.mimetype,
        });
      } catch (error) {
        console.error("Resource upload error:", error);
        res.status(500).json({ error: "Failed to upload file" });
      }
    }
  );

  app.post("/api/resources", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const data = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(data);
      res.status(201).json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create resource" });
    }
  });

  app.patch("/api/resources/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const resource = await storage.updateResource(req.params.id, req.body);
      if (!resource) return res.status(404).json({ error: "Resource not found" });
      res.json(resource);
    } catch (error) {
      res.status(500).json({ error: "Failed to update resource" });
    }
  });

  app.delete("/api/resources/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      await storage.deleteResource(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete resource" });
    }
  });

  app.post("/api/resources/:id/download", async (req: Request, res: Response) => {
    try {
      const resource = await storage.getResource(req.params.id);
      if (!resource) return res.status(404).json({ error: "Resource not found" });
      
      // Check visibility: admins bypass; others must have access based on visibility
      const userRole = req.session?.userRole || null;
      if (userRole !== "admin" && userRole !== "superadmin") {
        if (!canAccessVisibility(resource.visibility, userRole)) {
          return res.status(403).json({ error: "Access denied: cohort members only" });
        }
      }
      
      await storage.incrementResourceDownload(req.params.id);
      res.json(resource);
    } catch (error) {
      res.status(500).json({ error: "Failed to track download" });
    }
  });

  // Return only safe public fields for author objects in community API responses
  type SafeAuthor = { id: string; firstName: string; lastName: string; profileImageUrl: string | null } | undefined;
  function toPublicAuthor(user: { id: string; firstName: string; lastName: string; profileImageUrl?: string | null; [k: string]: unknown } | undefined | null): SafeAuthor {
    if (!user) return undefined;
    return { id: user.id, firstName: user.firstName, lastName: user.lastName, profileImageUrl: user.profileImageUrl ?? null };
  }

  app.get("/api/community/threads", requireAuth, async (req: Request, res: Response) => {
    try {
      const threads = await storage.getAllDiscussionThreads();
      const threadsWithAuthors = await Promise.all(
        threads.map(async (thread) => {
          const author = await storage.getUser(thread.authorId);
          return { ...thread, author: toPublicAuthor(author) };
        })
      );
      res.json(threadsWithAuthors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch threads" });
    }
  });

  app.get("/api/community/threads/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const thread = await storage.getDiscussionThread(req.params.id);
      if (!thread) return res.status(404).json({ error: "Thread not found" });
      await storage.incrementThreadView(req.params.id);
      const author = await storage.getUser(thread.authorId);
      const posts = await storage.getDiscussionPostsByThread(req.params.id);
      const postsWithAuthors = await Promise.all(
        posts.map(async (post) => {
          const postAuthor = await storage.getUser(post.authorId);
          return { ...post, author: toPublicAuthor(postAuthor) };
        })
      );
      res.json({ ...thread, author: toPublicAuthor(author), posts: postsWithAuthors });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch thread" });
    }
  });

  app.post("/api/community/threads", requireAuth, async (req: Request, res: Response) => {
    try {
      // Explicitly whitelist allowed creation fields; moderation fields are always server-defaulted
      const data = insertDiscussionThreadSchema.parse({
        title: req.body.title,
        content: req.body.content,
        category: req.body.category,
        attachmentJson: req.body.attachmentJson,
        authorId: req.session.userId,
        isPinned: false,
        isLocked: false,
        viewCount: 0,
        replyCount: 0,
      });
      const thread = await storage.createDiscussionThread(data);

      // Send individual email notifications (per-recipient to avoid PII leakage)
      try {
        const participants = await storage.getUsersByRole("participant");
        const communityMembers = await storage.getUsersByRole("community_member");
        const recipients = [...participants, ...communityMembers]
          .filter(u => u.id !== req.session.userId && u.email);
        if (recipients.length > 0) {
          const { getResendClient } = await import("./email");
          const { client, fromEmail } = await getResendClient();
          const author = await storage.getUser(req.session.userId!);
          const authorName = author ? `${author.firstName} ${author.lastName}` : "A community member";
          const subject = `New Discussion: ${thread.title}`;
          const excerpt = thread.content
            ? thread.content.slice(0, 200) + (thread.content.length > 200 ? "…" : "")
            : "";
          const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#166534;">New Community Discussion</h2>
            <p><strong>${authorName}</strong> started a new discussion:</p>
            <h3 style="color:#166534;">${thread.title}</h3>
            ${excerpt ? `<p style="color:#555;">${excerpt}</p>` : ""}
            <p><a href="https://afaraaccelerator.org/lms/community/${thread.id}" style="color:#166534;">Join the discussion &rarr;</a></p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
            <p style="font-size:12px;color:#6b7280;">AFÁRÁ is an initiative of Open Spaces &amp; Bridges Advisory (OPSB)</p>
          </div>`;
          // Send individually to prevent PII leakage; throttle at 2 sends/sec to respect provider limits
          const BATCH_DELAY_MS = 500;
          for (let i = 0; i < recipients.length; i++) {
            try {
              await client.emails.send({ from: fromEmail, to: recipients[i].email, subject, html });
            } catch (singleErr) {
              console.error(`Failed to notify ${recipients[i].email}:`, singleErr);
            }
            if (i < recipients.length - 1) {
              await new Promise<void>((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
            }
          }
        }
      } catch (emailErr) {
        console.error("Failed to send thread notification emails:", emailErr);
      }

      res.status(201).json(thread);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create thread" });
    }
  });

  app.patch("/api/community/threads/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const role = req.session?.userRole;
      const isAdminUser = role === "admin" || role === "superadmin";
      const thread = await storage.getDiscussionThread(req.params.id);
      if (!thread) return res.status(404).json({ error: "Thread not found" });
      if (!isAdminUser && thread.authorId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized to edit this thread" });
      }

      // Non-admins (even owners) cannot touch moderation fields
      const { isPinned, isLocked, ...contentFields } = req.body;
      const patch: Record<string, unknown> = { ...contentFields };
      if (isAdminUser) {
        if (isPinned !== undefined) patch.isPinned = isPinned;
        if (isLocked !== undefined) patch.isLocked = isLocked;
      }

      const updated = await storage.updateDiscussionThread(req.params.id, patch);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update thread" });
    }
  });

  app.delete("/api/community/threads/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const role = req.session?.userRole;
      const isAdminUser = role === "admin" || role === "superadmin";
      if (!isAdminUser) {
        return res.status(403).json({ error: "Only admins can delete threads" });
      }
      const thread = await storage.getDiscussionThread(req.params.id);
      if (!thread) return res.status(404).json({ error: "Thread not found" });
      await storage.deleteDiscussionThread(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete thread" });
    }
  });

  app.post("/api/community/threads/:threadId/posts", requireAuth, async (req: Request, res: Response) => {
    try {
      const thread = await storage.getDiscussionThread(req.params.threadId);
      if (!thread) return res.status(404).json({ error: "Thread not found" });
      if (thread.isLocked) {
        const role = req.session?.userRole;
        if (role !== "admin" && role !== "superadmin") {
          return res.status(403).json({ error: "This thread is locked" });
        }
      }
      const data = insertDiscussionPostSchema.parse({
        ...req.body,
        threadId: req.params.threadId,
        authorId: req.session.userId,
      });
      // storage.createDiscussionPost already increments replyCount
      const post = await storage.createDiscussionPost(data);
      const author = await storage.getUser(post.authorId);
      res.status(201).json({ ...post, author: toPublicAuthor(author) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.patch("/api/community/posts/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const role = req.session?.userRole;
      const isAdminUser = role === "admin" || role === "superadmin";
      const post = await storage.getDiscussionPost(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });
      if (!isAdminUser && post.authorId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized to edit this post" });
      }
      const updated = await storage.updateDiscussionPost(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  app.delete("/api/community/posts/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const role = req.session?.userRole;
      const isAdminUser = role === "admin" || role === "superadmin";
      if (!isAdminUser) {
        return res.status(403).json({ error: "Only admins can delete posts" });
      }
      const post = await storage.getDiscussionPost(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });
      await storage.deleteDiscussionPost(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  app.get("/api/certificates/user/:userId", async (req: Request, res: Response) => {
    try {
      const userCertificates = await storage.getCertificatesByUser(req.params.userId);
      const certificatesWithCourses = await Promise.all(
        userCertificates.map(async (cert) => {
          const course = await storage.getCourse(cert.courseId);
          return { ...cert, course };
        })
      );
      res.json(certificatesWithCourses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch certificates" });
    }
  });

  app.get("/api/certificates/:id", async (req: Request, res: Response) => {
    try {
      const certificate = await storage.getCertificate(req.params.id);
      if (!certificate) return res.status(404).json({ error: "Certificate not found" });
      const course = await storage.getCourse(certificate.courseId);
      const user = await storage.getUser(certificate.userId);
      res.json({ ...certificate, course, user });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch certificate" });
    }
  });

  app.post("/api/certificates", async (req: Request, res: Response) => {
    try {
      const data = {
        ...req.body,
        certificateNumber: `AFARA-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`
      };
      const certificate = await storage.createCertificate(data);
      res.status(201).json(certificate);
    } catch (error) {
      res.status(500).json({ error: "Failed to create certificate" });
    }
  });

  app.get("/api/achievements", async (req: Request, res: Response) => {
    try {
      const allAchievements = await storage.getAllAchievements();
      res.json(allAchievements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get("/api/achievements/user/:userId", async (req: Request, res: Response) => {
    try {
      const userAchievementsList = await storage.getUserAchievements(req.params.userId);
      res.json(userAchievementsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  app.post("/api/achievements/award", async (req: Request, res: Response) => {
    try {
      const { userId, achievementId } = req.body;
      await storage.awardAchievement(userId, achievementId);
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to award achievement" });
    }
  });

  app.get("/api/notifications/user/:userId", async (req: Request, res: Response) => {
    try {
      const userNotifications = await storage.getNotificationsByUser(req.params.userId);
      res.json(userNotifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", async (req: Request, res: Response) => {
    try {
      const data = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(data);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req: Request, res: Response) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/user/:userId/read-all", async (req: Request, res: Response) => {
    try {
      await storage.markAllNotificationsRead(req.params.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Recommendations API - content-based matching
  app.get("/api/recommendations/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const limit = parseInt(req.query.limit as string) || 6;
      
      // Get user profile for interests
      const profile = await storage.getProfile(userId);
      const userInterests = [
        ...(profile?.expertiseAreas || []),
        ...(profile?.industries || [])
      ].map(i => i.toLowerCase());
      
      // Get all published courses and resources
      const allCourses = await storage.getAllCourses();
      const allResources = await storage.getAllResources();
      
      const publishedCourses = allCourses.filter(c => c.status === "published");
      const publishedResources = allResources.filter(r => r.status === "published");
      
      // Score function - matches content keywords with user interests
      const scoreContent = (content: { 
        category?: string | null; 
        title: string; 
        description?: string | null;
        tags?: string[] | null;
      }) => {
        let score = 0;
        const searchableText = [
          content.category || "",
          content.title,
          content.description || "",
          ...(content.tags || [])
        ].join(" ").toLowerCase();
        
        for (const interest of userInterests) {
          if (searchableText.includes(interest)) {
            score += 2;
          }
          // Partial match
          const words = interest.split(/\s+/);
          for (const word of words) {
            if (word.length > 3 && searchableText.includes(word)) {
              score += 1;
            }
          }
        }
        
        // Default score for new content (boost recently added)
        if (score === 0) {
          score = 0.5;
        }
        
        return score;
      };
      
      // Score and sort courses
      const scoredCourses = publishedCourses.map(course => ({
        ...course,
        score: scoreContent({
          category: course.category,
          title: course.title,
          description: course.description,
          tags: course.learningOutcomes
        }),
        type: "course" as const
      })).sort((a, b) => b.score - a.score).slice(0, limit);
      
      // Score and sort resources
      const scoredResources = publishedResources.map(resource => ({
        ...resource,
        score: scoreContent({
          category: resource.category,
          title: resource.title,
          description: resource.description,
          tags: null
        }),
        type: "resource" as const
      })).sort((a, b) => b.score - a.score).slice(0, limit);
      
      res.json({
        courses: scoredCourses,
        resources: scoredResources,
        userInterests
      });
    } catch (error) {
      console.error("Recommendations error:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  app.post("/api/admin/test-email", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { type, email, firstName } = req.body;
      const { sendApplicationConfirmationEmail, sendWelcomeEmail, sendAcceptanceEmail } = await import("./email");
      let result;
      if (type === "application") result = await sendApplicationConfirmationEmail(email, firstName);
      else if (type === "welcome") result = await sendWelcomeEmail(email, firstName);
      else if (type === "acceptance") result = await sendAcceptanceEmail(email, firstName);
      else return res.status(400).json({ error: "Unknown type. Use: application | welcome | acceptance" });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/stats", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const allCourses = await storage.getAllCourses();
      const allEvents = await storage.getAllEvents();
      const allResources = await storage.getAllResources();
      const threads = await storage.getAllDiscussionThreads();
      const allApplications = await storage.getAllApplications();
      
      res.json({
        totalUsers: users.length,
        participantCount: users.filter(u => u.role === "participant").length,
        mentorCount: users.filter(u => u.role === "mentor").length,
        facilitatorCount: users.filter(u => u.role === "facilitator").length,
        adminCount: users.filter(u => u.role === "admin").length,
        totalCourses: allCourses.length,
        publishedCourses: allCourses.filter(c => c.status === "published").length,
        totalEvents: allEvents.length,
        totalResources: allResources.length,
        totalDiscussions: threads.length,
        totalApplications: allApplications.length,
        pendingApplications: allApplications.filter(a => a.status === "submitted" || a.status === "under_review").length
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  // Application Routes (Admin-only for listing/managing; public POST for submission)
  // Application file upload (public – no auth required, anyone filling the form can upload)
  const applicationFileUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB
  });

  app.post(
    "/api/applications/upload-file",
    (req: Request, res: Response, next: NextFunction) => {
      applicationFileUpload.single("file")(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File exceeds 4 MB limit. Please upload a smaller file." });
        }
        if (err) {
          return res.status(400).json({ error: err.message || "Upload error" });
        }
        next();
      });
    },
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file provided" });
        }
        const { isR2Configured, uploadFile } = await import("./r2-storage");
        const originalName = req.file.originalname || "file";
        const ext = originalName.includes(".") ? originalName.split(".").pop()! : "bin";
        const { randomUUID } = await import("crypto");
        const key = `applications/${randomUUID()}.${ext}`;

        let fileUrl: string;
        if (isR2Configured()) {
          const result = await uploadFile(key, req.file.buffer, req.file.mimetype, true);
          fileUrl = result.url;
        } else {
          const base64 = req.file.buffer.toString("base64");
          fileUrl = `data:${req.file.mimetype};base64,${base64}`;
        }

        res.json({ fileUrl, fileName: originalName, fileSize: req.file.size });
      } catch (error) {
        console.error("Application file upload error:", error);
        res.status(500).json({ error: "Failed to upload file" });
      }
    }
  );

  app.get("/api/applications", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      const allApplications = status 
        ? await storage.getApplicationsByStatus(status)
        : await storage.getAllApplications();
      res.json(allApplications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  // Public: look up a saved draft by email so applicants can resume
  app.get("/api/applications/draft", async (req: Request, res: Response) => {
    try {
      const email = ((req.query.email as string) || "").trim().toLowerCase();
      if (!email) return res.status(400).json({ error: "Email is required" });
      const application = await storage.getApplicationDraftByEmail(email);
      if (!application) return res.status(404).json({ error: "No draft found" });
      res.json(application);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch draft" });
    }
  });

  // Public: look up application status by email
  app.get("/api/applications/status", async (req: Request, res: Response) => {
    try {
      const email = ((req.query.email as string) || "").trim().toLowerCase();
      if (!email) return res.status(400).json({ error: "Email is required" });
      const application = await storage.getMostRecentApplicationByEmail(email);
      if (!application) return res.status(404).json({ error: "No application found" });
      res.json({
        status: application.status,
        submittedAt: application.submittedAt,
        updatedAt: application.updatedAt,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch application status" });
    }
  });

  app.get("/api/applications/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) return res.status(404).json({ error: "Application not found" });
      res.json(application);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch application" });
    }
  });

  app.post("/api/applications", async (req: Request, res: Response) => {
    try {
      const normalized = normalizeApplicationBody(req.body);
      const raw = insertApplicationSchema.parse(normalized);
      const data = { ...raw, email: raw.email.toLowerCase().trim() };

      if (data.status === "submitted") {
        const existing = await storage.getSubmittedApplicationByEmail(data.email);
        if (existing) {
          return res.status(409).json({ error: "An application from this email address has already been submitted." });
        }
      }

      const application = await storage.createApplication(data);

      // When status is "submitted", auto-create a community_member account
      if (data.status === "submitted") {
        try {
          const existingUser = await storage.getUserByEmail(data.email);
          if (!existingUser) {
            await createUserWithPassword(data.email, "Comm123!", data.firstName, data.lastName, "community_member", true);
          }
          const { sendApplicationConfirmationEmail } = await import("./email");
          await sendApplicationConfirmationEmail(data.email, data.firstName);
        } catch (innerError) {
          console.error("Failed to create community member or send confirmation email:", innerError);
        }
      }

      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to submit application" });
    }
  });

  // Normalize raw application body before DB writes:
  // - converts "yes"/"no" strings to booleans for boolean columns
  // - strips any keys not present in the applications table (avoids Drizzle unknown-column errors)
  const KNOWN_APPLICATION_FIELDS = new Set([
    "email","firstName","lastName","phone","countryOfOperation","companyName",
    "roleInCompany","personalStatement","videoEssayUrl",
    "professionalBackground","yearsOfExperience","keyResponsibilities",
    "majorAchievements","hasLedTeams","teamLeadershipExperience",
    "hasProjectExperience","projectExperience","primarySector",
    "sectorSpecification","subSectors","otherSubSector",
    "businessDescription","problemBeingSolved","businessStage",
    "tractionEvidence","targetMarket","scalabilityExplanation",
    "growthPlans","isRaisingFunding",
    "companyLegalName","companyCountry","companyHeadquarters",
    "incorporationYear","ownershipPercentage","numberOfShareholders",
    "shareholdersOver25Percent",
    "isIncorporated","incorporationCertificateUrl","registrationProofUrl",
    "revenueStreams","keepsFinancialRecords","pitchDeckUrl","businessPlanUrl",
    "financialStatementsUrl","canProvideFinancials","isTaxRegistered",
    "projectDescription","projectLocation","projectSector",
    "projectCurrentStatus","projectStage","projectDocuments",
    "otherProjectDocuments","projectedImpact",
    "businessImpact","primaryBeneficiaries","infrastructureGapContribution",
    "createsWomenOpportunities","womenOpportunitiesDescription",
    "mainChallenges","supportAreasNeeded","otherSupportArea",
    "keyActivitiesForNextStage","fundingRequired","expectedTimeline",
    "specificProgramOutcomes","hoursPerWeek","openToMentorship",
    "canCommitToProgram","canAttendLagosEvent","commitmentManagementPlan",
    "willingToMentor","peerMentorshipImportance",
    "whyAfaraIsRight","linkedinUrl","additionalInfo",
    "currentStep","status","reviewNotes","reviewedById",
    "reviewedAt","updatedAt","submittedAt","lastDraftEmailSentAt",
  ]);
  const YES_NO_BOOLEAN_FIELDS = new Set(["canProvideFinancials","isTaxRegistered"]);
  // Drizzle's PgTimestamp.mapToDriverValue calls .toISOString(), so these must be Date objects, not strings
  const TIMESTAMP_FIELDS = new Set(["submittedAt","reviewedAt","lastDraftEmailSentAt"]);

  function normalizeApplicationBody(body: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (!KNOWN_APPLICATION_FIELDS.has(key)) continue; // drop unknown fields
      if (YES_NO_BOOLEAN_FIELDS.has(key)) {
        if (value === "yes") { out[key] = true; continue; }
        if (value === "no")  { out[key] = false; continue; }
      }
      // Convert ISO timestamp strings to Date objects for Drizzle
      if (TIMESTAMP_FIELDS.has(key) && typeof value === "string" && value) {
        out[key] = new Date(value);
        continue;
      }
      out[key] = value;
    }
    return out;
  }

  // Public: applicants save/submit their own draft (requires email ownership proof)
  app.patch("/api/applications/:id/save", async (req: Request, res: Response) => {
    try {
      const newStatus = req.body.status;
      const allowedPublicStatuses = [undefined, "draft", "submitted"];
      if (newStatus && !allowedPublicStatuses.includes(newStatus)) {
        return res.status(403).json({ error: "Forbidden: only draft and submitted transitions are allowed on this endpoint" });
      }

      // Ownership check: caller must supply the same email as stored on the draft
      const existing = await storage.getApplication(req.params.id);
      if (!existing) return res.status(404).json({ error: "Application not found" });
      const requestEmail = (req.body.email || "").trim().toLowerCase();
      const storedEmail = (existing.email || "").trim().toLowerCase();
      if (!requestEmail || requestEmail !== storedEmail) {
        return res.status(403).json({ error: "Forbidden: email does not match application record" });
      }

      // Duplicate submission guard: if transitioning to submitted, block if:
      // (a) the application being patched is already in a non-draft state, or
      // (b) another non-draft application exists for the same email
      if (newStatus === "submitted") {
        if (existing.status !== "draft") {
          return res.status(409).json({ error: "An application from this email address has already been submitted." });
        }
        const duplicate = await storage.getSubmittedApplicationByEmail(storedEmail);
        if (duplicate && duplicate.id !== req.params.id) {
          return res.status(409).json({ error: "An application from this email address has already been submitted." });
        }
      }

      const rawPayload = req.body.email
        ? { ...req.body, email: (req.body.email as string).toLowerCase().trim() }
        : req.body;
      const updatePayload = normalizeApplicationBody(rawPayload);
      const application = await storage.updateApplication(req.params.id, updatePayload);
      if (!application) return res.status(404).json({ error: "Application not found" });

      // When saving a draft, send a progress notification email (fire-and-forget)
      // Throttled to once per 24 hours per application to avoid spamming applicants.
      if (!newStatus || newStatus === "draft") {
        const lastSent = existing.lastDraftEmailSentAt
          ? new Date(existing.lastDraftEmailSentAt).getTime()
          : 0;
        const threeDays = 3 * 24 * 60 * 60 * 1000;
        const cooldownExpired = Date.now() - lastSent > threeDays;
        if (cooldownExpired) {
          const stepNumber = typeof req.body.currentStep === "number" ? req.body.currentStep : 0;
          const firstName = application.firstName || existing.firstName || undefined;
          import("./email").then(({ sendDraftSaveNotificationEmail }) => {
            sendDraftSaveNotificationEmail(application.email, firstName, stepNumber, 8)
              .then(() => {
                storage.updateApplication(req.params.id, { lastDraftEmailSentAt: new Date() } as any)
                  .catch(err => console.error("Failed to stamp lastDraftEmailSentAt:", err));
              })
              .catch(err => console.error("Draft save notification email failed:", err));
          }).catch(err => console.error("Failed to import email module:", err));
        }
      }

      // When transitioning to submitted, auto-create community_member account + confirmation email
      if (newStatus === "submitted") {
        try {
          const existingUser = await storage.getUserByEmail(application.email);
          if (!existingUser) {
            await createUserWithPassword(application.email, "Comm123!", application.firstName, application.lastName, "community_member", true);
          }
          const { sendApplicationConfirmationEmail } = await import("./email");
          await sendApplicationConfirmationEmail(application.email, application.firstName);
        } catch (innerError) {
          console.error("Failed to create community member or send confirmation email:", innerError);
        }
      }

      res.json(application);
    } catch (error) {
      console.error("Error in PATCH /api/applications/:id/save:", error);
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  // Admin-only: full application status management (accept, reject, waitlist, etc.)
  async function handleApplicationStatusChange(application: any, newStatus: string, reviewNotes?: string) {
    const { sendAcceptanceEmail, sendRejectionEmail, sendWaitlistEmail, sendDisqualificationEmail } = await import("./email");
    if (newStatus === "accepted") {
      try {
        const user = await storage.getUserByEmail(application.email);
        if (user) await storage.updateUser(user.id, { role: "participant" });
        await sendAcceptanceEmail(application.email, application.firstName, reviewNotes);
      } catch (err) {
        console.error("Failed to promote user or send acceptance email:", err);
      }
    } else if (newStatus === "rejected") {
      try {
        await sendRejectionEmail(application.email, application.firstName, reviewNotes);
      } catch (err) {
        console.error("Failed to send rejection email:", err);
      }
    } else if (newStatus === "waitlisted") {
      try {
        const user = await storage.getUserByEmail(application.email);
        if (user) await storage.updateUser(user.id, { role: "community_member" });
        await sendWaitlistEmail(application.email, application.firstName);
      } catch (err) {
        console.error("Failed to add to community or send waitlist email:", err);
      }
    } else if (newStatus === "disqualified") {
      try {
        await sendDisqualificationEmail(application.email, application.firstName);
      } catch (err) {
        console.error("Failed to send disqualification email:", err);
      }
    }
  }

  app.patch("/api/applications/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const newStatus = req.body.status;
      const reviewNotes = req.body.reviewNotes;
      const application = await storage.updateApplication(req.params.id, req.body);
      if (!application) return res.status(404).json({ error: "Application not found" });
      if (newStatus) await handleApplicationStatusChange(application, newStatus, reviewNotes);
      res.json(application);
    } catch (error) {
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  // Alias kept for backward compatibility
  app.patch("/api/admin/applications/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const newStatus = req.body.status;
      const reviewNotes = req.body.reviewNotes;
      const application = await storage.updateApplication(req.params.id, req.body);
      if (!application) return res.status(404).json({ error: "Application not found" });
      if (newStatus) await handleApplicationStatusChange(application, newStatus, reviewNotes);
      res.json(application);
    } catch (error) {
      console.error("PATCH /api/admin/applications/:id error:", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  // Admin-only: translate application text fields
  app.post("/api/admin/translate", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { texts, targetLang = "en" } = req.body;
      if (!Array.isArray(texts)) return res.status(400).json({ error: "texts must be an array" });

      const translateOne = async (text: string) => {
        if (!text || text.trim().length < 3) return { translated: text, detectedLang: "en" };
        try {
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text.substring(0, 4800))}`;
          const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
          if (!r.ok) return { translated: text, detectedLang: "unknown" };
          const data = await r.json();
          const translated = Array.isArray(data[0])
            ? data[0].map((chunk: any[]) => chunk[0] ?? "").join("")
            : text;
          const detectedLang = data[2] || "unknown";
          return { translated, detectedLang };
        } catch {
          return { translated: text, detectedLang: "unknown" };
        }
      };

      const results = await Promise.all(texts.map(translateOne));
      res.json({ results });
    } catch (error) {
      console.error("Translate error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  // Admin-only: delete application
  app.delete("/api/applications/:id", requireAuth, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) return res.status(404).json({ error: "Application not found" });
      
      await storage.deleteApplication(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete application" });
    }
  });

  // Newsletter Routes
  const subscribeSchema = z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    source: z.string().optional()
  });

  const unsubscribeSchema = z.object({
    email: z.string().email()
  });

  const campaignSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    content: z.string().min(1, "Content is required")
  });

  const isAdmin = (req: Request): boolean => {
    const role = req.session?.userRole;
    return role === "admin" || role === "superadmin";
  };

  app.post("/api/contact", async (req: Request, res: Response) => {
    const { name, email, organization, interest, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }
    try {
      const { sendContactNotificationEmail } = await import("./email");
      await sendContactNotificationEmail({ name, email, organization, interest, message });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get("/api/newsletter/subscribers", async (req: Request, res: Response) => {
    if (!req.session?.userId || !isAdmin(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const subscribers = await storage.getAllNewsletterSubscribers();
      res.json(subscribers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscribers" });
    }
  });

  app.post("/api/newsletter/subscribe", async (req: Request, res: Response) => {
    try {
      const { email, firstName, lastName, source } = subscribeSchema.parse(req.body);
      
      const existingSubscriber = await storage.getNewsletterSubscriberByEmail(email);
      
      if (existingSubscriber) {
        if (existingSubscriber.isActive) {
          return res.status(400).json({ error: "Email is already subscribed" });
        }
        const resubscribed = await storage.updateNewsletterSubscriber(existingSubscriber.id, {
          isActive: true,
          firstName,
          lastName
        });
        try {
          const { sendWelcomeEmail } = await import("./email");
          await sendWelcomeEmail(email, firstName);
        } catch (emailError) {
          console.error("Failed to send welcome email on resubscribe:", emailError);
        }
        return res.json({ message: "Successfully resubscribed", subscriber: resubscribed });
      }
      
      const subscriber = await storage.createNewsletterSubscriber({
        email,
        firstName,
        lastName,
        source: source || "website"
      });
      
      try {
        const { sendWelcomeEmail } = await import("./email");
        await sendWelcomeEmail(email, firstName);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
      
      res.status(201).json({ message: "Successfully subscribed", subscriber });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  app.post("/api/newsletter/unsubscribe", async (req: Request, res: Response) => {
    try {
      const { email } = unsubscribeSchema.parse(req.body);
      await storage.unsubscribeNewsletter(email);
      res.json({ message: "Successfully unsubscribed" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  app.get("/api/newsletter/campaigns", async (req: Request, res: Response) => {
    if (!req.session?.userId || !isAdmin(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const campaigns = await storage.getAllNewsletterCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/newsletter/campaigns", async (req: Request, res: Response) => {
    if (!req.session?.userId || !isAdmin(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const { subject, content } = campaignSchema.parse(req.body);
      
      const campaign = await storage.createNewsletterCampaign({
        subject,
        content,
        sentById: req.session.userId,
        status: "draft"
      });
      
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.post("/api/newsletter/campaigns/:id/send", async (req: Request, res: Response) => {
    if (!req.session?.userId || !isAdmin(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const campaign = await storage.getNewsletterCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      const activeSubscribers = await storage.getActiveNewsletterSubscribers();
      const recipientEmails = activeSubscribers.map(s => s.email);
      
      if (recipientEmails.length === 0) {
        return res.status(400).json({ error: "No active subscribers" });
      }
      
      const { sendNewsletter } = await import("./email");
      const result = await sendNewsletter(campaign.subject, campaign.content, recipientEmails);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to send newsletter" });
      }
      
      await storage.updateNewsletterCampaign(campaign.id, {
        status: "sent",
        recipientCount: recipientEmails.length
      });
      
      res.json({ message: "Newsletter sent successfully", recipientCount: recipientEmails.length });
    } catch (error) {
      console.error("Send campaign error:", error);
      res.status(500).json({ error: "Failed to send campaign" });
    }
  });

  // Avatar upload endpoint
  const avatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB
    fileFilter: (_req, file, cb) => {
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
      }
    },
  });

  app.post(
    "/api/auth/upload-avatar",
    requireAuth,
    (req: Request, res: Response, next: NextFunction) => {
      avatarUpload.single("avatar")(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File exceeds 4 MB limit. Please upload a smaller file." });
        }
        if (err) {
          return res.status(400).json({ error: err.message || "Upload error" });
        }
        next();
      });
    },
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file provided" });
        }

        const userId = req.session.userId!;
        const ext = req.file.mimetype === "image/png"
          ? "png"
          : req.file.mimetype === "image/webp"
          ? "webp"
          : "jpg";
        const key = `avatars/${userId}.${ext}`;

        const { isR2Configured, uploadFile } = await import("./r2-storage");

        let avatarUrl: string;
        if (isR2Configured()) {
          const result = await uploadFile(key, req.file.buffer, req.file.mimetype, true);
          avatarUrl = result.url;
        } else {
          const base64 = req.file.buffer.toString("base64");
          avatarUrl = `data:${req.file.mimetype};base64,${base64}`;
        }

        const updated = await storage.updateUser(userId, { profileImageUrl: avatarUrl });
        if (!updated) {
          return res.status(404).json({ error: "User not found" });
        }

        const { passwordHash, ...safeUser } = updated;
        res.json({ user: safeUser });
      } catch (error) {
        console.error("Avatar upload error:", error);
        res.status(500).json({ error: "Failed to upload avatar" });
      }
    }
  );

  const httpServer = createServer(app);

  return httpServer;
}
