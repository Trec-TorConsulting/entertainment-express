# Portal Premium Experience — Quality Bar (PQB)

This document establishes the authoritative engineering and design quality bar for Entertainment Express authenticated portals (`/owner`, `/employee`, `/client`). All pull requests touching portal code must adhere to these budgets and criteria before merging.

---

## 1. Perceived Performance Budgets

Measured on cold load over TLS on a simulated **Fast 3G** network profile (Lighthouse mobile preset) against staging:

| Metric | Budget | Enforced In |
|---|---|---|
| **Largest Contentful Paint (LCP)** | ≤ 2.5 s | Lighthouse CI |
| **Cumulative Layout Shift (CLS)** | ≤ 0.1 | Lighthouse CI |
| **Total Blocking Time (TBT)** | ≤ 300 ms | Lighthouse CI |
| **First-Route JS (gzip)** | ≤ 180 KB | Bundle Analyzer / Vite Build |
| **Subsequent Cached Navigation** | ≤ 100 ms paint | Client-side Router Metrics |

### Lighthouse Score Thresholds

| Category | Mobile (Fast 3G) | Desktop |
|---|---|---|
| **Performance** | ≥ 80 | ≥ 90 |
| **Accessibility** | 100 | 100 |
| **Best Practices** | ≥ 95 | ≥ 95 |

---

## 2. Accessibility (a11y) Standards

- **Standard:** **WCAG 2.1 Level AA** compliance across all portal screens.
- **Automated Gate:** axe-playwright scans on home and flagship routes must return **zero critical** and **zero serious** violations.
- **Touch Targets:** Minimum 44×44 CSS px for all interactive elements (buttons, links, form controls) on touch viewports.
- **Keyboard Navigation:**
  - Clear, visible focus indicators matching `--ee-brand` with high contrast.
  - Logical DOM tab order following visual reading layout.
  - Modals and slide-over sheets must trap focus and return focus to trigger on close.
  - `Esc` key dismisses open dialogs, sheets, and popovers.
  - Skip-to-content links provided at the top of application shells.
- **Color Contrast:** Minimum 4.5:1 for normal text, 3:1 for large text and essential UI controls/icons.

---

## 3. Visual Regression Gates

Flagship screens are protected by automated visual regression checks using Playwright:

| ID | Screen / Route | Viewport(s) | Threshold |
|---|---|---|---|
| **O1** | `/owner` (Today) | 1280×800, 390×844 | ≤ 0.1% diff |
| **O2** | `/owner/pipeline` (Workspace) | 1280×800, 390×844 | ≤ 0.1% diff |
| **O3** | `/owner/money` | 1280×800 | ≤ 0.1% diff |
| **O4** | `/owner/brand` | 1280×800 | ≤ 0.1% diff |
| **E1** | `/employee` (My Day) | 390×844 | ≤ 0.1% diff |
| **E2** | `/employee/dispatch` | 1280×800 | ≤ 0.1% diff |
| **C1** | `/client` (Home) | 390×844 | ≤ 0.1% diff |
| **C2** | `/client/events/:id` | 390×844 | ≤ 0.1% diff |
| **C3** | `/client/pay` | 390×844 | ≤ 0.1% diff |
| **C4** | `/client/planning` | 390×844 | ≤ 0.1% diff |

Any unintended visual diff fails CI. Intentional design changes require updated reference baselines in the same PR.

---

## 4. Interaction, Loading & State Architecture

### Loading States
- Every data-fetching view renders a skeleton layout matching the final content geometry within one animation frame.
- Skeletons enforce a minimum display threshold (200 ms) to prevent high-frequency visual flicker on fast connections.
- Spinners may only be used for small inline actions (e.g., inside buttons during submission). Full-page spinners are forbidden.

### Error States
- API 4xx/5xx responses display inline, recoverable error banners with an explicit "Try again" action.
- Navigation shell remains functional even when individual view data fails.
- Toast notifications accompany failed mutation operations with diagnostic context and optional retry.

### Empty States
- Zero-data views must present an illustrated or icon-led empty state with **one primary action**.
- Dead-end empty views ("No data found") are strictly prohibited.

### Motion & Reduced Motion
- Standard motion durations:
  - Fast: `120 ms` (`--ee-motion-fast`)
  - Normal: `200 ms` (`--ee-motion-normal`)
  - Slow: `320 ms` (`--ee-motion-slow`)
- When `prefers-reduced-motion: reduce` is active:
  - Non-essential animations, transitions, and celebrations (e.g. confetti) are disabled.
  - Essential state changes switch instantly without animation.

---

## 5. Density System

| Density | Target Surface | Control Height | Padding | Typographic Scale |
|---|---|---|---|---|
| **Cockpit** | `/owner` | 32–36 px | Compact (0.5rem) | 13 px body, high density |
| **Ops** | `/employee` | 38–40 px | Standard (0.75rem) | 14 px body, field-ready |
| **Consumer** | `/client` | 44–48 px | Generous (1.0rem) | 16 px body, high whitespace |

---

## 6. PR Review Sign-Off Checklist

Before merging any portal PR or closing a phase task, verify:
- [ ] Lighthouse CI check passes without performance or a11y regressions.
- [ ] axe audit reports 0 critical and 0 serious violations.
- [ ] Visual regression snapshot tests pass on both desktop and mobile viewports.
- [ ] Dark mode rendering verified with zero low-contrast text.
- [ ] Tap targets meet 44×44 px minimum on mobile touch viewports.
- [ ] Skeletons display correctly before data load; errors offer retry.
- [ ] No client-side currency parsing or math (backend strings only).
