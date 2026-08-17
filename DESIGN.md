# Design

The visual specification for AI Workbench, derived pixel by pixel from the reference
screenshot (the "Victions" chat UI). This file is the single source of truth for
tokens, measurements and component anatomy; `src/index.css` is where the tokens
actually live. Keep the two in sync.

Scope note: the macOS/Safari chrome in the reference is mockup framing, not product.
The design starts at the icon rail.

---

## 1. Anatomy

```
┌────┬──────────────┬─────────────────────────────────────────────┐
│    │              │  Create Brief ⌄                    [Share]  │  top bar   68
│ 56 │     296      ├─────────────────────────────────────────────┤
│ px │      px      │ ╭─────────────────────────────────────────╮ │
│    │              │ │                                  ╭──────╮│ │
│ i  │  sidebar     │ │                                  │ user ││ │
│ c  │              │ │                                  ╰──────╯│ │
│ o  │  new chat    │ │  ✦                                       │ │
│ n  │  search      │ │  Sure 👍                                 │ │
│    │  ───────     │ │  prose…                                  │ │
│ r  │  FOLDER      │ │  ╭───────────────────────────────────╮   │ │
│ a  │  · UI Design │ │  │ login.js        [<>][👁]  [Copy ⌄]│   │ │
│ i  │  · Project A │ │  │ code…                             │   │ │
│ l  │  ───────     │ │  ╰───────────────────────────────────╯   │ │
│    │  HISTORY     │ │  ╭───────────────────────────────────────╮│ │
│    │  · …         │ │  │ ✦ Do anything with…      composer    ││ │
│ ⚙  │              │ │  ╰───────────────────────────────────────╯│ │
│ ?  │              │ │        disclaimer                        │ │
│    │              │ ╰─────────────────────────────────────────╯ │
└────┴──────────────┴─────────────────────────────────────────────┘
```

Three fixed regions, one fluid: **icon rail** (56) → **sidebar** (296) → **main**
(fluid, min 640). Main is a top bar plus a rounded **canvas** that owns the whole
conversation, with the composer floating over its bottom edge.

| Region    | Width           | Background  | Right border |
| --------- | --------------- | ----------- | ------------ |
| Icon rail | 56px fixed      | `surface-1` | `line-200`   |
| Sidebar   | 296px fixed     | `surface-0` | `line-200`   |
| Main      | `1fr`, min 640  | `surface-0` | —            |
| Canvas    | main − 48 inset | `surface-2` | —            |
| Content   | max 780, center | —           | —            |

The **content column** (780px, horizontally centered inside the canvas) is what
every conversation element aligns to: the user bubble's right edge, the assistant
sparkle's left edge, the code card and the composer all share it.

---

## 2. Tokens

Live in `src/index.css` under `@import 'tailwindcss'`. Tailwind v4 generates the
utilities (`bg-surface-2`, `text-ink-500`, `rounded-xl`, `shadow-lg`) from these —
there is no config file. The families name the `@fontsource-variable` faces first
so the self-hosted variable fonts win over any same-named system install.

