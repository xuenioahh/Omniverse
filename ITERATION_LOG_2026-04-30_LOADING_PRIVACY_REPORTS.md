# Iteration Log — 2026-04-30

## Theme

Loading transparency, report-score reliability, and legal disclosure polish.

## Changes Completed

### 1. Added visible progress UI for slower AI-generated pages

Implemented a reusable loading progress component:

- `src/components/LoadingProgressCard.jsx`

Applied it to the slowest user-facing flows:

- `src/pages/PresentationReport.jsx`
- `src/pages/VoiceReport.jsx`
- `src/pages/PresentationAnalysis.jsx`

What changed:

- replaced generic spinner-only loading screens
- added staged progress bars with user-readable status labels
- gave each workflow separate step labels and expected pacing

Why:

- users were waiting with no feedback when reports or analysis took several seconds
- visible progress reduces perceived delay and makes AI generation feel intentional rather than broken

### 2. Fixed missing overall score in presentation report flow

Updated:

- `src/pages/PresentationReport.jsx`
- `src/pages/PresentationHistory.jsx`

What changed:

- normalized `overall_score` if it is present
- automatically computed `overall_score` from `scores` if the model response omitted it
- ensured report tracking and saved history both use the normalized score
- ensured older history entries without explicit `overall_score` still display a total

Why:

- some report payloads included detailed sub-scores but omitted total score
- this caused missing top-level score display in the report page and history page

### 3. Added disclaimer and privacy notice to the authentication screen

Implemented:

- `src/components/LegalDialog.jsx`

Integrated into:

- `src/pages/AuthPage.jsx`

What changed:

- added a visible short acknowledgment line on the login/register page
- added modal dialogs for:
  - Disclaimer
  - Privacy Notice

Why:

- the app processes speaking records, transcripts, reports, and admin-visible activity data
- users should be clearly informed that the system is educational, AI-assisted, and not suitable for sensitive data

## Verification

- `npm run build` passed after all changes
- checked that loading states compile correctly on all three target pages
- checked that presentation report score display now has a fallback computation path
- checked that history view also resolves total score when only sub-scores exist

## Next Recommended Checks

- manually test loading progress behavior on production for:
  - voice report
  - presentation analysis
  - presentation report
- verify legal dialogs display correctly on both login and register modes
- confirm saved historical presentation sessions still show total scores after refresh
