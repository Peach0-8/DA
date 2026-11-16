# Automated Component Security Validation & Full Multilingual Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Overview
Implement an automated code-driven security and quality validation engine based on Uiverse.io guidelines (zero human admin intervention needed), a dedicated Profile Status view (`Posts`, `In Review`, `Rejected`, `Favorites`) with rejection diagnostic cards and "Edit & Fix" workflows, and an exhaustive multilingual (i18n) overhaul ensuring 100% of UI elements and dynamic content translate accurately across English (`en`), Thai (`th`), Lao (`lo`), and Vietnamese (`vi`).

---

## File Structure & Responsibilities

| File | Responsibility |
| :--- | :--- |
| `app.js` | Core logic: `evaluateComponentSecurity(html, css)`, submission flow with auto-decision, Profile status tab rendering (`posts`, `in-review`, `rejected`, `favorites`), "Edit & Fix" handler, CSP enhancement in preview. |
| `i18n.js` | Multilingual dictionary: comprehensive translations for all 4 languages (`en`, `th`, `lo`, `vi`), including all new status labels, profile tabs, security failure reasons, drawer items, and modal titles; enhanced `applyTranslations()` to cover placeholders and dynamic content. |
| `index.html` | DOM markup: add `In Review` and `Rejected` tabs with badge counters to `#profile-nav-tabs`, attach `data-i18n` attributes across all un-translated elements, drawer items, and settings labels. |
| `scratch/verify_security_and_i18n.js` | End-to-end automated verification script using `puppeteer-core` to test security validation, rejection flow, Profile status tabs, and complete multilingual switching. |

---

## Tasks

### Task 1: Implement Automated Security & Quality Validation Engine
- [ ] In `app.js`, define `evaluateComponentSecurity(html, css)` implementing 5 core Uiverse-parity checks:
  1. `Zero-JS Check`: Rejects `<script>`, `eval(`, `Function(`, `javascript:`, `document.cookie`, `localStorage`.
  2. `No Inline Event Handlers`: Rejects `onclick=`, `onload=`, `onerror=`, `onmouseover=`, `onfocus=`, `onkeydown=`, etc.
  3. `Safe Downloads & Links`: Rejects `<a download>`, `.exe`, `.zip`, `.scr`, `.bat`, `.apk`, `.vbs`.
  4. `No Dangerous Embeds`: Rejects `<iframe`, `<object`, `<embed`, `<meta http-equiv="refresh">`, `<applet`.
  5. `CSS & HTML Sanity`: Rejects styling `body` or `html` directly, ensures at least one valid HTML tag exists.
- [ ] Return `{ passed: boolean, status: 'approved' | 'rejected', checks: [...], reasons: [...] }`.
- [ ] Add Content Security Policy (CSP) `<meta>` tag into `buildPreviewSrcDoc(html, css, ...)` to reinforce browser-level containment.
- [ ] Run syntax check: `node -c app.js`.

### Task 2: Integrate Automated Decision into Upload Studio & Data Layer
- [ ] In `app.js`, update `uploadComponent()` and `handleUploadSubmit()`:
  - Run `evaluateComponentSecurity(html, css)` upon submission.
  - If `passed`: mark component `status: 'approved'`, publish to public community feed and user's uploads.
  - If `rejected`: mark component `status: 'rejected'`, store `rejectionReasons` and `rejectedAt` in user's uploads (so code is not lost), but DO NOT publish to public community feed.
  - Display informative toast informing user of the automated decision.
- [ ] Support re-editing rejected components in Upload Studio via "Edit & Fix" button.
- [ ] Run syntax check: `node -c app.js`.

### Task 3: Profile Modal Status Tabs (`Posts`, `In Review`, `Rejected`, `Favorites`)
- [ ] In `index.html`, update `#profile-nav-tabs` to include:
  - `profile-tab-posts`: Posts (Approved / Published)
  - `profile-tab-in-review`: In Review (Pending / Analyzing)
  - `profile-tab-rejected`: Rejected (Failed Security Check) with counter badge
  - `profile-tab-favorites`: Favorites (Liked Components) with counter badge
- [ ] In `app.js`:
  - Update `renderProfileContent(tab)` to support `'posts'`, `'in-review'`, `'rejected'`, and `'favorites'`.
  - For `rejected`: render each rejected component with a red warning box explaining the exact security reasons that triggered rejection, plus a prominent **"Edit & Fix"** button that loads the code back into the Studio for revision.
  - For `in-review`: render any pending items or informative empty state explaining the automated security pipeline.
  - Update badge counts dynamically in `updateProfileUserInfo()`.
- [ ] Run syntax check: `node -c app.js`.

### Task 4: Complete Multilingual (i18n) Overhaul Across All Languages
- [ ] In `i18n.js`:
  - Add comprehensive translations for all 4 languages (`en`, `th`, `lo`, `vi`) for:
    - Profile status tabs: `profile_tab_posts`, `profile_tab_in_review`, `profile_tab_rejected`, `profile_tab_favorites`.
    - Status badges: `status_approved`, `status_in_review`, `status_rejected`.
    - Security reasons and audit feedback strings.
    - Missing strings in Drawer, Header, Filter Bar, and Settings modal.
  - Enhance `applyTranslations()` to also update `placeholder` and `title` attributes with `data-i18n-placeholder` and `data-i18n-title`.
- [ ] In `index.html`:
  - Add `data-i18n` attributes to all untranslated headers, tabs, buttons, labels, and placeholders.
  - Ensure language change event re-renders active profile tabs and dynamic status badges.
- [ ] Run syntax check: `node -c i18n.js`.

### Task 5: Automated End-to-End Verification with Puppeteer
- [ ] Create `scratch/verify_security_and_i18n.js`:
  - Test Case 1: Submit clean component -> verified and published in `Posts`.
  - Test Case 2: Submit unsafe component with `<script>alert("hack")</script>` -> auto-rejected, appears in `Rejected` tab with security alert and "Edit & Fix" button.
  - Test Case 3: Test language switching through TH, LO, VI, EN -> verify all profile tabs, status badges, drawer menu, and settings labels translate completely without remaining in English.
  - Capture screenshots for verification evidence.
- [ ] Run test with `node scratch/verify_security_and_i18n.js` and verify exit code 0.
- [ ] Commit all changes to git.
