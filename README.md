# Omniverse

Omniverse is a local-first speaking practice web application built for `ENT208TC Session 4 Group 25`. It combines scenario-based voice conversation, presentation rehearsal, progress tracking, and report generation in a single Vite + React project.

## Overview

The project was designed to support communication practice in two main modes:

- voice conversation practice for scenario-based speaking
- presentation rehearsal for slide-driven speaking tasks

The current repository version is structured so the app can still run locally without requiring a full hosted backend, which makes it easier to review, demonstrate, and submit for coursework.

## Project Information

- Team name: `Omniverse`
- Module / session: `ENT208TC Session 4 Group 25`
- Academic year: `2025-2026`

## Team Members

- Yujie Yang — `2363253`
- Zihan Jiang — `2362327`
- Yile Zhang — `2363305`
- Xinyu Shen — `2363210`
- Zhuoru Zhang — `2363097`

## Key Features

- local register and login flow
- protected routes for authenticated access
- scenario-based voice conversation practice
- presentation rehearsal workflow
- practice history and report pages
- browser-based local persistence
- local API endpoints for coaching and analysis

## User Flows

### Voice Practice

1. sign in to the app
2. choose a speaking scenario
3. configure the practice mode
4. complete a live voice session
5. review the generated report and history

### Presentation Practice

1. sign in to the app
2. prepare or upload presentation material
3. rehearse the presentation flow
4. receive pause feedback and analysis
5. review presentation reports and history

## Technology Stack

- React
- React Router
- Vite
- Tailwind CSS
- Radix UI / shadcn-style components
- TanStack Query
- browser `localStorage`

## Demo

- Live demo: `https://omniverse-ent208.vercel.app`
- Repository: `https://github.com/xuenioahh/Omniverse`

## Screenshots

### Presentation feedback

![Presentation feedback](./docs/images/presentation-feedback.png)

### Voice practice report

![Voice practice report](./docs/images/voice-report.png)

## Local Development

```bash
npm install
npm run dev
```

After startup, open the local Vite URL shown in the terminal.

## Available Scripts

- `npm run dev` starts local development
- `npm run build` creates a production build
- `npm run lint` runs ESLint
- `npm run lint:fix` auto-fixes lint issues where possible
- `npm run typecheck` runs configured TypeScript checking
- `npm run preview` previews the production build locally

## Repository Structure

- `src/pages/`: route-level application pages
- `src/components/`: reusable feature and UI components
- `src/lib/`: storage, business logic, and shared utilities
- `src/api/`: local client wrappers
- `api/`: local server-style endpoints for analysis and coaching
- `supabase/`: retained admin-side schema material

## Local-First Architecture

This project is intentionally local-first for demonstration and coursework review:

- account data can be stored locally
- practice history can be stored locally
- reports can be generated through local logic and fallback behavior

Some API routes can also support model-backed behavior when the relevant environment setup is available.

## Environment Notes

- `.env.example` is included as a reference
- no mandatory hosted backend is required for the base local workflow
- browser support matters because the app relies on media, speech, and storage APIs

## Submission Notes

For a concise project summary and release-style submission text, see [RELEASE_NOTES.md](/Users/zhangzhuoru/Desktop/ent208/Omniverse/RELEASE_NOTES.md).
