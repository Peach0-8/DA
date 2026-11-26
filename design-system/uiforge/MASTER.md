# UIForge — Precision Studio Design System (MASTER)

> Single source of truth for UIForge's visual direction, semantic tokens, layout rhythm, and UX standards.
> Generated with `ui-ux-pro-max` and tailored to **Precision Dark Studio** (Linear / Vercel / Raycast aesthetic) with full **Dual-Theme** support (`html.dark` default + `html.light`).

---

## 1. Visual Direction
- **Style**: Precision Dark Studio — deep obsidian surfaces (`#09090B` / `#111114` / `#18181D`), crisp 1px hairline borders, minimal ambient architectural dot-grid + subtle top radial spotlight, zero cluttered neon aurora orbs.
- **Hierarchy**: UI components inside gallery cards are the hero; chrome recedes cleanly into high-contrast neutral surfaces with disciplined Electric Indigo (`#6366F1` dark / `#4F46E5` light) primary CTAs.
- **Dual Theme**: Persisted via `localStorage['uiforge_site_theme']` with early pre-paint boot script in `<head>` to eliminate FOUC.

---

## 2. Semantic Color Tokens (`styles.css`)

| Token | Precision Dark (`html.dark`) | Precision Light (`html.light`) | Role |
|---|---|---|---|
| `--bg-canvas` | `#09090B` | `#F8F9FB` | App canvas & fullscreen studio backdrop |
| `--bg-surface` | `#111114` | `#FFFFFF` | Cards, sidebar, modals, segmented rails |
| `--bg-elevated` | `#18181D` | `#F1F3F7` | Active tabs, secondary buttons, badges |
| `--bg-hover` | `#212128` | `#E7EAF0` | Hover state for interactive surfaces |
| `--border-subtle` | `rgba(255,255,255,0.08)` | `rgba(15,23,42,0.09)` | Card frames, section dividers |
| `--border-default` | `rgba(255,255,255,0.13)` | `rgba(15,23,42,0.14)` | Inputs, buttons, dropdowns |
| `--text-primary` | `#FAFAFA` | `#09090B` | Primary headings & titles (contrast > 17:1) |
| `--text-secondary` | `#A1A1AA` | `#4B5563` | Descriptions & metadata (contrast > 7:1) |
| `--text-muted` | `#7C7C86` | `#6B7280` | Captions & non-critical hints (>= 4.5:1) |
| `--accent` | `#6366F1` | `#4F46E5` | Primary CTA, active category pill, focus ring |
| `--accent-cyan` | `#22D3EE` | `#0284C7` | Tailwind badge & secondary telemetry |

---

## 3. Typography
- **Display / Headings**: `Space Grotesk` (`-0.03em` tracking, weights 600–700)
- **Body / UI**: `Inter` + multilingual fallbacks (`Be Vietnam Pro`, `Noto Sans Thai`, `Noto Sans Lao`)
- **Code / Counters / Badges**: `JetBrains Mono` with `font-variant-numeric: tabular-nums`

---

## 4. Layout & UX Rules
1. **Above-the-Fold Discovery**: Compact asymmetric studio header places Hero + Telemetry Strip + Category Rail + Filter Toolbar + Top Component Row within initial desktop viewport.
2. **Single Primary CTA per Viewport Region**: Navbar uses solid Indigo `+ Create` as primary CTA and neutral outlined `Sign In` as secondary.
3. **Accessible Card Actions**: Floating action dock (`Get code`, `Quick copy`, `Share`) reveals on `:hover`, `:focus-within`, and remains always visible on touch devices (`@media (hover: none), (max-width: 640px)`).
4. **WCAG 2.2 Compliance**: Visible `2px solid var(--accent)` focus rings (`:focus-visible`), `scroll-padding-top: calc(var(--header-height) + 20px)` to keep focused controls unobscured by sticky navbar, and full `@media (prefers-reduced-motion: reduce)` handling.
5. **Unified Studios & Modals**: Preview Studio, Creation Studio, Sign In, Profile, Settings, Edit, and Delete dialogs all consume the exact same semantic CSS token primitives while keeping the code editor pane high-contrast dark (`#101014`).
