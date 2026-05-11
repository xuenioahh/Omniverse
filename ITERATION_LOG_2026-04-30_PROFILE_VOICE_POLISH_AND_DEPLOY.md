# Iteration Log — 2026-04-30

## Theme

Profile visual polish, unified character design, voice examiner presence, and production deployment closure.

## Changes Completed

### 1. Rebuilt the Profile hero into a character-led visual section

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

### 2. Unified the Profile character and Virtual Examiner character style

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

### 3. Fixed and minimized Profile background music playback

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

### 4. Added a lightweight motion language across common UI controls

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

## Item-by-item Verification

### Profile hero redesign

Checked:

- `src/pages/Profile.jsx` contains the large hero character stage and floating skill tags
- `src/components/CharacterFigure.jsx` exists and is wired into Profile
- `src/index.css` contains the required motion and character styles

Result:

- passed code-path verification

### Virtual Examiner redesign

Checked:

- `src/pages/VoiceChat.jsx` imports and uses `CharacterFigure`
- the centered examiner card still renders role title and context

Result:

- passed code-path verification

### Profile BGM fix

Checked:

- `public/tuxedo-back-in-town.wav` exists
- Profile now uses the `.wav` source path
- old `.mgg` public path is no longer referenced by source code

Result:

- passed code-path verification

### Shared button motion and typography scaling

Checked:

- `src/components/ui/button.jsx` now applies `interactive-button`
- `src/index.css` contains hover/active motion rules
- base `html` and `body` text sizes were increased

Result:

- passed code-path verification

### Build verification

Checked:

- `npm run build`

Result:

- passed

### Deployment verification

Checked:

- deployed to Vercel production
- production alias points to:
  - `https://omniverse-ent208.vercel.app`

Result:

- passed

## Remaining Recommended Manual Tests

- open `Profile` on production and verify the floating skill tags do not overlap badly on a smaller phone viewport
- verify the bottom-right BGM control is reachable above the bottom nav on both iPhone-sized and Android-sized screens
- verify the Virtual Examiner card still feels balanced when scenarios have long context text
- click major shared buttons on production and confirm the motion feels responsive rather than distracting
