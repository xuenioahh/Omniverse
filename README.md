# Omniverse

`Omniverse` is a Vite + React speaking-practice application that combines voice conversation practice, presentation rehearsal, local account management, and report/history views in one project.

## Project Context

- Team: `Omniverse`
- Session: `ENT208TC Session 4 Group 25`
- Academic Year: `2025-2026`

## Team Members

- Yujie Yang — `2363253`
- Zihan Jiang — `2362327`
- Yile Zhang — `2363305`
- Xinyu Shen — `2363210`
- Zhuoru Zhang — `2363097`

## Core Features

- local register / login flow
- protected app routes
- scenario-based voice conversation practice
- presentation rehearsal flow
- history and report pages
- local persistence through browser storage
- local API endpoints for analysis and coaching logic

## Main User Journeys

### Voice practice

1. sign in
2. choose a voice scenario
3. configure practice mode
4. enter live conversation
5. end session and review the report

### Presentation practice

1. sign in
2. upload or prepare presentation material
3. rehearse slide-by-slide
4. receive pause feedback and analysis
5. review presentation history and reports

## Tech Stack

- React
- React Router
- Vite
- Tailwind CSS
- Radix UI / shadcn-style components
- TanStack Query
- local browser storage

## Run Locally

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal after startup.

## Scripts

- `npm run dev`: start local development
- `npm run build`: create a production build
- `npm run lint`: run ESLint
- `npm run lint:fix`: auto-fix lint issues where possible
- `npm run typecheck`: run TypeScript checking for configured files
- `npm run preview`: preview the built app

## Project Structure

- `src/pages/`: route-level pages
- `src/components/`: reusable feature and UI components
- `src/lib/`: local business logic, storage helpers, and shared utilities
- `src/api/`: local client wrappers
- `api/`: local server-style endpoints used for analysis and coaching
- `supabase/`: retained schema/setup material for admin-side data structure

## Local-First Behavior

The current project is designed to stay runnable without a hosted backend:

- user data is stored locally
- practice history is stored locally
- reports can be generated through local logic and fallback behavior

Some API routes can use model-backed behavior when a compatible key or deployment setup exists, but the app still keeps a usable local path.

## Environment Notes

- `.env.example` is included as a reference
- no mandatory hosted backend is required for the base local workflow
- browser support is important because parts of the app rely on speech, media, and storage APIs

## Upload To GitHub

If you want to publish only this project, upload the contents of this `Omniverse/` folder as the repository root.
