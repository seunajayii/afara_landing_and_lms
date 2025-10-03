# OPSB & AFÁRÁ Platform

## Overview

This is a dual-brand web platform combining the Open Spaces & Bridges Advisory (OPSB) corporate website with the AFÁRÁ Learning Management System (LMS). OPSB serves as the parent brand providing professional advisory services for African energy and infrastructure projects, while AFÁRÁ is an entrepreneurship accelerator specifically designed for women-led ventures in the sector.

The platform features a responsive corporate website showcasing OPSB's services, track record, and team, alongside a comprehensive LMS delivering training modules, mentorship tracking, resource libraries, and community engagement tools for AFÁRÁ program participants.

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
- Dual-identity color scheme: Deep maroon (#550202) for OPSB corporate, Forest green (#001b12) for AFÁRÁ LMS
- **Brand Assets**: 
  - OPSB logo (maroon background) in Navbar and Footer
  - AFÁRÁ logo (dark green background) in LMS Sidebar
  - Typography: "AFÁRÁ" displayed in ALL CAPS with accent marks throughout platform
- shadcn/ui component library with Radix UI primitives for accessible, customizable UI components
- Theme system supporting light/dark modes with CSS custom properties
- Typography using Inter (headings/body) and DM Sans (accents) from Google Fonts
- Responsive-first approach with mobile optimization for low-bandwidth environments

**Component Architecture:**
- Reusable card components (CourseCard, MentorCard, EventCard, ResourceCard, TransactionCard) for consistent data presentation
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

**Corporate Website (OPSB Brand):**
- `/` - Hero section with service overview
- `/about` - Mission, vision, team profiles
- `/services` - Detailed service offerings
- `/track-record` - Filterable project portfolio
- `/afara` - AFÁRÁ program overview with LMS call-to-action
- `/contact` - Inquiry form

**LMS Platform (AFÁRÁ Brand):**
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