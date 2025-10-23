# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Quick Commands

```bash
# Development
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking

# Database
npm run import-jobs  # Import jobs from CSV (scripts/jobs.csv)
```

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + Framer Motion (animations)
- **Routing**: React Router v7
- **State Management**: Zustand (lightweight auth store)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Forms**: React Hook Form
- **Notifications**: React Toastify
- **Icons**: Lucide React

### Project Structure

```
src/
├── pages/               # Full-page components (routes)
│   ├── LandingPage.tsx
│   ├── auth/           # Authentication pages (login, register, password reset)
│   ├── jobs/           # Job browsing (JobsPage, JobDetailPage)
│   └── dashboard/      # Protected user dashboard
├── components/
│   ├── ui/             # Reusable UI components (Button, Input, Card)
│   └── 3d/             # Visual effects (ParticleBackground, LegalBackground3D)
├── contexts/           # React Context (AuthContext for auth state)
├── store/              # Zustand store (authStore)
├── lib/                # Supabase client initialization
├── utils/              # Helpers (companyLogos.ts)
└── types/              # TypeScript interfaces (User, Job, Profile, etc.)
```

### Key Data Flows

**Authentication Flow**:
1. AuthProvider wraps app, uses AuthContext (context/AuthContext.tsx)
2. State stored in Zustand (store/authStore.ts)
3. User/Profile fetched from Supabase on mount and auth state changes
4. ProtectedRoute wrapper enforces auth requirements per route

**Job Display Flow**:
1. JobsPage queries jobs table from Supabase
2. Company logos resolved via companyLogos.ts (deterministic fallback → company initials badge)
3. Jobs filtered/searched client-side
4. JobDetailPage displays individual job with full description

### Color System (Legal Theme)

Tailwind config includes custom `legal-*` color scales:
- **legal-navy**: Professional authority (primary brand color)
- **legal-gold**: Premium/success accents
- **legal-red**: Confidence/call-to-action
- **legal-slate**: Text and neutrals

All colors WCAG 2.1 AA compliant. See `tailwind.config.js` for full palette.

### Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Prefixed with `VITE_` to expose to client (Vite convention).

## Common Development Tasks

### Adding a New Page
1. Create `.tsx` file in `src/pages/` with React component
2. Add route in `src/App.tsx` Routes component
3. If protected: wrap in `<ProtectedRoute>` component

### Adding UI Components
- Keep reusable components in `src/components/ui/`
- Use Framer Motion (`motion.*`) for animations
- Apply Tailwind classes and legal color scheme
- Export from component file directly

### Working with Database
- Supabase client initialized in `src/lib/supabase.ts`
- Use `supabase.from('table_name')` for queries
- All main entities: `users`, `profiles`, `jobs`, `applications`, `saved_jobs`
- Row-level security (RLS) policies enforce data isolation

### Importing Jobs
1. Prepare CSV with columns: title, company, location, job_type, posted_by, posted_date, deadline, compensation, category, description
2. Place file at `scripts/jobs.csv`
3. Run `npm run import-jobs`
4. Script validates, clears old data, batch-imports with error handling
5. All jobs imported as `tier_requirement: 'free'` and `status: 'active'`

## Database Schema (Key Tables)

**jobs**: Stores job listings with tier-based visibility and application tracking
- Columns: id, title, company, location, compensation, category, description, tier_requirement, status, views_count, applications_count, created_at

**users**: Auth-linked user profiles with subscription info
- Columns: id (UUID from auth), email, subscription_tier, subscription_start/end, role, is_verified

**profiles**: Extended user info (resume, bio, skills, preferences)
- Columns: id, user_id, bio, location, experience_years, skills[], resume_url

**applications**: Job application tracking
- Columns: id, job_id, user_id, cover_letter, status, applied_at

## Testing & Quality

- **ESLint**: React hooks rules + React Refresh rules enabled
- **TypeScript**: Strict checking on app code (`tsconfig.app.json`)
- No unit test framework currently configured
- Manual testing primarily via `npm run dev` and browser

## Known Patterns & Best Practices in Codebase

1. **Framer Motion for animations**: Most interactive elements use `motion.*` components for smooth transitions
2. **Tailwind utility-first**: All styling via Tailwind classes; custom CSS minimal
3. **Responsive design**: Mobile-first breakpoints (sm, md, lg, xl)
4. **Error handling**: Auth checks include timeout safeguards; Supabase errors logged to console
5. **Loading states**: Spinner shown during auth check; buttons have isLoading prop
6. **Navigation**: React Router `navigate()` function used in click handlers for programmatic navigation

## Performance Notes

- Build: ~4s, bundle ~166KB gzipped (JS), ~8KB gzipped (CSS)
- Vite optimizes `lucide-react` imports via `optimizeDeps.exclude` config
- Pexels CDN used for placeholder images (auto-compressed)
- No heavy 3D libraries in current build (previously Three.js, now removed)

## Deployment Considerations

- Single-page app; serves `dist/index.html` as fallback for client-side routing
- Supabase project must have Row Level Security configured for data isolation
- Build environment variables (VITE_*) injected at build time
- No backend API; all data accessed directly via Supabase client
