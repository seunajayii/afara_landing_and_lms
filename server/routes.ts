import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertProfileSchema, insertMentorProfileSchema, insertFacilitatorProfileSchema,
  insertCourseSchema, insertModuleSchema, insertLessonSchema, insertEnrollmentSchema,
  insertMentorshipRequestSchema, insertMentorshipSessionSchema,
  insertEventSchema, insertEventRegistrationSchema, insertResourceSchema,
  insertDiscussionThreadSchema, insertDiscussionPostSchema, insertCertificateSchema,
  insertNotificationSchema
} from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/users/role/:role", async (req: Request, res: Response) => {
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

  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
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
      res.json(allEvents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      const registrations = await storage.getEventRegistrationsByEvent(req.params.id);
      res.json({ ...event, registrations });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", async (req: Request, res: Response) => {
    try {
      const data = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(data);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.patch("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const event = await storage.updateEvent(req.params.id, req.body);
      if (!event) return res.status(404).json({ error: "Event not found" });
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", async (req: Request, res: Response) => {
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
      res.json(allResources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });

  app.get("/api/resources/:id", async (req: Request, res: Response) => {
    try {
      const resource = await storage.getResource(req.params.id);
      if (!resource) return res.status(404).json({ error: "Resource not found" });
      res.json(resource);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resource" });
    }
  });

  app.post("/api/resources", async (req: Request, res: Response) => {
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

  app.patch("/api/resources/:id", async (req: Request, res: Response) => {
    try {
      const resource = await storage.updateResource(req.params.id, req.body);
      if (!resource) return res.status(404).json({ error: "Resource not found" });
      res.json(resource);
    } catch (error) {
      res.status(500).json({ error: "Failed to update resource" });
    }
  });

  app.delete("/api/resources/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteResource(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete resource" });
    }
  });

  app.post("/api/resources/:id/download", async (req: Request, res: Response) => {
    try {
      await storage.incrementResourceDownload(req.params.id);
      const resource = await storage.getResource(req.params.id);
      res.json(resource);
    } catch (error) {
      res.status(500).json({ error: "Failed to track download" });
    }
  });

  app.get("/api/community/threads", async (req: Request, res: Response) => {
    try {
      const threads = await storage.getAllDiscussionThreads();
      const threadsWithAuthors = await Promise.all(
        threads.map(async (thread) => {
          const author = await storage.getUser(thread.authorId);
          return { ...thread, author };
        })
      );
      res.json(threadsWithAuthors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch threads" });
    }
  });

  app.get("/api/community/threads/:id", async (req: Request, res: Response) => {
    try {
      const thread = await storage.getDiscussionThread(req.params.id);
      if (!thread) return res.status(404).json({ error: "Thread not found" });
      await storage.incrementThreadView(req.params.id);
      const author = await storage.getUser(thread.authorId);
      const posts = await storage.getDiscussionPostsByThread(req.params.id);
      const postsWithAuthors = await Promise.all(
        posts.map(async (post) => {
          const postAuthor = await storage.getUser(post.authorId);
          return { ...post, author: postAuthor };
        })
      );
      res.json({ ...thread, author, posts: postsWithAuthors });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch thread" });
    }
  });

  app.post("/api/community/threads", async (req: Request, res: Response) => {
    try {
      const data = insertDiscussionThreadSchema.parse(req.body);
      const thread = await storage.createDiscussionThread(data);
      res.status(201).json(thread);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create thread" });
    }
  });

  app.patch("/api/community/threads/:id", async (req: Request, res: Response) => {
    try {
      const thread = await storage.updateDiscussionThread(req.params.id, req.body);
      if (!thread) return res.status(404).json({ error: "Thread not found" });
      res.json(thread);
    } catch (error) {
      res.status(500).json({ error: "Failed to update thread" });
    }
  });

  app.delete("/api/community/threads/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteDiscussionThread(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete thread" });
    }
  });

  app.post("/api/community/threads/:threadId/posts", async (req: Request, res: Response) => {
    try {
      const data = { ...req.body, threadId: req.params.threadId };
      const post = await storage.createDiscussionPost(data);
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.patch("/api/community/posts/:id", async (req: Request, res: Response) => {
    try {
      const post = await storage.updateDiscussionPost(req.params.id, req.body);
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  app.delete("/api/community/posts/:id", async (req: Request, res: Response) => {
    try {
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

  app.get("/api/admin/stats", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const allCourses = await storage.getAllCourses();
      const allEvents = await storage.getAllEvents();
      const allResources = await storage.getAllResources();
      const threads = await storage.getAllDiscussionThreads();
      
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
        totalDiscussions: threads.length
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
