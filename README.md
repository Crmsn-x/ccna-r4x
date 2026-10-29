# CCNA Revise — Private Local Revision Web App

A private, single-user CCNA 200-301 revision and assessment web application designed to run entirely locally on the owner's PC.

---

## 1. Local Stack & Single-Process Assumptions

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5 (Strict Mode, native Node type stripping)
- **Styling**: Tailwind CSS v4 + Semantic CSS Custom Properties for Light & Dark themes
- **Storage**: Server-side Atomic JSON store behind a clean `Store` abstraction (`src/server/store/jsonStore.ts`)
- **Hosting / Network**: Bound strictly to `127.0.0.1` (loopback). Not approved for LAN or public exposure.
- **Single-Process Assumption**: Runs as a single local Node.js process. Multiple concurrent server instances or external edits to `data/user-data.json` while running are unsupported.
- **Zero Secrets / Zero Remote Dependencies**: No external database, cloud auth, or remote fonts. Fonts use local system sans-serif and monospace stacks.

---

## 2. Quick Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts local development server on `http://127.0.0.1:3000` |
| `npm run build` | Compiles optimized production bundle with TypeScript and route validation |
| `npm run start` | Runs local production server on `http://127.0.0.1:3000` |
| `npm test` | Runs the test suite via Node 24 built-in test runner (`tests/core.test.ts`) |
| `npm run lint` | Runs ESLint checks across the codebase |

---

## 3. Data Locations & File Structure

```text
web-app/
├── data/
│   ├── questions.seed.json   # Immutable canonical seed containing all 75 questions + tags
│   ├── user-data.json        # Mutable user records (attempts, sessions, overrides) [Git ignored]
│   ├── backups/              # Automated dated daily backups (backup-YYYY-MM-DD.json) [Git ignored]
│   └── assets/               # Imported assets & future lab files [Git ignored]
├── public/
│   └── exhibits/             # Shipped, non-sensitive exhibit images (image1-6)
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── layout.tsx    # Shared responsive shell (sidebar, theme toggle, mobile nav)
│   │   │   ├── page.tsx      # Overview dashboard with honest status counts
│   │   │   ├── bank/         # Question Bank explorer with search & filter controls
│   │   │   ├── practice/     # Practice session setup (Phase 2 placeholder)
│   │   │   ├── review/       # Spaced repetition review (Phase 3 placeholder)
│   │   │   ├── progress/     # Transparent analytics (Phase 3 placeholder)
│   │   │   ├── labs/         # Practical Labs (Phase 5 placeholder, honest status)
│   │   │   └── manage/       # Backup & content management (Phase 4 placeholder)
│   │   ├── api/              # Server endpoints (GET /api/questions, GET /api/questions/[id])
│   │   └── globals.css       # Semantic tokens for Light & Black/Crimson Dark themes
│   ├── domain/               # Pure domain logic (types, validators, marking, sanitizer, scheduling)
│   ├── server/store/         # Store interface & reliable JSON adapter with atomic writes
│   └── components/           # UI components (ThemeToggle, etc.)
└── tests/
    └── core.test.ts          # 14 passing tests (validation, marking, sanitizer, scheduling, store)
```

---

## 4. Phase 0 Asset Inventory & Content Verification

Source document: `test-1 qb.docx` (313 KB Word archive)

### Question Bank Counts
- **Total Source Questions Accounted For**: 75 (Source numbers Q1 through Q75)
- **Single Choice**: 58 questions
- **Multiple Choice**: 9 questions (e.g. Choose two, Choose three)
- **Matching**: 6 questions (Q5, Q9, Q27, Q28, Q36, Q41)
- **Ordering**: 2 questions (Q24, Q41; Q45 is classified as single choice with sequence options)
- **Development Fixtures**: 2 labelled fixtures (`dev-fixture-01`, `dev-fixture-02`) explicitly excluded from real study progress.

### Honest Status Tracking
- **Verified (`status: 'verified'`)**: **0 questions**. Per the build brief, AI-drafted answers start strictly unverified. Verification requires documented checking against authoritative references.
- **Unverified Drafts (`status: 'unverified'`)**: **73 questions**. Extracted with full answer options and draft explanations, awaiting independent authoritative review.
- **Needs Source (`status: 'needs-source'`)**: **2 questions**.
  1. **Q52**: References an absent Packet Tracer activity (`.pkt`). Excluded from practice sessions until the activity file is supplied or a reviewed replacement is authored.
  2. **Q5**: Missing matching label. The prompt describes "Match the type of communication with a specific priority" (Quality of Service / QoS), but QoS is missing from the source choice list. Excluded until reviewed.