```css
@theme {
    /* ── Type ─────────────────────────────────────────────────── */
    --font-sans:
        'Inter Variable', 'Inter', ui-sans-serif, system-ui, -apple-system,
        'Segoe UI', sans-serif;
    --font-mono:
        'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace,
        SFMono-Regular, Menlo, monospace;

    /* ── Brand ────────────────────────────────────────────────── */
    --color-brand-50: #fef3ee;
    --color-brand-100: #fde4d8;
    --color-brand-200: #fbc7b0;
    --color-brand-300: #f8a17d;
    --color-brand-400: #f4744a;
    --color-brand-500: #f0511e; /* new chat, mic, logo, active glyphs */
    --color-brand-600: #d8410f; /* hover */
    --color-brand-700: #b4340b; /* pressed */

    /* ── Ink (text) ───────────────────────────────────────────── */
    --color-ink-950: #101010; /* headings, strong */
    --color-ink-900: #1c1c1c; /* body, list items */
    --color-ink-700: #3d3d3d; /* prose, history items */
    --color-ink-500: #6b6b6b; /* secondary, links */
    --color-ink-400: #8e8e8e; /* icons + decorative only — see §9 */
    --color-ink-300: #b4b4b4; /* disabled */

    /* ── Surfaces ─────────────────────────────────────────────── */
    --color-surface-0: #ffffff; /* sidebar, cards, composer */
    --color-surface-1: #fafafa; /* icon rail */
    --color-surface-2: #f6f6f6; /* canvas, hover fills */
    --color-surface-3: #ededed; /* page behind the app */

    /* ── Lines ────────────────────────────────────────────────── */
    --color-line-100: #f0f0f0; /* in-card dividers */
    --color-line-200: #e7e7e7; /* default border */
    --color-line-300: #dcdcdc; /* button border */

    /* ── Accent tints ─────────────────────────────────────────── */
    --color-tint-lilac: #f1eefc; /* active rail item */
    --color-tint-peach: #fdebe2; /* active segmented toggle */

    /* ── Syntax ───────────────────────────────────────────────── */
    --color-code-plain: #24292f;
    --color-code-tag: #d93025; /* tags, CSS properties */
    --color-code-attr: #1a7f37; /* attribute names, strings */
    --color-code-value: #e36209; /* numbers, literals */
    --color-code-punct: #6b6b6b;

    /* ── Radii ────────────────────────────────────────────────── */
    --radius-sm: 8px;
    --radius-md: 10px; /* buttons, nav rows */
    --radius-lg: 14px; /* code card */
    --radius-xl: 16px; /* bubble, composer */
    --radius-2xl: 20px; /* canvas */

    /* ── Elevation ────────────────────────────────────────────── */
    --shadow-xs: 0 1px 2px rgb(0 0 0 / 0.04);
    --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05), 0 1px 3px rgb(0 0 0 / 0.04);
    --shadow-md: 0 2px 6px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.04);
    --shadow-lg: 0 8px 24px -6px rgb(0 0 0 / 0.1), 0 2px 6px rgb(0 0 0 / 0.05);

    /* ── Motion ───────────────────────────────────────────────── */
    --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
}
```

### Spacing

4px base. Only these steps are used: `4 6 8 10 12 16 20 24 28 32 40`. Anything else
is a mistake, not a decision.

### Type scale

| Role          | Size / line | Weight | Tracking | Color     | Used by                       |
| ------------- | ----------- | ------ | -------- | --------- | ----------------------------- |
| Section label | 11 / 16     | 600    | `.08em`  | `ink-400` | `FOLDER`, `HISTORY` (upper)   |
| Meta          | 13 / 20     | 400    | —        | `ink-500` | disclaimer, filename, code    |
| UI            | 14 / 20     | 500    | —        | `ink-900` | nav rows, buttons, pills      |
| Body          | 15 / 26     | 400    | —        | `ink-700` | chat prose, bubble, composer  |
| Title         | 16 / 24     | 600    | `-.01em` | `ink-950` | sidebar title                 |
| Heading       | 18 / 28     | 600    | `-.01em` | `ink-950` | assistant heading ("Sure 👍") |

Inline `<strong>` in prose: weight 600, `ink-950`. Code font: 13 / 22, `tab-size: 4`.

---

## 3. Icon rail — 56px

Vertical stack, `surface-1`, `border-r line-200`, `padding: 24px 0 20px`.

| Element      | Spec                                                                 |
| ------------ | -------------------------------------------------------------------- |
| Logo         | 28×28, orange diamond (square rotated 45°, `radius-sm`, `brand-500`) |
| Gap to nav   | 32px                                                                 |
| Nav button   | 36×36, `radius-md`, icon 20px, stroke 1.5, `ink-400`                 |
| Gap between  | 8px                                                                  |
| Hover        | `bg-surface-2`, icon `ink-700`                                       |
| **Active**   | `bg-tint-lilac`, icon full-color (sparkle) or `brand-500`            |
| Footer group | `margin-top: auto`, settings + help, same 36×36 spec                 |

Nav order (lucide names): `home`, `message-circle`, `monitor`, `folder`,
`pie-chart`, `sparkles` (active) — then `settings`, `circle-help` pinned bottom.

Every rail button is icon-only: it **must** carry an `aria-label` and a tooltip on
hover (400ms delay, `ink-950` bg, white 12px text, `radius-sm`, 6px offset).

---

## 4. Sidebar — 296px

`surface-0`, `border-r line-200`. Body padding-inline `20px`; dividers are
full-bleed (`margin-inline: -20px`).

**Header** — height 64, padding-inline 20, `space-between`. Title 16/600 `ink-950`.
Collapse button 28×28, `radius-sm`, icon `panel-left-close` 18px `ink-400`.

**New chat** — full width, height 40, `radius-md`, `bg-brand-500`, white 14/600,
icon `plus` 16 with 8px gap, content centered. Hover `brand-600`, active
`brand-700`, focus ring per §9. This is the only filled-brand surface in the
sidebar; nothing else competes with it.

