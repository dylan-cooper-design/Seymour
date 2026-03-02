# Design Token Audit (Phase 2.1)

> Documents all design tokens defined in Tailwind config and globals.css.
> Created: March 2, 2026

---

## 1. Colors (tailwind.config.ts)

Defined under `theme.extend.colors.seymour`:

| Token | Hex | Usage |
|-------|-----|-------|
| `seymour-bg` | `#141414` | Base app background, sidebar |
| `seymour-surface` | `#1e1e1e` | Hover, raised surface, dropdown menu |
| `seymour-surface-2` | `#232426` | Secondary raised surface, composer, user message card, dropdown items |
| `seymour-canvas` | `#1c1d1f` | Main content background |
| `seymour-border` | `#302f2d` | Default border, active nav item bg |
| `seymour-border-subtle` | `#3f3e3a` | Interactive element border variant |
| `seymour-text` | `#e3e2e1` | Primary text |
| `seymour-white` | `#ffffff` | Pure white (Figma --white) |
| `seymour-accent` | `#d4b774` | Active, gold, focus rings, user message border |
| `seymour-error-bg` | `#450a0a` | Error banner background |
| `seymour-error-border` | `#b91c1c` | Error border |
| `seymour-error-text` | `#f87171` | Error text |

Opacity modifiers (e.g. `text-seymour-text/50`, `text-seymour-text/70`) are used for muted text.

---

## 2. Typography

### Font family
| Token | Value | Usage |
|-------|-------|-------|
| `font-sans` | `var(--font-geist), sans-serif` | Body text (Geist from next/font/google) |

### Font size (tailwind.config.ts)
| Token | Size | Line height | Usage |
|-------|------|-------------|-------|
| `text-caps-label` | 10px | 1 | Section labels (Platform, Milestones, etc.) |
| `text-label` | 12px | 1 | Secondary labels, Reset button, status text |
| `text-label-sm` | 14px | 20px | Nav items, dropdown items (Figma Label/14px) |
| `text-body-sm` | 14px | 22px | Chat messages, input, body text (Figma Body/14px) |
| `text-header` | 20px | 30px | Section headers (Figma Header/20px) |

### Default Tailwind sizes in use
| Token | Usage |
|-------|-------|
| `text-xs` | Project switcher, nav items, error/retry, status text |
| `text-sm` | Nav labels, dropdown items, message content |

### CSS variables (globals.css) — not yet mapped to Tailwind
| Variable | Value | Notes |
|----------|-------|-------|
| `--caps-label-font-size` | 10px | Duplicates text-caps-label |
| `--caps-label-font-weight` | 500 | |
| `--caps-label-line-height` | 1 | |
| `--label-font-size` | 12px | No Tailwind token yet |
| `--label-font-weight` | 500 | |

---

## 3. Spacing

### Custom (tailwind.config.ts)
| Token | Value | Usage |
|-------|-------|-------|
| `w-sidebar` | 240px | Sidebar width |
| `min-h-input-line` | 22px | Textarea min height |

### Default Tailwind spacing in use (8px grid)
- `p-2`, `p-3`, `p-4`, `p-6` — padding
- `px-2`, `px-3`, `px-6` — horizontal padding
- `py-1`, `py-2`, `py-4` — vertical padding
- `gap-1`, `gap-2`, `gap-2.5`, `gap-4`, `gap-6` — gaps
- `pt-16`, `pb-6` — message list padding

---

## 4. Width / Max-width

| Token | Value | Usage |
|-------|-------|-------|
| `max-w-chat-content` | 720px | Chat composer, border divider |
| `max-w-message-list` | 744px | Message list container |
| `max-w-bubble` | 85% | User message bubble width |

---

## 5. Border radius

Using default Tailwind radii:

| Token | Value | Usage |
|-------|-------|-------|
| `rounded` | 4px | Nav items |
| `rounded-lg` | 8px | Dropdown menu |
| `rounded-xl` | 12px | — |
| `rounded-2xl` | 16px | Chat composer container |
| `rounded-3xl` | 24px | User message bubbles |
| `rounded-full` | 9999px | Send button, stop button |

---

## 6. Shadows

| Token | Usage |
|-------|-------|
| `shadow-xl` | Dropdown menu (default Tailwind) |

No custom shadow tokens defined.

---

## 7. Gaps

- **globals.css** — no spacing scale variables
- **tailwind.config.ts** — uses default Tailwind spacing (4, 8, 16, 24px etc.)
- `gap-2.5` (10px) used in ChatComposer — not on strict 8px grid

---

## 8. Summary: Token coverage

- **Colors:** 9 semantic tokens under `seymour-`
- **Typography:** 2 custom font sizes; font family from next/font
- **Spacing:** 1 custom (`w-sidebar`, `min-h-input-line`); rest default
- **Max-width:** 3 custom tokens
- **Radii:** Default Tailwind only; no custom radius tokens
- **Shadows:** Default Tailwind only; no custom shadow tokens

---

## 9. Phase 2.2: Figma Comparison (Seymour V1, node 1:168)

### Figma design variables

| Figma variable | Hex | Config token | Match |
|----------------|-----|--------------|-------|
| `--surface-high` | #141414 | `seymour-bg` | Yes |
| `--surface-medium` | #1c1d1f | `seymour-canvas` | Yes |
| `--surface-low` | #232426 | `seymour-surface-2` | Yes |
| `--divider/selected` | #302f2d | `seymour-border` | Yes |
| `--primary-brand-color` | #d4b774 | `seymour-accent` | Yes |
| `--text/high-contrast` | #e3e2e1 | `seymour-text` | Yes |
| `--white` | white | `seymour-white` | Yes |

### Figma typography styles

| Style | Font | Size | Weight | Line height | Config token |
|-------|------|------|--------|-------------|--------------|
| Caps Label/10px | Geist Medium | 10px | 500 | 100% | `text-caps-label` |
| Label/12px | Geist Medium | 12px | 500 | 100% | Missing |
| Label/14px | Geist Regular | 14px | 400 | 20px | Missing (differs from body-sm) |
| Body/14px | Geist Regular | 14px | 400 | 22px | `text-body-sm` |
| Header/20px | Geist SemiBold | 20px | 600 | 30px | Missing |

### Identified gaps

1. **Label/12px** — No Tailwind utility. Used for project name, decision labels, secondary labels.
2. **Label/14px** — 14px with 20px line-height. Differs from Body/14px (22px). Used for nav items.
3. **Header/20px** — No token for section headers (e.g. "Foundation").
4. **Project container padding** — Figma uses `pb-[17px]`. We use `pb-4` (16px). 17px is off 8px grid; keep 16px unless design overrides.
5. **Error states** — Use `red-400`, `red-900`, `red-950`. Figma has no error style; add semantic `error` tokens for Phase 2.3.
6. **User message bubble bg** — Figma uses `--divider/selected` (#302f2d). We use `seymour-surface-2` (#232426) in UserMessage. Consider aligning to match Figma (darker) or keep current for contrast.
7. **gap-2.5 (10px)** — Confirmed in Figma for chat composer. Acceptable despite 8px grid.

### Values confirmed

- Sidebar width: 240px
- Chat content max-width: 720px
- Message list max-width: 744px
- User bubble radius: 24px (rounded-3xl)
- Composer radius: 16px (rounded-2xl)
- Body text: 14px / 22px
