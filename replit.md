# AFÁRÁ Accelerator Platform

## Overview

AFÁRÁ is a business accelerator platform supporting female-owned and led African companies in the Energy and Infrastructure space. The name "AFÁRÁ" comes from the Yoruba word meaning "bridge"—symbolizing connection, transition, and opportunity.

The platform features a responsive public website showcasing the accelerator program, alongside a comprehensive Learning Management System (LMS) delivering training modules, mentorship tracking, resource libraries, and community engagement tools for program participants.

AFÁRÁ is an initiative of Open Spaces & Bridges Advisory (OPSB).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management
- Tailwind CSS with custom design system implementation

**Design System:**
- Forest green primary color palette representing growth, infrastructure, and African heritage
- **Brand Assets**: 
  - AFÁRÁ logo used in Navbar, Footer, and LMS Sidebar
  - Typography: "AFÁRÁ" displayed in ALL CAPS with accent marks throughout platform
- shadcn/ui component library with Radix UI primitives for accessible, customizable UI components
- Theme system supporting light/dark modes with CSS custom properties
- Typography using Inter (headings/body) from Google Fonts
- Responsive-first approach with mobile optimization

**Component Architecture:**
- Reusable card components (CourseCard, MentorCard, EventCard, ResourceCard) for consistent data presentation
- Shared layout components (Navbar, Footer, LMSSidebar) for navigation consistency
- Specialized components for LMS features (ProgressDashboard, DiscussionPost)
- Path aliases configured for clean imports (@/ for client, @shared/ for shared code, @assets/ for assets)

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript for API routing
- Vite middleware integration for seamless development experience
- Custom logging middleware for API request tracking
- Session-based architecture prepared for authentication implementation

**Database Layer:**
- Drizzle ORM for type-safe database operations
- PostgreSQL via Neon serverless (configured with WebSocket support)
- Schema-first design with Zod validation integration
- Database credentials managed via environment variables (DATABASE_URL)

**Storage Interface:**
- Abstract storage interface (IStorage) allowing flexible implementation
- In-memory storage (MemStorage) for development
- CRUD operations for user management prepared for expansion

### Data Architecture

**Current Schema:**
- Users table with UUID primary keys, username/password authentication structure
- Drizzle-Zod integration for runtime validation
- Schema migrations managed via drizzle-kit

**Planned Expansions:**
- Course enrollment and progress tracking
- Mentorship matching and session logging
- Resource library with categorization
- Event management with Zoom integration
- Community discussion threads
- Certificate issuance and verification

### Routing Structure

**Public Website:**
- `/` - Hero section with accelerator overview, program pillars, and statistics
- `/about` - Vision, mission, values, team profiles, and OPSB connection
- `/program` - Detailed program structure, pillars, benefits, and timeline
- `/contact` - Application/inquiry form

**LMS Platform:**
- `/lms/dashboard` - Personal progress overview
- `/lms/courses` - Training module library
- `/lms/mentorship` - Mentor matching and session tracking
- `/lms/events` - Calendar with live/recorded sessions
- `/lms/resources` - Downloadable resource library
- `/lms/community` - Discussion boards
- `/lms/certificates` - Achievement and certification display

## External Dependencies

### UI & Design Libraries
- **Radix UI**: Comprehensive suite of accessible, unstyled React components (@radix-ui/react-*)
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **shadcn/ui**: Component collection built on Radix UI primitives
- **Lucide React**: Icon library for consistent visual language
- **class-variance-authority**: Type-safe component variant management

### Database & ORM
- **Neon Database**: Serverless PostgreSQL platform (@neondatabase/serverless)
- **Drizzle ORM**: TypeScript ORM with schema management (drizzle-orm, drizzle-kit)
- **Drizzle-Zod**: Runtime validation integration

### State Management & Data Fetching
- **TanStack Query**: Asynchronous state management (@tanstack/react-query)
- **React Hook Form**: Form state management with validation (@hookform/resolvers)

### Development Tools
- **Vite**: Build tool with HMR and optimized bundling
- **TypeScript**: Type safety across client and server
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Plugins**: Development tooling for Replit environment (@replit/vite-plugin-*)

### Future Integrations (Planned)
- **Zoom API**: Live session hosting and webinar integration
- **Session Management**: connect-pg-simple for PostgreSQL-backed sessions
- **Analytics**: User engagement and learning progress tracking
- **Email Service**: Notification and communication system
- **File Storage**: Cloud storage for resource library and user uploads