**Search chat** — height 36, `radius-md`, padding-inline 8, transparent, icon
`search` 16 `ink-400` + 10px gap + 14/400 `ink-500`. Hover `surface-2`. 8px below
the new-chat button.

**Divider** — 1px `line-200`, 16px above / 20px below.

**Section label** — 11/600 uppercase `.08em` `ink-400`, padding-inline 8, 8px below.

**Row (folder + history)** — height 36, `radius-md`, padding-inline 8, gap 10.
Folder rows carry a `folder` icon 16 `ink-400`; history rows are text-only, 14/400
`ink-700`. Vertical gap between rows: 2px. Hover `surface-2` + `ink-900`. Selected:
`surface-2`, text `ink-950` weight 500. Overflow: single line, `text-ellipsis`.

Group spacing: 20px between the last row of a group and the next section label.

---

## 5. Top bar — 68px

Padding-inline 24, `space-between`, no bottom border — the canvas below provides
the separation.

- **Breadcrumb** — button, height 32, `radius-sm`, padding-inline 8, label 15/500
  `ink-900` + `chevron-down` 16 `ink-400` at 6px gap. Hover `surface-2`.
- **Share** — height 40, `radius-lg`, `bg-surface-0`, `border line-300`,
  padding-inline 16, `share-2` 16 + 8px gap + 14/500 `ink-900`, `shadow-xs`.
  Hover `surface-2`; active `border-line-300` + `shadow-none`.

---

## 6. Canvas & conversation

Canvas: `margin: 0 24px 24px`, `bg-surface-2`, `radius-2xl`, `overflow: hidden`,
`position: relative`. Scroll lives on the inner track, padding `40px 32px 0`, with
`padding-bottom` equal to composer height + 40 so the last message can always clear
the floating composer.

### User bubble

Right-aligned in the content column. `bg-surface-0`, `border line-200`,
`radius-xl`, `shadow-xs`, padding `18px 20px`, max-width 520 (never wider than 66%
of the column), text 15/24 `ink-900`, `white-space: pre-wrap`.

Long messages clamp to 5 lines (`-webkit-line-clamp`) with a fade to white over the
last line and a "Show more" text button 13/500 `ink-500`. The reference shows the
clamped state.

### Assistant block

Left-aligned, full column width, stacked:

1. **Sparkle mark** 20×20 — 4-point star, `linear-gradient(135deg, #F0511E 0%,
#E5399B 45%, #4C6FFF 100%)` masked to the glyph. 16px below.
2. **Heading** 18/28 600 `ink-950`. 14px below.
3. **Prose** 15/26 `ink-700`, paragraph gap 12, max-width 720 for readability.

While streaming, append a 2px × 1em `brand-500` caret with a 1s step blink; hide it
under `prefers-reduced-motion`.

### Code card

`bg-surface-0`, `border line-200`, `radius-lg`, `overflow: hidden`, 20px above.

**Header** — height 52, padding-inline 16, `space-between`.

- Left: filename, mono 13/500 `ink-900`.
- Right: segmented toggle then Copy, 10px apart.
- **Segmented toggle** — track `bg-surface-2`, `radius-md`, padding 3;
  two 32×32 buttons (`code-xml`, `eye`), icon 16. Active button: `bg-tint-peach`,
  icon `brand-500`, `shadow-xs`. Inactive: transparent, icon `ink-400`.
  `role="tablist"` / `role="tab"` with `aria-selected`.
- **Copy** — height 34, `radius-md`, `border line-300`, split: `copy` 16 + 6px gap
    - 13/500 label, then a 1px `line-200` rule and a 26px `chevron-down` half for the
      format menu. Success state swaps the icon for `check` `#1A7F37` and the label for
      "Copied" for 1.6s.

**Body** — padding `16px 20px`, mono 13/22, `overflow: auto`, `max-height: 420`.
Syntax uses the `--color-code-*` tokens. Scrollbar: 6px track, thumb `#D4D4D4`
`radius-full`, 8px inset from the right edge; `scrollbar-width: thin`.

### Scroll fade

The reference cuts the code off softly behind the composer. That is a canvas-level
overlay, not card styling:

```css
.canvas::after {
    content: '';
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    height: 160px;
    pointer-events: none;
    background: linear-gradient(
        to top,
        var(--color-surface-2) 45%,
        transparent 100%
    );
}
```

### Composer

Floats over the canvas bottom: `position: sticky; bottom: 24px`, content-column
width, `z-index: 10`. `bg-surface-0`, `border line-200`, `radius-xl`, `shadow-lg`,
padding `16px 16px 12px`.

