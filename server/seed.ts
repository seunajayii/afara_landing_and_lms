import { db } from "./db";
import { 
  users, profiles, mentorProfiles, facilitatorProfiles,
  courses, modules, lessons, events, resources, 
  discussionThreads, discussionPosts, achievements
} from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  const adminUser = await db.insert(users).values({
    email: "admin@afara.org",
    firstName: "Amara",
    lastName: "Okonkwo",
    role: "admin",
    isActive: true,
  }).returning();
  console.log("Created admin user:", adminUser[0].id);

  const mentorUsers = await db.insert(users).values([
    {
      email: "ngozi.adeyemi@afara.org",
      firstName: "Ngozi",
      lastName: "Adeyemi",
      role: "mentor",
      isActive: true,
    },
    {
      email: "olumide.bakare@afara.org",
      firstName: "Olumide",
      lastName: "Bakare",
      role: "mentor",
      isActive: true,
    },
    {
      email: "fatima.hassan@afara.org",
      firstName: "Fatima",
      lastName: "Hassan",
      role: "mentor",
      isActive: true,
    },
  ]).returning();
  console.log("Created mentor users");

  const facilitatorUsers = await db.insert(users).values([
    {
      email: "chidinma.uzoma@afara.org",
      firstName: "Chidinma",
      lastName: "Uzoma",
      role: "facilitator",
      isActive: true,
    },
    {
      email: "yemi.adeola@afara.org",
      firstName: "Yemi",
      lastName: "Adeola",
      role: "facilitator",
      isActive: true,
    },
  ]).returning();
  console.log("Created facilitator users");

  const participantUsers = await db.insert(users).values([
    {
      email: "participant1@test.com",
      firstName: "Adaeze",
      lastName: "Nwosu",
      role: "participant",
      isActive: true,
    },
    {
      email: "participant2@test.com",
      firstName: "Zainab",
      lastName: "Ibrahim",
      role: "participant",
      isActive: true,
    },
  ]).returning();
  console.log("Created participant users");

  await db.insert(profiles).values([
    {
      userId: mentorUsers[0].id,
      bio: "Infrastructure finance expert with 15+ years of experience in project financing across West Africa. Former VP at African Development Bank.",
      company: "AfriFinance Advisory",
      jobTitle: "Managing Partner",
      country: "Nigeria",
      linkedinUrl: "https://linkedin.com/in/ngozi-adeyemi",
      expertiseAreas: ["Project Finance", "Infrastructure Development", "Capital Markets"],
      industries: ["Energy", "Transport", "Telecommunications"],
      yearsExperience: 15,
      meetingPlatformPreference: "zoom",
      meetingLink: "https://zoom.us/j/ngozi-adeyemi",
    },
    {
      userId: mentorUsers[1].id,
      bio: "Renewable energy entrepreneur and policy advisor. Founded three successful solar companies and advises governments on energy transition.",
      company: "GreenPower Africa",
      jobTitle: "CEO & Founder",
      country: "Ghana",
      linkedinUrl: "https://linkedin.com/in/olumide-bakare",
      expertiseAreas: ["Renewable Energy", "Policy & Regulation", "Entrepreneurship"],
      industries: ["Solar", "Wind", "Energy Storage"],
      yearsExperience: 12,
      meetingPlatformPreference: "google_meet",
      meetingLink: "https://meet.google.com/abc-defg-hij",
    },
    {
      userId: mentorUsers[2].id,
      bio: "Investment specialist focusing on women-led businesses in Africa. Managing director at a leading PE firm with $500M AUM.",
      company: "Sahara Capital Partners",
      jobTitle: "Managing Director",
      country: "Kenya",
      linkedinUrl: "https://linkedin.com/in/fatima-hassan",
      expertiseAreas: ["Investment Strategy", "Private Equity", "Gender Lens Investing"],
      industries: ["Infrastructure", "Agriculture", "Healthcare"],
      yearsExperience: 18,
      meetingPlatformPreference: "teams",
      meetingLink: "https://teams.microsoft.com/fatima-hassan",
    },
  ]);
  console.log("Created mentor profiles");

  await db.insert(mentorProfiles).values([
    {
      userId: mentorUsers[0].id,
      specializations: ["Financial Modeling", "Due Diligence", "Bankability Assessment"],
      maxMentees: 5,
      currentMentees: 2,
      availabilityDescription: "Tuesdays and Thursdays, 10:00 AM - 2:00 PM WAT",
      sessionDurationMinutes: 60,
      isAcceptingMentees: true,
    },
    {
      userId: mentorUsers[1].id,
      specializations: ["Project Development", "Regulatory Navigation", "Business Model Design"],
      maxMentees: 4,
      currentMentees: 3,
      availabilityDescription: "Mondays and Wednesdays, 3:00 PM - 6:00 PM WAT",
      sessionDurationMinutes: 45,
      isAcceptingMentees: true,
    },
    {
      userId: mentorUsers[2].id,
      specializations: ["Fundraising", "Investor Relations", "Growth Strategy"],
      maxMentees: 3,
      currentMentees: 1,
      availabilityDescription: "Fridays, 9:00 AM - 12:00 PM EAT",
      sessionDurationMinutes: 60,
      isAcceptingMentees: true,
    },
  ]);
  console.log("Created mentor-specific profiles");

  await db.insert(profiles).values([
    {
      userId: facilitatorUsers[0].id,
      bio: "Expert in infrastructure policy and regulatory frameworks. Led regulatory reform initiatives across 5 African countries.",
      company: "AFÁRÁ Accelerator",
      jobTitle: "Lead Facilitator - Policy & Regulation",
      country: "Nigeria",
      expertiseAreas: ["Regulatory Compliance", "Policy Analysis", "Stakeholder Engagement"],
      industries: ["Energy", "Water", "Transport"],
      yearsExperience: 10,
    },
    {
      userId: facilitatorUsers[1].id,
      bio: "Leadership coach and communications specialist. Former C-suite executive turned educator with a passion for developing female leaders.",
      company: "AFÁRÁ Accelerator",
      jobTitle: "Lead Facilitator - Leadership Development",
      country: "Nigeria",
      expertiseAreas: ["Executive Coaching", "Public Speaking", "Strategic Communication"],
      industries: ["Professional Development", "Corporate Training"],
      yearsExperience: 14,
    },
  ]);

  await db.insert(facilitatorProfiles).values([
    {
      userId: facilitatorUsers[0].id,
      teachingAreas: ["Regulatory Compliance & Strategy", "Policy Navigation", "Government Relations"],
      coursesDelivered: 12,
      totalStudents: 180,
      rating: 48,
    },
    {
      userId: facilitatorUsers[1].id,
      teachingAreas: ["Leadership & Communication", "Executive Presence", "Negotiation Skills"],
      coursesDelivered: 8,
      totalStudents: 120,
      rating: 49,
    },
  ]);
  console.log("Created facilitator profiles");

  const createdCourses = await db.insert(courses).values([
    {
      title: "Financial Structuring for Infrastructure",
      description: "Master the art of designing bankable financial structures for energy and infrastructure projects. This comprehensive course covers project finance fundamentals, risk allocation, and capital structuring tailored for the African context.",
      shortDescription: "Learn to design bankable financial structures.",
      instructorId: facilitatorUsers[0].id,
      durationMinutes: 2520,
      status: "published",
      category: "Finance",
      level: "Intermediate",
      prerequisites: ["Basic financial literacy", "Understanding of project development"],
      learningOutcomes: ["Structure complex project finance deals", "Assess and allocate project risks", "Navigate African financial markets", "Build financial models for infrastructure"],
      publishedAt: new Date(),
    },
    {
      title: "Regulatory Compliance & Strategy",
      description: "Navigate policy and regulatory frameworks with confidence. Learn to understand, anticipate, and strategically engage with regulatory requirements across African energy and infrastructure sectors.",
      shortDescription: "Navigate policy and regulatory frameworks.",
      instructorId: facilitatorUsers[0].id,
      durationMinutes: 1680,
      status: "published",
      category: "Regulation",
      level: "Intermediate",
      prerequisites: ["Understanding of energy sector basics"],
      learningOutcomes: ["Map regulatory stakeholders", "Develop compliance strategies", "Engage effectively with regulators", "Anticipate policy changes"],
      publishedAt: new Date(),
    },
    {
      title: "Project Development Fundamentals",
      description: "From concept to capital—master the entire development process. This foundational course covers the full project lifecycle from initial concept through feasibility, development, and reaching financial close.",
      shortDescription: "From concept to capital—master the entire development process.",
      instructorId: facilitatorUsers[0].id,
      durationMinutes: 3360,
      status: "published",
      category: "Technical",
      level: "Beginner",
      prerequisites: [],
      learningOutcomes: ["Develop project concepts", "Conduct feasibility studies", "Manage development milestones", "Prepare for financial close"],
      publishedAt: new Date(),
    },
    {
      title: "Leadership & Communication Skills",
      description: "Build confidence, audacity, and executive presence. Develop the leadership capabilities and communication skills essential for female leaders in infrastructure.",
      shortDescription: "Build confidence, audacity, and executive presence.",
      instructorId: facilitatorUsers[1].id,
      durationMinutes: 2100,
      status: "published",
      category: "Soft Skills",
      level: "All Levels",
      prerequisites: [],
      learningOutcomes: ["Develop executive presence", "Master stakeholder communication", "Lead high-performing teams", "Navigate challenging conversations"],
      publishedAt: new Date(),
    },
    {
      title: "Funding Strategy & Capital Raising",
      description: "Shape funding strategies and connect with the right capital partners. Learn to identify, approach, and secure funding from diverse capital sources for infrastructure projects.",
      shortDescription: "Shape funding strategies and connect with the right capital partners.",
      instructorId: facilitatorUsers[0].id,
      durationMinutes: 2520,
      status: "published",
      category: "Finance",
      level: "Advanced",
      prerequisites: ["Financial Structuring for Infrastructure", "Basic understanding of capital markets"],
      learningOutcomes: ["Develop comprehensive funding strategies", "Identify appropriate capital sources", "Prepare compelling investment materials", "Negotiate term sheets"],
      publishedAt: new Date(),
    },
    {
      title: "Technical Due Diligence",
      description: "Conduct thorough technical assessments for infrastructure projects. Learn the methodologies and frameworks for evaluating technical feasibility and risks.",
      shortDescription: "Conduct thorough technical assessments for infrastructure projects.",
      instructorId: facilitatorUsers[0].id,
      durationMinutes: 1680,
      status: "published",
      category: "Technical",
      level: "Intermediate",
      prerequisites: ["Project Development Fundamentals"],
      learningOutcomes: ["Conduct technical feasibility assessments", "Identify and mitigate technical risks", "Evaluate contractor capabilities", "Review technical specifications"],
      publishedAt: new Date(),
    },
  ]).returning();
  console.log("Created courses");

  const course1Modules = await db.insert(modules).values([
    { courseId: createdCourses[0].id, title: "Introduction to Project Finance", description: "Understanding the fundamentals of project finance and its application in African infrastructure.", orderIndex: 1, durationMinutes: 180 },
    { courseId: createdCourses[0].id, title: "Risk Assessment & Allocation", description: "Learn to identify, assess, and allocate risks in infrastructure projects.", orderIndex: 2, durationMinutes: 240 },
    { courseId: createdCourses[0].id, title: "Financial Modeling Essentials", description: "Build robust financial models for infrastructure projects.", orderIndex: 3, durationMinutes: 360 },
    { courseId: createdCourses[0].id, title: "Capital Structure Design", description: "Optimize debt-equity structures for project viability.", orderIndex: 4, durationMinutes: 300 },
    { courseId: createdCourses[0].id, title: "Debt Financing Options", description: "Explore DFI lending, commercial banks, and bond financing.", orderIndex: 5, durationMinutes: 240 },
    { courseId: createdCourses[0].id, title: "Equity & Mezzanine Financing", description: "Understanding equity structures and hybrid instruments.", orderIndex: 6, durationMinutes: 240 },
    { courseId: createdCourses[0].id, title: "Negotiating Finance Terms", description: "Master the art of negotiating with financiers.", orderIndex: 7, durationMinutes: 300 },
    { courseId: createdCourses[0].id, title: "Case Studies & Practical Application", description: "Apply learnings to real-world African infrastructure projects.", orderIndex: 8, durationMinutes: 360 },
  ]).returning();

  await db.insert(lessons).values([
    { moduleId: course1Modules[0].id, title: "What is Project Finance?", description: "Introduction to project finance concepts", orderIndex: 1, lessonType: "video", videoSource: "youtube", videoId: "dQw4w9WgXcQ", videoDurationSeconds: 720, durationMinutes: 15 },
    { moduleId: course1Modules[0].id, title: "Project Finance vs Corporate Finance", description: "Key differences and when to use each", orderIndex: 2, lessonType: "video", videoSource: "youtube", videoId: "dQw4w9WgXcQ", videoDurationSeconds: 900, durationMinutes: 18 },
    { moduleId: course1Modules[0].id, title: "The African Infrastructure Context", description: "Understanding the unique challenges and opportunities", orderIndex: 3, lessonType: "text", content: "Africa's infrastructure gap represents both a challenge and an opportunity...", durationMinutes: 20 },
    { moduleId: course1Modules[1].id, title: "Identifying Project Risks", description: "Systematic approach to risk identification", orderIndex: 1, lessonType: "video", videoSource: "youtube", videoId: "dQw4w9WgXcQ", videoDurationSeconds: 1200, durationMinutes: 25 },
    { moduleId: course1Modules[1].id, title: "Risk Allocation Principles", description: "Who should bear which risks?", orderIndex: 2, lessonType: "video", videoSource: "youtube", videoId: "dQw4w9WgXcQ", videoDurationSeconds: 1080, durationMinutes: 20 },
    { moduleId: course1Modules[2].id, title: "Building Your First Financial Model", description: "Step-by-step model construction", orderIndex: 1, lessonType: "video", videoSource: "youtube", videoId: "dQw4w9WgXcQ", videoDurationSeconds: 2400, durationMinutes: 45 },
    { moduleId: course1Modules[2].id, title: "Model Templates & Resources", description: "Download and use professional templates", orderIndex: 2, lessonType: "downloadable", downloadableUrl: "/resources/financial-model-template.xlsx", durationMinutes: 10 },
  ]);
  console.log("Created modules and lessons for course 1");

  const course2Modules = await db.insert(modules).values([
    { courseId: createdCourses[1].id, title: "Understanding the Regulatory Landscape", description: "Mapping regulatory bodies and frameworks across Africa.", orderIndex: 1, durationMinutes: 240 },
    { courseId: createdCourses[1].id, title: "Compliance Strategy Development", description: "Building a proactive compliance approach.", orderIndex: 2, durationMinutes: 300 },
    { courseId: createdCourses[1].id, title: "Stakeholder Engagement", description: "Effectively engaging with regulators and policymakers.", orderIndex: 3, durationMinutes: 240 },
    { courseId: createdCourses[1].id, title: "Navigating Licensing & Permits", description: "Practical guide to obtaining necessary approvals.", orderIndex: 4, durationMinutes: 300 },
    { courseId: createdCourses[1].id, title: "Policy Advocacy & Influence", description: "Shaping policy for better outcomes.", orderIndex: 5, durationMinutes: 240 },
    { courseId: createdCourses[1].id, title: "Case Studies in Regulatory Navigation", description: "Learning from successful and challenging experiences.", orderIndex: 6, durationMinutes: 360 },
  ]).returning();

  await db.insert(lessons).values([
    { moduleId: course2Modules[0].id, title: "The Energy Regulatory Framework", description: "Overview of energy sector regulation in Africa", orderIndex: 1, lessonType: "video", videoSource: "vimeo", videoId: "123456789", videoDurationSeconds: 1500, durationMinutes: 30 },
    { moduleId: course2Modules[0].id, title: "Key Regulatory Bodies", description: "Who regulates what across African markets", orderIndex: 2, lessonType: "text", content: "Understanding the hierarchy and jurisdiction of regulatory bodies is essential...", durationMinutes: 25 },
  ]);
  console.log("Created modules and lessons for course 2");

  const createdEvents = await db.insert(events).values([
    {
      title: "Funding Strategy Masterclass",
      description: "Join us for an intensive masterclass on developing winning funding strategies for infrastructure projects. Learn from experienced investors and successful founders who have raised capital for major African infrastructure initiatives.",
      eventType: "webinar",
      hostId: mentorUsers[2].id,
      startTime: new Date("2025-03-15T14:00:00Z"),
      endTime: new Date("2025-03-15T16:00:00Z"),
      durationMinutes: 120,
      meetingPlatform: "zoom",
      meetingLink: "https://zoom.us/j/funding-masterclass",
      maxAttendees: 100,
      isPublic: true,
      status: "published",
    },
    {
      title: "Peer Networking Session",
      description: "Connect with fellow AFÁRÁ cohort members in this facilitated networking session. Share experiences, build relationships, and explore collaboration opportunities.",
      eventType: "networking",
      hostId: facilitatorUsers[1].id,
      startTime: new Date("2025-03-18T16:00:00Z"),
      endTime: new Date("2025-03-18T17:30:00Z"),
      durationMinutes: 90,
      meetingPlatform: "zoom",
      meetingLink: "https://zoom.us/j/peer-networking",
      maxAttendees: 30,
      isPublic: false,
      status: "published",
    },
    {
      title: "Infrastructure Investment Trends 2025",
      description: "A deep dive into current infrastructure investment trends across Africa. Guest speakers from leading DFIs and institutional investors share their perspectives and priorities.",
      eventType: "webinar",
      hostId: mentorUsers[0].id,
      startTime: new Date("2025-03-22T10:00:00Z"),
      endTime: new Date("2025-03-22T12:00:00Z"),
      durationMinutes: 120,
      meetingPlatform: "teams",
      meetingLink: "https://teams.microsoft.com/investment-trends",
      maxAttendees: 150,
      isPublic: true,
      status: "published",
    },
    {
      title: "Financial Modeling Workshop",
      description: "Hands-on workshop where you'll build a complete infrastructure project financial model from scratch. Bring your laptop and prepare to learn by doing.",
      eventType: "workshop",
      hostId: facilitatorUsers[0].id,
      startTime: new Date("2025-03-25T09:00:00Z"),
      endTime: new Date("2025-03-25T13:00:00Z"),
      durationMinutes: 240,
      meetingPlatform: "zoom",
      meetingLink: "https://zoom.us/j/financial-modeling-workshop",
      maxAttendees: 40,
      isPublic: false,
      status: "published",
    },
    {
      title: "Renewable Energy Policy Updates",
      description: "Monthly live session covering the latest policy developments affecting renewable energy projects across key African markets.",
      eventType: "live_session",
      hostId: mentorUsers[1].id,
      startTime: new Date("2025-04-01T15:00:00Z"),
      endTime: new Date("2025-04-01T16:00:00Z"),
      durationMinutes: 60,
      meetingPlatform: "google_meet",
      meetingLink: "https://meet.google.com/policy-updates",
      maxAttendees: 50,
      isPublic: true,
      status: "published",
    },
  ]).returning();
  console.log("Created events");

  await db.insert(resources).values([
    {
      title: "Infrastructure Project Finance Model Template",
      description: "Comprehensive Excel template for modeling infrastructure project finances. Includes debt sizing, cash flow projections, and sensitivity analysis.",
      resourceType: "template",
      category: "Finance",
      fileUrl: "/resources/project-finance-template.xlsx",
      fileName: "project-finance-template.xlsx",
      fileSize: 2500000,
      downloadCount: 0,
      uploadedById: facilitatorUsers[0].id,
      status: "published",
    },
    {
      title: "Regulatory Compliance Checklist",
      description: "Comprehensive checklist covering regulatory requirements for energy projects across Nigeria, Kenya, Ghana, and South Africa.",
      resourceType: "toolkit",
      category: "Regulation",
      fileUrl: "/resources/compliance-checklist.pdf",
      fileName: "compliance-checklist.pdf",
      fileSize: 850000,
      downloadCount: 0,
      uploadedById: facilitatorUsers[0].id,
      status: "published",
    },
    {
      title: "Investor Pitch Deck Template",
      description: "Professional pitch deck template designed for infrastructure projects. Includes all essential slides and guidance notes.",
      resourceType: "template",
      category: "Finance",
      fileUrl: "/resources/pitch-deck-template.pptx",
      fileName: "pitch-deck-template.pptx",
      fileSize: 5200000,
      downloadCount: 0,
      uploadedById: mentorUsers[2].id,
      status: "published",
    },
    {
      title: "Due Diligence Framework Guide",
      description: "Step-by-step guide to conducting technical and commercial due diligence for infrastructure investments.",
      resourceType: "guide",
      category: "Technical",
      fileUrl: "/resources/due-diligence-guide.pdf",
      fileName: "due-diligence-guide.pdf",
      fileSize: 1200000,
      downloadCount: 0,
      uploadedById: mentorUsers[0].id,
      status: "published",
    },
    {
      title: "Stakeholder Mapping Template",
      description: "Interactive template for mapping and prioritizing project stakeholders including regulators, investors, and community groups.",
      resourceType: "template",
      category: "Regulation",
      fileUrl: "/resources/stakeholder-mapping.xlsx",
      fileName: "stakeholder-mapping.xlsx",
      fileSize: 450000,
      downloadCount: 0,
      uploadedById: facilitatorUsers[0].id,
      status: "published",
    },
    {
      title: "Leadership Assessment Toolkit",
      description: "Self-assessment tools and exercises for developing leadership capabilities and executive presence.",
      resourceType: "toolkit",
      category: "Leadership",
      fileUrl: "/resources/leadership-toolkit.pdf",
      fileName: "leadership-toolkit.pdf",
      fileSize: 980000,
      downloadCount: 0,
      uploadedById: facilitatorUsers[1].id,
      status: "published",
    },
    {
      title: "African DFI Landscape Report",
      description: "Comprehensive overview of Development Finance Institutions active in African infrastructure, their focus areas, and typical terms.",
      resourceType: "document",
      category: "Finance",
      fileUrl: "/resources/dfi-landscape-report.pdf",
      fileName: "dfi-landscape-report.pdf",
      fileSize: 3500000,
      downloadCount: 0,
      uploadedById: mentorUsers[0].id,
      status: "published",
    },
    {
      title: "Project Development Timeline Template",
      description: "Gantt chart template for planning and tracking infrastructure project development milestones.",
      resourceType: "template",
      category: "Technical",
      fileUrl: "/resources/project-timeline-template.xlsx",
      fileName: "project-timeline-template.xlsx",
      fileSize: 320000,
      downloadCount: 0,
      uploadedById: facilitatorUsers[0].id,
      status: "published",
    },
  ]);
  console.log("Created resources");

  const threads = await db.insert(discussionThreads).values([
    {
      title: "Welcome to the AFÁRÁ Community!",
      content: "Welcome to our vibrant community of female infrastructure leaders! This is your space to connect, share experiences, and support each other on your entrepreneurial journeys. Feel free to introduce yourself and share what brings you to AFÁRÁ.",
      authorId: adminUser[0].id,
      category: "General",
      isPinned: true,
      viewCount: 45,
      replyCount: 12,
    },
    {
      title: "Tips for First-Time Founders Approaching DFIs",
      content: "I recently had my first meeting with a major DFI and wanted to share some lessons learned. Key takeaways: 1) Come with a clear ask, 2) Understand their investment thesis, 3) Be prepared for a long timeline...",
      authorId: participantUsers[0].id,
      category: "Funding",
      isPinned: false,
      viewCount: 78,
      replyCount: 8,
    },
    {
      title: "Navigating Environmental Impact Assessments",
      content: "Has anyone here completed an EIA process in Nigeria recently? I'm finding the requirements have changed and would love to hear about others' experiences.",
      authorId: participantUsers[1].id,
      category: "Technical",
      isPinned: false,
      viewCount: 34,
      replyCount: 5,
    },
  ]).returning();

  await db.insert(discussionPosts).values([
    {
      threadId: threads[0].id,
      authorId: participantUsers[0].id,
      content: "Hello everyone! I'm Adaeze, founder of a solar mini-grid company in Nigeria. Excited to be part of this cohort and learn from all of you!",
      likeCount: 8,
    },
    {
      threadId: threads[0].id,
      authorId: participantUsers[1].id,
      content: "Great to be here! I'm Zainab from Kenya, working on water infrastructure projects. Looking forward to connecting with fellow founders.",
      likeCount: 6,
    },
    {
      threadId: threads[1].id,
      authorId: mentorUsers[0].id,
      content: "Great insights! I'd add that having a strong local partner or advisor who understands the DFI's internal processes can be incredibly valuable.",
      likeCount: 15,
    },
  ]);
  console.log("Created discussion threads and posts");

  await db.insert(achievements).values([
    {
      name: "First Steps",
      description: "Complete your first course lesson",
      criteria: "Complete 1 lesson",
    },
    {
      name: "Course Completer",
      description: "Complete an entire course",
      criteria: "Complete all lessons in a course",
    },
    {
      name: "Networking Pro",
      description: "Attend 5 networking events",
      criteria: "Register and attend 5 events",
    },
    {
      name: "Active Contributor",
      description: "Post 10 messages in community discussions",
      criteria: "Create 10 discussion posts",
    },
    {
      name: "Mentorship Seeker",
      description: "Complete your first mentorship session",
      criteria: "Complete 1 mentorship session",
    },
    {
      name: "Knowledge Sharer",
      description: "Share a resource with the community",
      criteria: "Upload 1 resource",
    },
  ]);
  console.log("Created achievements");

  console.log("Seed completed successfully!");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