### Known Items & Cleanup Notes
- **Q27**: Source document contained `...` in text body. The complete matching matrix with 3 target modes and 7 descriptions was restored from exhibit `image3.jpeg`.
- **Q58 & Q60**: Flagged as duplicate group `dup-soho-remote-office` (both ask for SOHO network definition). Both source records are preserved.
- **Q65 & Q68**: Flagged as duplicate group `dup-osi-layer-ip-encapsulation` (both ask for PDU encapsulation OSI layer). Both source records are preserved.
- **Q74**: Source option contains typo `"Fire optic cable"`. Preserved exactly as written in the source with a cleanup note indicating `"Fiber optic cable"`.
- **Q8**: Asks for `"Which of the four network characteristics..."` but provides 5 options including `"reliability"`. Preserved with note.
- **Q18, Q24, Q27, Q43, Q52, Q54**: Successfully extracted 6 exhibits from the Word document and placed in `public/exhibits/`.

---

## 5. Phase 1 Foundation Features

1. **Theme System**:
   - **Light Theme**: `#F7F8FA` page, `#FFFFFF` panel, `#14243B` sidebar, `#172033` primary text, `#2563EB` accent.
   - **Dark Theme (Crimson)**: `#000000` page, `#0F0F10` panel & sidebar, `#EDEDED` primary text, `#DC143C` crimson accent.
   - Distinct incorrect answer styling (`--incorrect-*`) separate from crimson action accents.
   - Zero-flash inline script in `<head>` and React 19 `useSyncExternalStore` in `ThemeToggle`.
   - Full keyboard focus rings (`:focus-visible`) and reduced-motion query support (`prefers-reduced-motion`).
2. **Responsive Shell**:
   - Desktop sidebar with brand, live system indicators, and clear navigation.
   - Mobile compact bottom bar with primary links and a "More" drawer.
3. **Question Bank Explorer (`/bank`)**:
   - Filter by review status (Draft, Needs Source, Verified), question type, and CCNA exam domain.
   - Fast full-text search across prompts, question numbers, and external IDs.
   - Detailed inspector view displaying question prompt, structured code blocks, exhibit viewer with click-to-enlarge modal, option structures, and thorough explanations.
   - Honest badges for draft materials and clear warning alerts for missing source requirements.
4. **Reliable JSON Store**:
   - Separation of immutable seed (`data/questions.seed.json`) and mutable user records (`data/user-data.json`).
   - Promise-chained mutation queue surviving development hot-reloads on `globalThis`.
   - Atomic disk writes via temporary files (`.tmp.[uuid].json`) and rename replacements.
   - In-memory rollback on validation/disk failure.
   - Automatic dated daily backups (`data/backups/backup-YYYY-MM-DD.json`) before the day's first mutation.
5. **Deterministic Pure Domain Modules**:
   - Pure handwritten runtime validators with actionable error messages (`src/domain/validators.ts`).
   - Pure deterministic marking engine for single, multi (order-independent set comparison), matching, and ordering (`src/domain/marking.ts`).
   - Client session snapshot sanitizer withholding answer keys and explanations (`src/domain/sanitizer.ts`).
   - Pure Leitner 5-box scheduling engine with 0, 1, 3, 7, and 21 day intervals (`src/domain/scheduling.ts`).

---

## 6. Testing & Acceptance Checks

Run tests with:
```bash
npm test
```
Current test suite covers:
- Runtime validation (missing IDs, needsSourceReason requirement, multi-choice selection counts, store schemas).
- Deterministic marking (exact single, order-independent multi all-or-nothing, exact ordering sequences).
- Answer-key withholding (sanitized snapshots stripping solutions and explanations).
- Leitner scheduling boundaries (box advancement, cap at box 5, unsure/guessed retention, reset to box 1 on error).
- Store reliability and submission idempotency.

Run linter:
```bash
npm run lint
```

Run build:
```bash
npm run build
```

---

## 7. Next Phases Roadmap

- **Phase 2 (Sessions)**: Practice session runner, interactive question renderers (no dragging), draft autosave, confidence capture, Learn/Assess separation, server timing, and results.
- **Phase 3 (Review & Progress)**: Leitner review study loops (Missed, Guessed, Due, Bookmarked) and transparent coverage/accuracy analytics.
- **Phase 4 (Content Management)**: Question editing with version history snapshots, JSON bank import/preview, and backup export/restore UI.
- **Phase 5 (Practical Labs)**: Integrated multi-concept lab scenarios with topology specifications, requirements, staged hints, and verification checklists.