**Row 1** — sparkle 18 `ink-400` (or full-color once focused) + textarea, min-height
56, auto-grow to 200 then scroll, 15/24, placeholder `ink-400`, no border, no
outline, `resize: none`.

**Row 2** — height 40, 12px above, `space-between`:

| Slot       | Spec                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| Attach     | 36 circle, `border line-300`, `plus` 18 `ink-700`                                                          |
| Tools      | height 36, `radius-full`, `border line-300`, padding-inline 14, `sliders-horizontal` 16 + 8px gap + 14/500 |
| Model      | height 40, `radius-full`, `border line-300`, padding-inline 16, 14/500 + `chevron-down` 16 `ink-400`       |
| Send / mic | 40 circle, `bg-brand-500`, icon 18 white, `shadow-sm`                                                      |

The mic swaps to `arrow-up` (send) the moment the textarea is non-empty, and to a
`square` stop glyph while `status` is `submitted`/`streaming`. Disabled: `ink-300`
on `surface-2`, no shadow.

The reference button reads "Tolls" — that is a typo in the mockup. We ship "Tools".

**Disclaimer** — 13/20 `ink-500`, centered, 16px below the composer, links
underlined with `underline-offset: 2px`, hover `ink-900`.

---

## 7. Motion

| Interaction      | Duration | Easing             |
| ---------------- | -------- | ------------------ |
| Hover / color    | 120ms    | `ease-out`         |
| Button press     | 80ms     | `ease-out`         |
| Sidebar collapse | 220ms    | `--ease-out-quint` |
| Message enter    | 180ms    | `--ease-out-quint` |
| Composer grow    | 120ms    | `ease-out`         |

Message enter: `opacity 0→1`, `translateY 6px→0`. Nothing scales, nothing bounces.
Every animation is wrapped in `@media (prefers-reduced-motion: no-preference)`.

---

## 8. Responsive

| Breakpoint | Behaviour                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| ≥ 1280     | Full three columns, canvas inset 24, content column 780                                                                       |
| 1024–1279  | Sidebar 264, canvas inset 20, content column fills minus 32                                                                   |
| 768–1023   | Sidebar becomes an overlay drawer (rail stays); scrim `rgb(0 0 0 /.32)`                                                       |
| < 768      | Rail collapses into the top bar; canvas inset 12, `radius-lg`; composer full-bleed, sticky with `env(safe-area-inset-bottom)` |

Below 768 the top bar keeps the breadcrumb and drops the Share label to icon-only.

---

## 9. Accessibility

**Focus** — every interactive element: `outline: 2px solid var(--color-brand-500);
outline-offset: 2px`. Never remove it; `:focus-visible` only.

**Targets** — 36px minimum, 44px on touch. Rail buttons get 8px of invisible padding
on coarse pointers.

