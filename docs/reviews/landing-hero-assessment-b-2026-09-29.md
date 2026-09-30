# Assessment B — landing hero — 2026-09-29

Target: `src/app/page.tsx`; supporting styles `src/app/page.module.css`, image `public/repassafe-hero.png`. Live URL: https://repassafe-staging.vercel.app/ (requested commit a6e0b7b). Independent detector/browser evidence; no Nielsen scoring, no product edits.

## Deterministic scan

Executed exactly once: `.github/skills/impeccable/scripts/bin/windows-x64/impeccable.exe detect --json src/app/page.tsx`.

- JSON: `[]`, saved verbatim at `.impeccable/critique/landing-hero-detector.json` (untracked).
- Total findings: **0**. Rule names: none. File locations from detector: none. False positives: none to adjudicate.
- Scope is markup TSX only, as required. This empty result does not validate the CSS, bitmap content, contrast, keyboard behavior, or responsive composition.

## Browser evidence

Created a new IAB tab for B, distinct from A/deployment tabs. The visible option is unavailable to subagents; opened a background tab and bound the returned tab 1 as `heroBTab`. Desktop inspection at 1280×720; mobile override at 390×844 after coordinating with A, reloaded to obtain responsive layout. Reset viewport and closed B's tab at completion.

### Desktop

- Live DOM contains the expected H1, hero description, /entrar and /cadastro actions, descriptive image alt, and “Processo rastreável” badge, matching the source.
- Screenshot shows both actions fully visible in the initial viewport. The hero is a two-column composition; H1 occupies four lines. The image is loaded and visible, rather than a broken placeholder.
- Image currentSrc: `/_next/image?url=%2Frepassafe-hero.png&w=750&q=75`; complete true; natural dimensions 691×460. Rendered rect approximately x548, y244, 659×442 (including animation transform). Client document width/body scrollWidth 1265 versus innerWidth1280, consistent with scrollbar; no page-level horizontal overflow observed.
- Fonts status is loaded. Computed body font is Plus Jakarta Sans Variable; H1 Urbanist Variable. This confirms computed families/loading status, not an exhaustive font network trace.

### Mobile

- Actual document client width 375 within innerWidth390 (scrollbar), body/html scrollWidth375: no document horizontal overflow.
- Both hero actions are 335×52 CSS pixels at x20, with tops ~466 and ~530. They remain fully visible in the initial viewport. Mobile nav exposes “Abrir menu” with collapsed semantics.
- Hero image starts around y702 and is therefore partly below the 844px initial fold. Image complete true; currentSrc uses `w=640&q=75`, natural dimensions390×260. Small bitmap copy becomes hard to read at this scale; the real hero copy and CTAs remain readable HTML.
- Concrete recrop defect: image rect begins around x−17, width336; computed width335px, maxWidth100%, margin-left−36.84px. The global max-width clamp prevents module width122% from expanding to offset its −11% margin. Consequently the left brand/decorative content clips at the page edge and the image remains left shifted. Locations: `src/app/page.module.css:751` (122% width/−11% margin), global image maxWidth computed100%, `src/app/page.module.css:11` page overflow hidden. Scrolled screenshot confirmed left-edge clipping and full badge, not horizontal page scrolling. This is a manual browser finding, absent from detector output.
- Animation is active (`page-module___8aEwW__float`); source has reduced-motion override at `src/app/page.module.css:840`. Reduced-motion browser preference was not switched in this evidence run.

### Network and console limitations

- Browser console read at desktop/mobile returned no error/warn entries (`[]`). Loaded image, computed font status, and absence of console errors are limited positive signals; they are not a complete network audit.
- Attempted read-only `performance.getEntriesByType('resource')`; performance is undefined in the CUA sanitized DOM scope, so resource timing/transfer sizes/status codes were unavailable. No alternative browser driver or network bypass used.
- The font set is not iterable in this DOM scope; used its status plus computed styles instead. No invented per-font request status.

## Overlay fallback

CUA documents evaluate as read-only. Mutable title/script preflight and detector script injection are unavailable; no live-server started, no overlay injected, no user-visible overlay claimed, and no browser detector console findings exist. Fallback is CLI plus source/DOM/screenshots. The temporary viewport was reset and B tab closed.
