# Clausify — Browser Extension

> **Know what you're signing.** Clausify automatically detects Terms & Conditions pages and gives you a plain-language risk score before you click "I agree."

---

## What it does

When you land on a page containing Terms of Service, Privacy Policy, or General Conditions (CGV), Clausify:

1. **Detects** the page automatically via keyword matching (French & English)
2. **Analyzes** the full text by sending it to a backend API
3. **Scores** the document 0–100 (higher = safer) and categorises risky clauses by severity
4. **Shows** a popup summary with a visual score ring and per-clause breakdown

You can also manually import a `.txt` or `.pdf` file for analysis without visiting the site.

---

## Clause categories

| Type | Label |
|---|---|
| `personal_data` | Données personnelles |
| `third_party_resale` | Revente à des tiers |
| `abusive_clause` | Clause abusive |
| `retention_duration` | Durée de conservation |
| `recourse_rights` | Droits de recours |

Severity levels: `low` · `medium` · `high` (high clauses are shown first)

---

## Score tiers

| Score | Verdict |
|---|---|
| 60 – 100 | Plutôt fiable |
| 35 – 59 | À lire avec attention |
| 0 – 34 | Clauses problématiques |

---

## Architecture

```
src/
├── background/   # Service worker — state machine, API calls
├── content/      # Content script — page detection & text extraction
├── popup/        # Popup UI — renders all states
└── shared/       # Types and constants shared across all scripts
```

The three scripts communicate via Chrome's `runtime.sendMessage`:

```
content script  →  CGV_DETECTED       →  background
background      →  GET_CGV_TEXT       →  content script
content script  →  ANALYZE_REQUEST    →  background  →  POST /api/analyze
background      →  ANALYSIS_RESULT    →  popup
```

State is owned by the background service worker and synced to the popup on open via `GET_CURRENT_STATE`.

---

## Prerequisites

- Node.js ≥ 18
- Yarn 4 (`corepack enable`)
- The [Clausify backend](http://localhost:3000) running locally

---

## Getting started

```bash
# Install dependencies
yarn install

# Development build with watch
yarn dev

# Production build
yarn build

# Type-check without emitting
yarn type-check
```

The compiled extension lands in `dist/`.

### Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `dist/` folder

---

## Configuration

The backend URL is set in [src/shared/constatnts.ts](src/shared/constatnts.ts):

```ts
export const API_BASE_URL = "http://localhost:3000";
```

Change this before building for a non-local deployment.

---

## Permissions used

| Permission | Why |
|---|---|
| `activeTab` | Read the URL and title of the current tab |
| `tabs` | Open the full web report in a new tab |
| `storage` | (Reserved for future caching) |
| `host_permissions: <all_urls>` | Run the content script on every page |

---

## Tech stack

- **TypeScript** compiled with `ts-loader` + Webpack
- **Manifest V3** service worker architecture
- Vanilla DOM rendering in the popup (no framework)
- CSS bundled via `style-loader` / `css-loader`