**Contrast** — one deliberate deviation from the reference: `ink-400` (#8E8E8E) on
white is 3.0:1, which fails AA for text. It is restricted to icons, decorative
glyphs and placeholders. Anything that carries meaning — history rows, disclaimer,
section labels — uses `ink-500` (#6B6B6B, 5.3:1) or darker. Section labels stay
visually light by using size and tracking, not a lighter grey.

`brand-500` on white is 3.4:1 — fine for the ≥18px/bold or icon uses it has, never
for body copy. White on `brand-500` is 4.6:1, which is why the New chat label is
600 weight.

**Semantics** — sidebar is `<nav>`; history is a `<ul>` with `aria-current="page"`
on the selected row; the conversation is an `<ol>` with `aria-live="polite"` on the
streaming region; the code toggle is a real tablist; icon-only buttons all carry
`aria-label`.

---

## 10. Dark mode

Out of scope for this pass — the reference is light-only. The tokens are named
semantically (`surface-*`, `ink-*`, `line-*`) precisely so a later `.dark` block can
override values without touching a single component. Do not introduce raw hex or
`gray-*` utilities in components; that is what would make dark mode expensive.

---

## 11. Mapping to the codebase

The design has landed. Where it sits:

| Spec section      | File                                                     | Status  |
| ----------------- | -------------------------------------------------------- | ------- |
| §2 Tokens         | `src/index.css`                                          | done    |
| §1 Shell          | `src/components/shell/AppShell.tsx`                      | done    |
| §3 Icon rail      | `src/components/shell/IconRail.tsx`                      | done    |
| §4 Sidebar        | `src/components/shell/Sidebar.tsx`                       | done    |
| §5 Top bar        | `src/components/shell/TopBar.tsx`                        | done    |
| §6 Canvas         | `src/components/chat/Chat.tsx`                           | done    |
| §6 Bubble / prose | `src/components/chat/MessageList.tsx`                    | done    |
| §6 Code card      | `src/components/chat/CodeBlock.tsx`                      | done    |
| §6 Composer       | `src/components/chat/Composer.tsx`                       | done    |
| Card pattern      | `src/components/ui/Card.tsx` + Approval / Weather / Plan | done    |
| §7 Motion         | `src/index.css` (`.message-enter`, `.caret`)             | done    |
| §8 Responsive     | `AppShell` (drawer), `TopBar`, `Chat` (canvas insets)    | done    |
| §9 Accessibility  | focus ring + touch targets in `src/index.css`            | done    |
| §10 Dark mode     | —                                                        | skipped |

Supporting pieces the spec implies but does not name: `src/components/ui/Sparkle.tsx`
(the §6.1 gradient mark, reused by the rail, the assistant block and the composer),
`src/components/ui/IconButton.tsx` (the §3 rail button plus its tooltip), and
`src/components/chat/ToolPending.tsx` (the resting state a tool shows before it
has anything to put in a card).

Fenced code reaches `CodeBlock` through `src/domain/chat/fenced-code.ts`, which
splits assistant text into prose and code runs and is written so an unterminated
fence — the normal case mid-stream — yields the partial block rather than
nothing. Auto-scroll uses `src/domain/chat/scroll.ts`: the rule for whether to
follow new content down is pure and unit-tested, and `Chat` drives it from a
`ResizeObserver` so any growth counts, not just a new message.

---

## 12. Deviations from the reference

Each of these is a deliberate departure, not an omission.

**The send button does not become a stop button.** The reference swaps the
composer's circle to a stop square while streaming. `Chat.test.tsx` requires a
disabled **Send** and a live **Stop** to exist at the same moment, and §11's own
rule is that styling must not break the test contract. Stop therefore lives in
the status strip above the composer, and Send stays a single, predictably-named
target that only changes its enabled state.

**No mic glyph.** The reference's resting state is a microphone, which promises
voice input this app does not have. The control is always an arrow-up named
"Send" — the honest affordance.

**The code card's segmented toggle is Source / Wrap, not code / preview.** A
preview tab implies rendering arbitrary code, which the workbench cannot do. The
toggle keeps the specified anatomy (track, 32×32 buttons, `tint-peach` active
fill, `role="tablist"` with `aria-selected`) and drives soft-wrap instead. The
Copy control's format chevron is a visual affordance only until there is a second
format to choose.

**Syntax highlighting is not implemented.** The `--color-code-*` tokens are
declared and the card body uses `code-plain`; per-token colouring is deferred
rather than shipped as a half-correct tokenizer.

**The composer is absolutely positioned, not `position: sticky`.** Same visual
result — floating over the canvas floor at the content-column width — but it
keeps the composer out of the scroll flow, so §6's 160px fade covers dead space
instead of eating the last message. The scroll track carries the bottom padding
the spec asks for.

**The drawer scrim is `aria-hidden`, with Escape as the keyboard route out.** A
full-bleed scrim button would give a second control the accessible name "Close
sidebar", making it ambiguous to both screen readers and tests; the sidebar's own
collapse button is the labelled close.

**The plan panel has a placement the anatomy does not specify.** §11 says it
inherits the card shell, but the reference has no slot for a second panel. It
renders as the last item in the canvas content column, so the floating composer
still owns the canvas floor. `Chat` takes it through a `tools` prop rather than
importing it, so the chat component stays unaware of what shares its canvas.

**Not yet built:** the user bubble's 5-line clamp with a "Show more" button, and
dark mode (§10, already out of scope). The tokens are semantic throughout and no
component carries a raw hex or a `gray-*` utility, so dark mode stays a
values-only change.

`ApprovalCard`, `WeatherCard` and `PlanPanel` all reuse the code-card shell —
`surface-0` / `line-200` / `radius-lg` / 52px header — so tool output and structured
output read as one family. The approval card is the only place `brand-500` appears
in the canvas outside the composer.

Constraints that do not change: `src/domain/` stays pure (no styling, no React),
Tailwind stays configured in CSS, and every component keeps its existing test
contract — styling must not break the queries in `*.test.tsx` (`aria-label`,
`role`, visible text).

### Fonts

Inter and JetBrains Mono are self-hosted through
`@fontsource-variable/*` and imported from `src/index.css`, so there is no
runtime dependency on a font CDN and the build ships the woff2 files itself.
Icons come from `lucide-react`, matching the names used throughout this spec.
