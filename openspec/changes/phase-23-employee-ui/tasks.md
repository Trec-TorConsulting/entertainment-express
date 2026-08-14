# Tasks: Phase 23 — /employee UI

> Prereq: phase-21 tokens merged.

## 1. Shell
- [x] 1.1 Ops-density AppShell: desktop left nav; <768px bottom nav (Home, primary ops, Search, Me).
      **Accept:** crew phone layout; dispatcher desktop My Day is a list not a hero.
- [x] 1.2 Command palette remains keyboard-accessible.

## 2. Workspaces
- [x] 2.1 Restyle My Day cards per role using StatCard/DataTable/EmptyState.
      **Accept:** dispatcher sees today's jobs + at-risk.
- [x] 2.2 Sales / Field / Accounting routes use the same table chrome.
      **Accept:** no one-off colors outside tokens.
- [x] 2.3 Dispatch deep-link or embed uses the same tokens as `/employee`.
      **Accept:** opening dispatch does not switch brand color.

## 3. Validate
- [x] 3.1 Non-staff denied `/employee` (existing guard tests).
- [x] 3.2 Rebuild `public/employee/` + bench image.
      **Accept:** main.js 200.
