# Design Guidelines: OPSB Corporate Website & Afara LMS Platform

## Design Approach

**Dual-Identity Strategy**: OPSB requires professional credibility and trust, while Afara needs to feel empowering and community-driven. We'll create a unified design language that adapts its tone across both platforms.

**Primary Inspiration**: 
- **OPSB Corporate**: Linear's professional typography + Stripe's color restraint + subtle Afrocentric geometric patterns
- **Afara LMS**: Notion's clean learning interfaces + vibrant African-inspired color accents + community-focused layouts

## Color Palette

### OPSB Corporate (Professional Tone)
- **Primary**: Deep slate blue `215 25% 20%` - Professional, trustworthy, infrastructure-focused
- **Secondary**: Warm terracotta `15 55% 55%` - Subtle African warmth, used sparingly for CTAs
- **Neutrals**: Slate grays `220 10% 95%` to `220 15% 15%` for backgrounds and text
- **Accent**: Bronze gold `35 65% 50%` - For achievements, highlights (use minimally)

### Afara LMS (Bold & Empowering)
- **Primary**: Vibrant sunset orange `25 85% 55%` - Energy, empowerment, African sunsets
- **Secondary**: Deep teal `180 45% 35%` - Growth, infrastructure, balance
- **Community**: Warm amber `40 75% 60%` - Connection, mentorship warmth
- **Success**: Fresh green `145 55% 45%` - Progress, achievement, sustainable development
- **Neutrals**: Same slate system for consistency

### Dark Mode
- Maintain both identities with adjusted luminosity
- OPSB: Darker slate backgrounds `220 15% 12%`
- Afara: Rich dark teal base `180 30% 15%` with vibrant accents

## Typography

**Font Stack**:
- **Headings**: 'Inter' (via Google Fonts) - 600/700 weights for strong hierarchy
- **Body**: 'Inter' - 400/500 weights for readability
- **Accent/Display**: 'DM Sans' (via Google Fonts) - 500/700 for feature highlights

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
- OPSB: 2-3 column layouts for services/transactions
- Afara: Flexible grids for courses (3-4 cards), 2-column mentor profiles

## Component Library

### Navigation
**OPSB**: Clean horizontal nav with dropdown for services, sticky on scroll, subtle shadow
**Afara**: Dashboard-style sidebar (collapsible on mobile) with icon navigation for modules, resources, community, profile

### Hero Sections
**OPSB Corporate Hero**:
- Full-width split layout (60% content, 40% visual)
- Large heading with animated gradient underline in terracotta
- Geometric African pattern overlay (subtle, 10% opacity) on background
- Professional team photo or infrastructure imagery
- Dual CTAs: "Our Services" (primary) + "View Track Record" (outline)

**Afara LMS Dashboard Hero**:
- Welcome banner with personalized greeting
- Progress ring visualization (percentage of program completion)
- Quick stats cards: Modules Completed, Mentorship Hours, Community Posts
- Vibrant sunset gradient background with warm overlays

### Cards & Content Blocks

**Transaction/Project Cards (OPSB)**:
- White cards with subtle slate border
- Hover: Lift effect (shadow-lg) + terracotta border accent
- Filterable tags with pill design
- Clean typography hierarchy

**Course/Module Cards (Afara)**:
- Rounded corners (rounded-xl)
- Progress bar at bottom (gradient: orange to teal)
- Course thumbnail with overlay gradient
- Duration badge, difficulty indicator

**Mentor Profile Cards**:
- Circular avatar with teal border
- Bio excerpt with "Connect" CTA
- Expertise tags in warm amber
- Availability indicator (green dot for active)

### Forms & Inputs

**OPSB Contact Form**:
- Floating labels with slate focus states
- Clean, minimal borders
- Terracotta submit button with hover lift
- Multi-step layout for detailed inquiries

**Afara Discussion/Community**:
- Rich text editor with formatting toolbar
- @mention functionality with autocomplete
- Attachment support with file preview
- Post/Reply threading with indentation

### Data Visualization

**Admin Dashboard (OPSB)**:
- KPI cards: Ventures Funded, Capital Raised, Mentorship Hours
- Line charts (Chart.js) for funding trends
- Heat map for geographic reach across Africa
- Color: Teal for positive metrics, terracotta for highlights

**Founder Progress Dashboard (Afara)**:
- Circular progress indicators for module completion
- Timeline visualization for program milestones
- Badge collection showcase for certifications
- Comparison view: Cohort average vs. individual progress

### Learning Interface Components

**Video Player**:
- Custom controls with Afara branding
- Progress saving with visual indicator
- Playback speed controls
- Transcript toggle (accessibility)

**Resource Library**:
- Card grid with file type icons (Heroicons)
- Search with instant filtering
- Category sidebar navigation
- Download tracking for admins

**Certification Display**:
- Digital certificate with Afara branding
- Downloadable PDF version
- Share to LinkedIn integration
- Achievement gallery view

## Afrocentric Design Elements

**Geometric Patterns**:
- Adinkra symbol derivatives as subtle backgrounds (5-10% opacity)
- Kente-inspired grid patterns for section dividers
- Angular geometric shapes reflecting African textile art

**Color Philosophy**:
- Earth tones with vibrant accent pops
- Sunset gradients (orange to deep purple) for hero sections
- Terracotta and teal as bridge between tradition and innovation

**Imagery Style**:
- Authentic African professional photography (not stock clichés)
- Infrastructure in African contexts
- Women in leadership/entrepreneurial settings
- Warm, natural lighting with cultural authenticity

## Images

### OPSB Corporate Site
1. **Hero Image**: Wide landscape photo of African infrastructure (bridge, solar farm, or modern building) at golden hour - positioned right side of split hero layout
2. **About Section**: Professional team photo in boardroom or site visit - full width with text overlay
3. **Track Record**: Thumbnail images for major projects - grid layout with hover zoom
4. **Afara CTA Section**: Empowering photo of African woman entrepreneur in energy/infrastructure setting - background image with gradient overlay

### Afara LMS Platform
1. **Dashboard Welcome**: Abstract geometric pattern with Afrocentric motifs - header background
2. **Course Thumbnails**: Custom illustrations representing each module topic - card headers
3. **Community Section**: Collage of cohort members (with permission) - banner area
4. **Mentor Profiles**: Professional headshots with consistent circular crop - profile cards
5. **Success Stories**: Before/after project photos from alumni - case study sections

## Accessibility & Performance

- WCAG AA contrast ratios minimum (AAA for body text)
- Dark mode toggle prominent in navigation
- Lazy loading for images below fold
- Skeleton screens for content loading states
- Keyboard navigation for all interactive elements
- Form inputs with clear error states (red-500 with descriptive text)
- Icon-only buttons include aria-labels

## Animations

Use sparingly and purposefully:
- Smooth page transitions (300ms ease-in-out)
- Card hover lifts (transform: translateY(-4px))
- Progress bar fills (animated on scroll into view)
- Micro-interactions on CTAs (scale on click)
- NO distracting auto-playing animations