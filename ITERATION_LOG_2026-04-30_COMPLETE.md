# Iteration Log — 2026-04-30

## Theme

Loading transparency, report-score reliability, legal disclosure polish, Profile visual redesign, unified character presentation, audio playback closure, and production deployment.

## Changes Completed

### 1. Added visible progress UI for slower AI-generated pages

Implemented:

- `src/components/LoadingProgressCard.jsx`

Applied to:

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

### 4. Rebuilt the Profile hero into a character-led visual section

Updated:

- `src/pages/Profile.jsx`
- `src/components/CharacterFigure.jsx`
- `src/index.css`

What changed:

- replaced the plain text-first profile header with a large central character composition
- added a reusable front-facing `CharacterFigure` component
- added animated orbit lines, floating motion, and softer profile spacing
- added floating skill tags around the main character:
  - `发音标准`
  - `自信表达`
  - `节奏稳定`

Why:

- the profile page felt too text-heavy
- the user wanted a stronger visual centerpiece closer to a modern character-card UI

### 5. Unified the Profile character and Virtual Examiner character style

Updated:

- `src/components/CharacterFigure.jsx`
- `src/pages/Profile.jsx`
- `src/pages/VoiceChat.jsx`

What changed:

- switched both Profile and Voice Chat to the same front-facing character language
- removed the previous photo-style virtual examiner block
- rendered the voice examiner as a centered character card with matching motion and layout tone

Why:

- the user explicitly requested one unified person-facing-you style
- the previous visual mix of generated-style profile character plus photo-based examiner felt inconsistent

### 6. Fixed and minimized Profile background music playback

Updated:

- `src/pages/Profile.jsx`
- `public/tuxedo-back-in-town.wav`

What changed:

- removed dependency on the unsupported `.mgg` public asset path
- moved playback to a verified `.wav` source
- added browser support detection before binding the audio source
- moved the music controls from a large in-page card to a small bottom-right floating control
- kept mute and volume controls available in a compact panel

Why:

- the old public `.mgg` file was not browser-playable
- the large BGM panel was visually too prominent for the page

### 7. Added a lightweight motion language across common UI controls

Updated:

- `src/components/ui/button.jsx`
- `src/index.css`

What changed:

- added a reusable `interactive-button` class to shared buttons
- introduced hover lift and press feedback for button interactions
- increased base typography scale slightly across the app for readability
- adjusted Profile hero spacing to match the larger text rhythm

Why:

- the user wanted the good “big character” motion feeling to influence other parts of the UI
- the app needed a slightly stronger visual rhythm without reworking every screen manually

## Verification

### Build verification

Checked:

- `npm run build`

Result:

- passed

### Loading progress flow verification

Checked:

- loading progress component paths compile correctly
- the three target AI-generated pages still build with staged progress UI

Result:

- passed code-path verification

### Presentation report score normalization verification

Checked:

- report pages include fallback computation paths for missing `overall_score`
- history path still resolves total score when only sub-scores exist

Result:

- passed code-path verification

### Legal dialog integration verification

Checked:

- `AuthPage` includes visible legal acknowledgment and modal wiring

Result:

- passed code-path verification

### Profile hero redesign verification

Checked:

- `src/pages/Profile.jsx` contains the large hero character stage and floating skill tags
- `src/components/CharacterFigure.jsx` exists and is wired into Profile
- `src/index.css` contains the required motion and character styles

Result:

- passed code-path verification

### Virtual Examiner redesign verification

Checked:

- `src/pages/VoiceChat.jsx` imports and uses `CharacterFigure`
- the centered examiner card still renders role title and context

Result:

- passed code-path verification

### Profile BGM verification

Checked:

- `public/tuxedo-back-in-town.wav` exists
- Profile now uses the `.wav` source path
- old `.mgg` public path is no longer referenced by source code

Result:

- passed code-path verification

### Shared motion and typography verification

Checked:

- `src/components/ui/button.jsx` now applies `interactive-button`
- `src/index.css` contains hover/active motion rules
- base `html` and `body` text sizes were increased

Result:

- passed code-path verification

### Deployment verification

Checked:

- deployed to Vercel production
- production alias points to:
  - `https://omniverse-ent208.vercel.app`

Result:

- passed

## Remaining Recommended Manual Tests

- manually test loading progress behavior on production for:
  - voice report
  - presentation analysis
  - presentation report
- verify legal dialogs display correctly on both login and register modes
- confirm saved historical presentation sessions still show total scores after refresh
- open `Profile` on production and verify the floating skill tags do not overlap badly on a smaller phone viewport
- verify the bottom-right BGM control is reachable above the bottom nav on both iPhone-sized and Android-sized screens
- verify the Virtual Examiner card still feels balanced when scenarios have long context text
- click major shared buttons on production and confirm the motion feels responsive rather than distracting
