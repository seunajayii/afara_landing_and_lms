# Design Guidelines: AFÁRÁ Accelerator Platform

## About AFÁRÁ

AFÁRÁ is a business accelerator that supports female-owned and led African companies in the Energy and Infrastructure space. The platform provides comprehensive training, mentorship, resources, and community for women entrepreneurs building transformative projects across the continent.

**Parent Company**: Open Spaces & Bridges Advisory (OPSB) - mentioned subtly in footer

## Design Approach

**Single-Identity Strategy**: AFÁRÁ is the primary and sole brand identity for this platform. The design should feel empowering, bold, and community-driven while maintaining professional credibility for the energy and infrastructure sector.

**Primary Inspiration**: 
- Clean learning interfaces + vibrant African-inspired color accents
- Community-focused layouts emphasizing connection and growth
- Bold typography reflecting confidence and entrepreneurial spirit

## Color Palette

### AFÁRÁ Brand (Bold & Empowering)
- **Primary**: Deep forest green `160 85% 20%` - Growth, infrastructure, African heritage
- **Secondary**: Warm off-white `42 60% 96%` - Clean, approachable environment
- **Accent**: Teal green `160 40% 88%` - Highlighting progress and achievements
- **Brand Identity**: Bold, empowering, entrepreneurial - designed for women leaders

### Supporting Colors
- **Success**: Forest green variations for progress indicators
- **Highlight**: Warm cream/gold tones for featured content
- **Community**: Teal accents for social features

### Dark Mode
- Adjusted luminosity maintaining brand identity
- Forest green accents with warm off-white adjusted for dark mode readability
- Maintain empowering, professional feel

## Typography

**Font Stack**:
- **Headings**: 'Inter' - 600/700 weights for strong hierarchy
- **Body**: 'Inter' - 400/500 weights for readability
- **Brand Name**: Always display as "AFÁRÁ" (all capitals with accent marks)

**Scale**:
- H1: text-5xl md:text-6xl (bold, 700)
- H2: text-3xl md:text-4xl (semibold, 600)
- H3: text-2xl md:text-3xl (semibold, 600)
- Body: text-base md:text-lg (normal, 400)
- Small: text-sm (medium, 500)

## Layout System

**Spacing Primitives**: Use Tailwind units of 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- Component padding: p-6 to p-8
- Section spacing: py-16 md:py-24 lg:py-32
- Grid gaps: gap-6 to gap-12

**Container Strategy**:
- Max-width: max-w-7xl for full sections
- Content areas: max-w-6xl
- Text content: max-w-4xl for optimal reading

**Grid System**:
- Flexible grids for courses (3-4 cards)
- 2-column mentor profiles
- Full-width hero sections

## Component Library

### Navigation
**Public Site**: Clean horizontal nav with Home, About, Program, Contact, and LMS access button
**LMS Dashboard**: Sidebar with icon navigation for modules, resources, community, profile (collapsible on mobile)

### Hero Sections

**Landing Page Hero**:
- Full-width with background image of African infrastructure or women entrepreneurs
- Compelling headline about empowering women in energy/infrastructure
- Clear value proposition
- Dual CTAs: "Apply Now" (primary) + "Learn More" (outline)
- Dark wash gradient for text readability

**LMS Dashboard Hero**:
- Welcome banner with personalized greeting
- Progress ring visualization
- Quick stats: Modules Completed, Mentorship Hours, Community Posts
- Gradient background with brand colors

### Cards & Content Blocks

**Program Feature Cards**:
- Rounded corners (rounded-md)
- Icon with forest green accent
- Clear benefit-focused content
- Hover elevation effect

**Course/Module Cards**:
- Progress bar at bottom (gradient: forest green)
- Course thumbnail with overlay gradient
- Duration badge, difficulty indicator

**Mentor Profile Cards**:
- Circular avatar with forest green border
- Bio excerpt with "Connect" CTA
- Expertise tags in brand colors
- Availability indicator

**Success Story Cards**:
- Photo of entrepreneur with overlay
- Quote highlighting achievement
- Business/project information

### Learning Interface Components

**Video Player**:
- Custom controls with AFÁRÁ branding
- Progress saving with visual indicator
- Playback speed controls

**Resource Library**:
- Card grid with file type icons
- Search with instant filtering
- Category navigation

**Certification Display**:
- Digital certificate with AFÁRÁ branding
- Downloadable PDF version
- Share to LinkedIn integration

## Afrocentric Design Elements

**Geometric Patterns**:
- Adinkra symbol derivatives as subtle backgrounds (5-10% opacity)
- Kente-inspired grid patterns for section dividers
- Angular geometric shapes reflecting African textile art

**Color Philosophy**:
- Earth tones with vibrant accent pops
- Forest green representing growth and infrastructure
- Warm cream/gold representing African warmth and prosperity

**Imagery Style**:
- Authentic African professional photography
- Women in leadership/entrepreneurial settings
- Infrastructure in African contexts (solar farms, energy projects, bridges)
- Warm, natural lighting with cultural authenticity

## Images

### Landing Page
1. **Hero Image**: African woman entrepreneur in energy/infrastructure setting OR solar farm/infrastructure at golden hour
2. **Program Section**: Women in collaborative work environment
3. **Success Stories**: Alumni headshots and project photos

### LMS Platform
1. **Dashboard Welcome**: Abstract geometric pattern with Afrocentric motifs
2. **Course Thumbnails**: Custom illustrations for each module topic
3. **Community Section**: Cohort members in networking settings
4. **Mentor Profiles**: Professional headshots with circular crop

## Accessibility & Performance

- WCAG AA contrast ratios minimum (AAA for body text)
- Dark mode toggle in navigation
- Lazy loading for images below fold
- Skeleton screens for content loading states
- Keyboard navigation for all interactive elements
- Form inputs with clear error states
- Icon-only buttons include aria-labels

## Animations

Use sparingly and purposefully:
- Smooth page transitions (300ms ease-in-out)
- Card hover lifts (transform: translateY(-4px))
- Progress bar fills (animated on scroll into view)
- Micro-interactions on CTAs
- NO distracting auto-playing animations

## Footer

Simple, clean footer containing:
- AFÁRÁ logo
- Quick navigation links
- Contact information
- Social media links
- "An OPSB Initiative" with subtle link to parent company
- Copyright notice
