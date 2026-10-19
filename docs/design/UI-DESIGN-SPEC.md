# UI Design Specification

> **Stack change (2026-10):** the UI is now built with Next.js, Tailwind v4 and shadcn/ui. Design tokens live in src/app/globals.css (navy accent on slate neutrals, light and dark mode) and shared components in src/components/app/. References below to Django templates, template tags and HTMX describe the original implementation.


## 1. Purpose

This document defines the visual and interaction design system for the School Financial Monitoring System.

The system is an internal institutional financial monitoring application used by:

- Central/Admin users
- Branch users

The primary purpose of the interface is:

- entering operational financial data;
- monitoring reporting completeness;
- reviewing financial conditions;
- identifying exceptions and findings;
- maintaining master data.

The interface must prioritize clarity, trustworthiness, information density, and efficient data entry over visual decoration.

---

# 2. Design Principles

1. **Institutional, not consumer.** The application is used daily by finance staff, not browsed casually. Every screen should look like it belongs in a school district's back office, not a startup product.
2. **Typography and spacing carry hierarchy, not color.** Color marks status (success/warning/danger/info) and interactivity (links, primary actions) -- nothing else.
3. **Tables are the primary UI.** Financial and monitoring data lives in tables. Cards are reserved for small aggregate summaries, never for rows of a financial record.
4. **One set of components, reused everywhere.** Buttons, panels, tables, links, and badges are defined once (see section 33) and composed on every page. No page invents its own button or card style.
5. **Every value that must always be visible in a table cell.** Financial values are shown in Rupiah via the existing `rupiah` filter and right-aligned with tabular numerals -- never raw Decimal output.
6. **Authorization is presentation-only here.** This document governs what things look like. What a user can see or do is decided entirely server-side (`apps/accounts/authorization.py`); the UI only reflects that decision (hiding an action a user cannot perform, showing the user's own scope).

The application must not resemble:

- a startup SaaS landing page;
- an AI-generated dashboard template;
- a marketing website;
- a consumer finance application;
- a social-media application.

The interface should communicate:

> "This is a reliable internal monitoring and reporting system."

not:

> "This is a flashy modern SaaS product."

---

# 3. Anti-AI-Slop Rules

The following patterns are explicitly discouraged:

- excessive rounded cards;
- excessive use of shadows;
- gradients used for decoration;
- glassmorphism;
- oversized hero sections;
- decorative illustrations;
- unnecessary animations;
- excessive icon usage;
- huge metric numbers without context;
- multiple colorful cards merely for visual variety;
- excessive pill-shaped components;
- excessive whitespace that reduces information density;
- arbitrary decorative charts;
- emoji as UI decoration;
- unnecessary modals;
- animated page transitions;
- generic "modern SaaS" dashboard layouts;
- purple/indigo "AI product" accent colors;
- converting a financial table into a grid of cards.

Do not add visual elements unless they improve:

- comprehension;
- navigation;
- data entry;
- monitoring;
- status recognition;
- error prevention.

---

# 4. Visual Language

Use a restrained institutional visual language.

Primary characteristics:

- white/light neutral surfaces;
- subtle borders (borders over shadows);
- one restrained accent color for interactive elements;
- dark readable text;
- muted secondary text;
- status colors only when status has semantic meaning.

The interface should rely more on:

- typography;
- spacing;
- borders;
- alignment;
- hierarchy

than on:

- shadows;
- gradients;
- color blocks.

---

# 5. Design Tokens

All color, font, radius, and spacing decisions are centralized as Tailwind v4 `@theme` variables in [tailwind/input.css](../../tailwind/input.css). **Never hard-code a hex value or an arbitrary Tailwind palette color (`slate-*`, `blue-*`, `red-*`, etc.) in a template.** Reference the utility classes below instead.

Every `--color-*` variable declared in `@theme` automatically becomes a matching `bg-*` / `text-*` / `border-*` / `ring-*` utility -- e.g. `--color-primary` gives `bg-primary`, `text-primary`, `border-primary`.

> **Implementation note:** the border token is named `hairline`, not `border`, and produces `border-hairline`. Naming a custom color token exactly `border` creates an ambiguous utility (`border-border`) that the Tailwind v4 compiler cannot resolve against its own `border-*` utility namespace (border-width/side/style all start with `border-`). This was discovered directly while building this system -- do not rename it back to `border` without re-testing a full `tailwindcss` build.
>
> **Implementation note:** `tailwind/input.css` intentionally contains **no CSS comments**. A reproducible Tailwind v4 v4.3.3 parser bug causes `/* ... */` comments placed inside or near an `@theme` block (combined with multi-selector grouped rules elsewhere in the file) to corrupt `@apply` resolution for custom utilities defined earlier in the file, producing spurious `Cannot apply unknown utility class` errors. Keep this file comment-free; put explanatory prose here in the spec instead.

## 5.1 Token Table

| Token (CSS var) | Utility | Hex | Purpose |
|---|---|---|---|
| `--color-canvas` | `bg-canvas` | `#F6F7F9` | Page background |
| `--color-surface` | `bg-surface` | `#FFFFFF` | Panels, cards, table wrappers, inputs |
| `--color-hairline` | `border-hairline` | `#E2E5E9` | All default borders/dividers |
| `--color-ink` | `text-ink` | `#1F2933` | Primary text |
| `--color-muted` | `text-muted` | `#667085` | Secondary/supporting text |
| `--color-primary` | `bg-primary` / `text-primary` | `#173B57` | Primary actions, active nav, brand |
| `--color-primary-hover` | `hover:bg-primary-hover` | `#10293D` | Primary button hover |
| `--color-accent` | `text-accent` | `#2F6B9A` | Links, interactive accents |
| `--color-accent-hover` | `hover:text-accent-hover` | `#24567C` | Link hover |
| `--color-success` / `-bg` / `-border` | `text-success` / `bg-success-bg` / `border-success-border` | `#287A5A` / `#E9F5EF` / `#BFE3D0` | Sesuai, Aktif, Selesai, Lengkap |
| `--color-warning` / `-bg` / `-border` | same pattern | `#A66A00` / `#FBF1DE` / `#F0DBAE` | Belum Lengkap, Proses, advisory notices |
| `--color-danger` / `-bg` / `-border` | same pattern | `#B54747` / `#FBEDED` / `#F0C9C9` | Tidak Sesuai, errors, destructive |
| `--color-info` / `-bg` / `-border` | same pattern | `#3B6E9E` / `#EAF1F7` / `#C6DBEA` | Informational badges/messages |
| `--color-badge-neutral` / `-bg` / `-border` | same pattern | `#667085` / `#F1F2F4` / `#E2E5E9` | Tidak Aktif, Terbuka, unset states |
| `--font-sans` | `font-sans` (default) | Inter, system stack | See section 7 |

Do not introduce a new color token without adding it to this table first.

---

# 6. Color Usage

**Primary** (`#173B57`): primary action buttons, active navigation item, brand mark. Used sparingly -- one primary button per view in the common case.

**Accent** (`#2F6B9A`): text links, focus rings, secondary interactive affordances (e.g. "Terapkan" filter button border-hover). Not used for large fills.

**Success**: Sesuai, Aktif, Selesai, Lengkap, and success confirmation messages.

**Warning**: Belum Lengkap, Proses (on-progress), advisory/TBD notices (e.g. the OBD risk-status notice on the dashboard).

**Danger**: Tidak Sesuai, validation errors, destructive actions (Nonaktifkan).

**Info**: informational badges/messages that are neither success nor a problem.

**Neutral** (badge-neutral): Tidak Aktif, Terbuka (an open, not-yet-resolved finding -- neutral, not yet a warning), or any status without a stronger semantic meaning.

Rules:

- Never use a semantic color purely for decoration.
- Status is always communicated by **label text + color**, never color alone (see section 20, Accessibility).
- Do not invent new status colors/thresholds (e.g. a risk-level color scale) -- several such rules are explicit open business decisions (OBD-DM-005, OBD-DM-006, OBD-005) and must stay visibly marked "belum ditentukan" until the business defines them.

---

# 7. Typography

Font stack (`--font-sans`, applied to `body`):

```
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
```

**Decision: no remote font loading.** The Docker build has no network dependency at runtime, and the app must render identically offline/air-gapped. Inter is named first for environments that already have it installed system dependencly, but every environment renders correctly on the `ui-sans-serif`/`system-ui` fallback with no visible layout shift risk from a late-loading webfont. Do not add a Google Fonts `<link>` or self-hosted font files without updating this section first.

## 7.1 Scale

| Role | Class | Size / line-height |
|---|---|---|
| Page title | `.page-title` | 24px / 30px, semibold |
| Section title (e.g. table caption, `<h2>`) | `.eyebrow` or plain `text-sm font-semibold` | 14px, or 12px uppercase for eyebrows |
| Body | default (`text-sm` in content) | 14px / 21px |
| Secondary/description | `.page-description`, `text-muted` | 13-14px |
| Table text | `.table-base` | 13-14px |
| Caption / fine print | `text-xs`, `.caption` | 12px / 18px |

Never use a 32-48px heading anywhere in the authenticated app shell. The login page's app-name heading is the largest text in the product and stays at `text-base`/`text-lg` (see section 35).

---

# 8. Numbers

All financial and quantitative table/detail values use `tabular-nums` so digits align in a column. Currency values always pass through the existing `rupiah` template filter (`apps/core/templatetags/monitoring_extras.py`) -- never render a raw `Decimal` directly. The filter is display-only and never touches stored precision or feeds a calculation (see the filter's own docstring).

Negative amounts render with a leading `-` before `Rp` (already handled by `rupiah`); no red-text-only negative indicator is used, since color must never be the only signal (a leading minus sign is always present).

---

# 9. Spacing System

Use Tailwind's default spacing scale (4px increments). Primary layout spacing in this app:

- `gap-1.5`/`gap-2` inside a button or inline group
- `gap-3` between filter fields, page-header title/actions
- `p-3`/`p-4` for compact panels (metric cards, filter bar)
- `p-6` for padded content panels (`.panel-padded`, form containers)
- `mb-5` below a page header block
- `mb-6` between major page sections

Tables stay compact (`px-4 py-2.5` cells via `.table-base`) -- do not add extra vertical padding to table rows for "breathing room"; density is a feature here, not a defect.

---

# 10. Border / Shadow System

**Borders over shadows.** No panel in this application uses `box-shadow`. Every panel, table wrapper, and form container is `.panel` = `1px solid var(--color-hairline)` on a `bg-surface` background.

Radius scale:

- Small controls (buttons, inputs, badges): `rounded` (4px)
- Panels, cards, table wrappers: `rounded-md` (6px, via `.panel`)
- Nothing in this app exceeds `rounded-md` -- no `rounded-xl`/`rounded-2xl`/`rounded-3xl`.

---

# 11. Global Layout

The application shell is Sidebar + Header + Main content, unchanged in structure from earlier phases:

```text
┌─────────────────────────────────────────────────────────┐
│ Sidebar │ Header (page name · user · role/scope)         │
│         ├───────────────────────────────────────────────┤
│         │                                                │
│         │ Main content (page header, then content)       │
│         │                                                │
└─────────┴───────────────────────────────────────────────┘
```

Desktop: sidebar is a fixed 240px (`w-60`) column, always visible at `md:` and above.

Mobile (`< md`): sidebar becomes an off-canvas panel toggled by a hamburger button in the header; a scrim behind it closes it on tap.

Content area has no artificial max-width for data-heavy pages (tables use the full available width). Forms and small detail summaries use `max-w-lg`/`max-w-2xl` so line length stays readable -- this is a per-page choice already established in `rkas/form.html` etc. and remains unchanged.

---

# 12. Navigation (Sidebar)

Grouped with subtle uppercase eyebrow category labels (`.eyebrow`):

```text
MONITORING
    Dashboard

MASTER DATA
    Branch
    Sekolah
    Tahun Anggaran

KEUANGAN
    RKAS
    Realisasi Bulanan
    Realisasi Semester
    BOS
    Piutang
    Rekonsiliasi

PENGAWASAN
    Temuan & Tindak Lanjut
```

The active item is marked by **three simultaneous signals** (never color alone): a subtle `bg-canvas` background, a 2px `border-primary` left rule, and `font-medium` text weight, plus `aria-current="page"` for assistive technology.

No icons are used in the sidebar (see section 29) -- label text alone is clearer at this density than an icon set that would need inventing from scratch.

---

# 13. Header

The top header bar is a compact **context bar**, not a second page title. It shows:

- the current page name (left, from the `page_heading` block);
- the authenticated user's name and scope (right): `{{ user.name }} · {{ user.branch.name }}` for a Branch user, or `{{ user.name }} · Pusat · Semua Cabang` for Central.

A Branch user's header/sidebar footer never renders another branch's name -- the scope line is always derived from `request.user`, never from a query parameter (see section 36).

---

# 14. Page Header

Every major content page (list, detail, dashboard) opens its content block with:

```html
<div class="flex flex-wrap items-start justify-between gap-3 mb-5">
    <div>
        <h2 class="page-title">{{ Title }}</h2>
        <p class="page-description">{{ One short Indonesian sentence of context }}</p>
    </div>
    {% if <permission check> %}
    <a href="..." class="btn-primary">Tambah ...</a>
    {% endif %}
</div>
```

The description is a single short sentence, e.g. "Rencana kegiatan dan anggaran sekolah." for RKAS -- never a paragraph. The primary action (when the user is permitted one) sits at the top right, visually obvious against `.btn-primary`.

---

# 15. Button System

Three button classes, defined once in `tailwind/input.css` under `@layer components`:

| Class | Use |
|---|---|
| `.btn-primary` | Simpan, Tambah, Buat -- the one primary action on a view |
| `.btn-secondary` | Terapkan (filters), other non-destructive secondary actions |
| `.btn-danger` | reserved for a true destructive action (none currently exist in the UI -- deactivation uses `.link-danger` as a text action, matching the existing "no hard deletes" rule in AI.md) |

All three share: consistent height (`px-4 py-2`, `text-sm`), `rounded` (4px), and a visible `focus-visible:ring-2` state. None are pill-shaped or oversized.

Cancel/back actions (`Batal`, `Kembali`) are plain text links styled `.link-muted`, not buttons -- they are not the primary or even a notable secondary action on a form.

---

# 16. Form System

All forms share the base styling defined once in `tailwind/input.css` `@layer base` (applies automatically to Django's `{{ form.as_p }}` output, no per-field template markup needed):

- Labels: visible, above the input, `text-sm font-medium text-ink`.
- Inputs/selects/textareas: consistent height (`py-1.5`), `border-hairline`, `bg-surface`, `rounded`.
- Focus state: `border-accent` + `ring-2 ring-accent/30` -- never relies on color alone (the border itself thickens/changes, and the ring is a second, larger visual signal).
- Required fields: a red `*` is appended automatically via a CSS `:has()` selector reading the HTML5 `required` attribute Django already renders -- no template changes needed per field.
- Validation errors: Django's `ul.errorlist` renders in `text-danger`; a non-field error list (`ul.errorlist.nonfield`) additionally gets a boxed `border-danger-border bg-danger-bg` treatment, matching the login page's non-field-error box.
- Financial-module create forms never render a `school` field -- the school is always server-derived (`apps.accounts.authorization.get_user_school`) and shown as read-only context text above the form (see section 22).

---

# 17. Table System

Tables are the primary UI for monitoring and are never converted to card grids.

Structure, via the `.table-wrap` / `.table-base` component classes:

```html
<div class="panel overflow-x-auto">
    <table class="table-base">
        <thead><tr><th>...</th></tr></thead>
        <tbody><tr class="border-t border-hairline hover:bg-canvas">...</tr></tbody>
    </table>
</div>
```

Rules:

- Header (`thead`, styled once via `.table-base thead`): `bg-canvas`, `text-xs font-semibold uppercase tracking-wide text-muted` -- no manual per-page header classes.
- Numeric/monetary columns are right-aligned (`text-right`) and use `tabular-nums`.
- Text columns are left-aligned.
- Status is shown via the shared status badge (section 18), never bare colored text.
- Row hover is a subtle `hover:bg-canvas` background -- no zebra striping.
- Row height stays compact (`px-4 py-2` cells) across every table in the app.
- Empty state: a single centered row spanning all columns, `text-muted`, one short sentence (section 24).
- Horizontal scroll (`overflow-x-auto` on the wrapper) handles narrow/mobile viewports -- tables are never restructured into cards on small screens.

---

# 18. Status Badges

The single implementation is `templates/components/_status_badge.html`, invoked via the `status_badge` inclusion tag (`apps/core/templatetags/monitoring_extras.py`). It accepts a `label` (business text, always passed by the caller from an existing model field/choice) and a `tone` (`success` / `warning` / `danger` / `info` / default-neutral), and always renders a small colored dot **and** the label text together -- never color alone.

Do not create a second badge implementation anywhere in the app. Every status column in every table (Aktif/Tidak Aktif, Sesuai/Tidak Sesuai, Lengkap/Belum Lengkap, Selesai/Proses/Terbuka) goes through this one component.

---

# 19. Alerts / Messages

`templates/components/_messages.html` renders Django's messages framework output, mapped to the semantic tokens:

| `message.tags` | Style |
|---|---|
| `success` | success tokens, `role="status"` |
| `warning` | warning tokens, `role="status"` |
| `info` / `debug` | info tokens, `role="status"` |
| `error` (default/else) | danger tokens, `role="alert"` |

Messages are short, single-sentence, Indonesian (section 25/31) -- e.g. "Data berhasil disimpan." / "Data tidak dapat disimpan. Periksa kembali isian Anda."

---

# 20. Cards / Summary Panels

Cards are used **only** to summarize aggregate information (the dashboard metric row), never as a substitute for a table row. A summary card:

```html
<div class="panel p-4">
    <div class="metric-label">Total Sekolah</div>
    <div class="metric-value">12</div>
</div>
```

`.metric-value` is `text-xl` (20px) -- explicitly not the 48-64px "hero number" style associated with marketing dashboards. There is no card per financial record anywhere in the app; every financial-module list is a table (section 17).

---

# 21. Dashboard

Fixed vertical order, per the app's actual data flow:

1. Page Header (title + one-line scope-aware description)
2. Summary Metrics (`.panel p-4` grid, `metric-label`/`metric-value`)
3. Filters (a single `.panel` control bar, see 21.1)
4. School Monitoring Table
5. Supporting information (the OBD risk-status advisory box, warning-toned, placed *after* the table so it doesn't compete with the primary monitoring content for attention)

No charts are added -- none are justified by current requirements. No new KPIs, risk scores, thresholds, or completeness rules are invented; every TBD metric (`monthly_incomplete_count`, the risk-status notice) stays visibly marked "Belum ditentukan" / OBD-referenced exactly as before this refinement.

## 21.1 Dashboard Filters

A single bordered control bar (`.panel` wrapping a `<form method="get">`), each field labeled above the control, ending in an explicit `.btn-secondary` "Terapkan" button (selects also auto-submit on change for convenience; the button is there for users who prefer an explicit action and for keyboard/no-JS robustness).

- **Branch users**: no Branch selector. School and Tahun Anggaran filters are offered; the School options are limited to their own branch's schools.
- **Central users**: Branch, School, and Tahun Anggaran filters are all available, matching their full-access read-only scope.

All filtering happens server-side in `apps/dashboard/views.py`; the template only ever renders options the view already scoped to the user (see section 36).

---

# 22. Detail / Form Pages

Detail and form pages use a `.panel` (or `.panel p-6`) container with clear internal grouping (a definition-list-style grid of labeled fields), never one giant flat form dump. RKAS detail, for example: Page Header → summary panel (initial amount, current amount, approval date, major change) → revisions table.

Financial-module create forms show the resolved school as **read-only context**, not a field:

```html
{% if school %}
<p class="text-sm text-muted mb-4">Sekolah: <span class="font-medium text-ink">{{ school.name }}</span></p>
{% endif %}
```

This mirrors the server-side rule (section 36): the school is never a client-editable value on these forms.

---

# 23. Financial Display

- All monetary values render through `rupiah` (`Rp850.000.000`), never a raw `Decimal`.
- All monetary/quantitative table and detail values use `tabular-nums`.
- Calculated fields (RKAS Terakhir, Selisih, Saldo Akhir, etc.) are visually distinguished with `font-semibold` where they are the "headline" number of a row/panel, and are always labeled "(kalkulasi)" in the header/label text where the underlying model computes them -- this labeling convention already exists in the templates and must be preserved.
- No calculation, rounding, or precision behavior changes with this design system -- `rupiah` remains presentation-only (its own docstring is explicit about this).

---

# 24. Empty States

A single centered table row, one short sentence, `text-muted`, no illustration:

```html
<tr><td class="px-4 py-6 text-center text-muted" colspan="N">Belum ada data RKAS.</td></tr>
```

An optional second sentence of guidance may be added only where it materially helps (none currently needed beyond the existing per-module "Belum ada data ..." messages).

---

# 25. Loading States

The application has no client-side data fetching beyond the one HTMX demo partial (`core/htmx_demo`, a Phase-1 scaffold, not a real feature). There is currently no page with a meaningful loading state to design for. If HTMX-driven partial updates are added to real features in a future phase, a loading state should reuse `.link-muted`-toned text ("Memuat...") rather than a spinner graphic, consistent with the "minimal animation" rule (section 30).

---

# 26. Error States

- **Form validation errors**: inline via Django's `ul.errorlist` (danger-toned text under the field) and, for non-field errors, a boxed danger banner at the top of the form (login page, and any form using `ul.errorlist.nonfield`).
- **Authorization errors (403)**: rendered by Django's standard `PermissionDenied` handling -- out of scope for this visual refinement (no custom 403/404 template exists yet; adding one is not required by this task and was not requested).
- **Duplicate-record errors** (e.g. submitting a second RKAS for the same school+budget year): surfaced as a form-level error via `form.add_error(None, ...)`, rendered through the same non-field error banner -- no raw server error page is ever shown for this case.

---

# 27. Responsive Behavior

Desktop is the primary environment (this is an administrative back-office tool), but mobile remains usable:

- `< md`: sidebar becomes an off-canvas panel (hamburger toggle in the header, scrim-dismissible).
- Filter bars wrap (`flex-wrap`) rather than overflowing.
- Tables scroll horizontally within their own `.panel overflow-x-auto` wrapper -- the page body itself never scrolls horizontally.
- No table is ever restructured into a card list on small screens; density and column alignment are preserved, just scrollable.

---

# 28. Accessibility

- Every page has a real `<h1>`-equivalent (`page_heading` block in the header) plus an in-content `<h2 class="page-title">` -- headings are not skipped or purely decorative.
- Every form input has an associated `<label for="...">` (Django's `{{ form.as_p }}` already pairs these; login page's manual labels do too).
- Focus is always visible: every interactive element (nav links, buttons, form controls, pagination links) has an explicit `focus-visible:ring-2` state -- nothing relies on the browser's default (often invisible) outline.
- The active sidebar item carries `aria-current="page"` in addition to its visual styling.
- Status is always label text + color (badges, messages) -- never color alone.
- The mobile sidebar toggle has `aria-controls`/`aria-expanded`/`aria-label`; its close button has `aria-label="Tutup menu"`.
- Pagination has `aria-label="Navigasi halaman"` on the `<nav>`, per-link `aria-label`s ("Halaman sebelumnya"/"Halaman berikutnya"), and disabled states are marked `aria-disabled="true"` rather than simply omitted.
- Messages use `role="alert"` for errors and `role="status"` for success/info/warning, so assistive technology announces them appropriately.

---

# 29. Iconography

No icon library is used anywhere in the app. The sidebar, buttons, and status badges rely on label text and the small colored dot in `_status_badge.html` (a single 1.5px circle, not an icon). The only two "icon-like" glyphs in the app are the hamburger menu (`&#9776;`) and the mobile-menu close glyph (`&times;`), both plain HTML entities, not an SVG/icon-font dependency. This is a deliberate simplicity choice -- do not introduce an icon library (Heroicons, Lucide, Font Awesome, etc.) without updating this section first; it would be a new dependency for a cosmetic want, not a comprehension need (AI.md section 13: avoid introducing dependencies without a clear reason).

No emoji anywhere in the UI.

---

# 30. Animation

Kept to the minimum already present:

- Mobile sidebar show/hide (instant toggle via `hidden` class, no transition currently -- acceptable given the panel appears/disappears rather than sliding).
- `transition-colors` on buttons/links (background/text color change on hover/focus) -- a short, subtle affordance, not a decorative flourish.

No page-load animations, animated counters, bouncing, or decorative transitions exist or should be added.

---

# 31. Content / Label Conventions

The application UI is entirely in Indonesian. Established terms (already consistent across the codebase and preserved by this refinement):

```
Dashboard, Sekolah, Branch, Tahun Anggaran, RKAS, Realisasi Bulanan,
Realisasi Semester, BOS, Piutang, Rekonsiliasi, Temuan & Tindak Lanjut,
Simpan, Batal, Kembali, Tambah, Ubah, Nonaktifkan, Aktif, Tidak Aktif,
Sesuai, Tidak Sesuai, Lengkap, Belum Lengkap, Selesai, Proses, Terbuka,
Pusat, Cabang, Semua Cabang, Semua Branch, Semua Sekolah, Terapkan
```

"Central" and "Branch" (the English role names) are internal/code identifiers only (`User.Role.CENTRAL`, `is_central()`, etc.) and never appear as visible UI text -- the UI always says "Pusat" / "Cabang".

---

# 32. Anti-Patterns (do not do this)

- Do not hard-code a hex value or a raw Tailwind palette color (`slate-*`, `blue-*`, `red-*`, `green-*`, `amber-*`, `indigo-*`, `purple-*`) in any template. Use the tokens in section 5.
- Do not invent a second button, panel, table, or badge style. Extend the existing component classes in `tailwind/input.css` `@layer components` instead.
- Do not turn a financial table into a grid of cards, on any screen size.
- Do not add a school/branch selector for a Branch user that could imply access to more than their own school/branch.
- Do not accept a client-submitted `school_id`/`branch_id` anywhere in a form -- school/branch scope is always server-derived (see `get_user_school`, `can_access_branch`, `can_modify_branch_data`).
- Do not add a comment (`/* ... */`) inside or near the `@theme` block in `tailwind/input.css` -- see the implementation note in section 5.
- Do not add an icon library, a charting library, or a CSS framework beyond the existing Tailwind v4 + HTMX stack for a cosmetic want.
- Do not use a bare context variable as a Django template *filter argument* (e.g. `{{ x|default:maybe_undefined }}`, `{% if a == b %}`) without first defaulting it via `{% with v=maybe_undefined|default_if_none:"" %}`. Unlike a plain `{{ var }}` output, filter arguments and `==` comparison operands are resolved *without* `ignore_failures`, so a genuinely undefined variable raises `VariableDoesNotExist` (a 500) instead of silently rendering empty. This bit the Select component during development (see section 33.3) -- `select.html` is the reference pattern for handling it.
- Do not build a new component (Dropdown item list, Select options, etc.) from a Django ModelForm/queryset without going through `as_select_options`/`select_label` (or an equivalent presentation-only shaping filter) -- do not hand-roll dict construction inside a view for a template concern.

---

# 33. Component System

The design system is organized as tokens → primitive components → composed components → application pages (see `templates/components/`). Every component listed below is real, in use, and covered by `tests/test_ui_components.py` -- this section documents actual implementation, not aspiration.

## 33.1 Directory Structure

```
templates/components/
    primitives/   button.html, icon_button.html, select.html, label.html
    feedback/     badge.html, alert.html, empty_state.html
    forms/        form_field.html, form_actions.html
    data/         metric_card.html
    navigation/   pagination.html
    overlay/      dropdown.html, dialog.html
    _status_badge.html   (domain wrapper around feedback/badge.html)
    _messages.html       (Django messages, wraps feedback/alert.html per message)
```

`static/js/components/` holds the vanilla-JS interaction layer: `overlay-utils.js` (shared click-outside/Escape/focus-trap helpers), `select.js`, `dropdown.js`, `dialog.js`, `sidebar.js`. All four behavior modules use **event delegation on `document`** (not per-node listeners bound at load), so they work automatically on any HTMX-swapped content with no re-initialization call needed.

## 33.2 Component Reference

**Button** (`primitives/button.html`)
Variants: `primary` (default) | `secondary` | `ghost` | `danger`. Sizes: `sm` | `md` (default) | `lg`. States: default, hover, focus-visible ring, disabled (anchor: `aria-disabled` + no href + no tabindex; button: `disabled` attribute). Renders `<a>` when `href` is passed, `<button>` otherwise. Params: `label`, `variant`, `size`, `type`, `href`, `disabled`, `icon` (raw SVG, developer-authored only), `extra_class`. Do not restyle a button inline on a page -- extend `.btn-*` in `tailwind/input.css` instead.

**IconButton** (`primitives/icon_button.html`)
Compact (`h-8 w-8`) control for icon-only actions (menu toggle, close, row "aksi" trigger). Always requires `label` (rendered as `aria-label`, not visible text) and `icon`. Variants: `ghost` (default, no border) | `secondary` (bordered). Do not use for anything text would communicate more clearly.

**Select** (`primitives/select.html`) -- flagship component, see 33.3.

**Label** (`primitives/label.html`)
For hand-authored fields outside a ModelForm's `{{ form.as_p }}`/per-field rendering (currently: the login form). ModelForm fields get label styling automatically from the global `form label` rule in `@layer base` and do not need this include.

**FormField** (`forms/form_field.html`)
Composes Label + a Django BoundField + help text + error list. Used where a form is laid out field-by-field instead of `.as_p` (School/Branch/BudgetYear create-edit forms). Required-marker is read from `field.field.required`, never hardcoded.

**FormActions** (`forms/form_actions.html`)
The Batal/Simpan row at the bottom of a form, consistently aligned everywhere it's used. Params: `cancel_url`, `cancel_label` (default "Batal"), `submit_label` (default "Simpan").

**Badge** (`feedback/badge.html`)
Generic label + colored dot. Tones: `neutral` (default) | `info` | `success` | `warning` | `danger`. `status_badge` (the `{% status_badge label tone %}` inclusion tag, backed by `_status_badge.html`) is a thin domain wrapper around this exact same primitive -- there is only one badge implementation in the app.

**Alert** (`feedback/alert.html`)
Inline banner. Tones: `info` (default) | `success` | `warning` | `danger`. `role="alert"` for danger, `role="status"` otherwise. `_messages.html` (Django's messages framework output) renders through this same component per message, mapped by `message.tags`.

**EmptyState** (`feedback/empty_state.html`)
Standalone (non-table) empty state: title + optional description + optional action (only rendered if both `action_label` and `action_url` are given -- the caller decides permission, the component never checks it). Table empty rows keep using the lighter inline `.table-empty` `<tr>` pattern (see section 17) -- do not wrap a single table row in this component.

**MetricCard** (`data/metric_card.html`)
Dashboard-only aggregate summary: `label` (eyebrow) + `value` (`.metric-value`, 20px -- never larger) + optional `supporting` line + optional `title` tooltip (used for OBD/TBD notes). Never used per financial record.

**Pagination** (`navigation/pagination.html`)
Behavior unchanged across every refinement phase. Prev/Next now compose `.btn-ghost.btn-sm` instead of one-off inline classes.

**Dropdown** (`overlay/dropdown.html`)
Action menu opened from a trigger. Real usage: the "Aksi" column on Branch/School/BudgetYear list pages (Ubah + conditional Nonaktifkan), replacing two bare inline links with a single "•••" `IconButton`. `items` is a list of `{"label", "url"}` dicts, optionally `"post": True` (renders a real CSRF-protected `<form>`, for Nonaktifkan) and/or `"danger": True`. Only one dropdown is open at a time (`dropdown.js` closes any other open instance before opening a new one).

**Dialog** (`overlay/dialog.html`)
Modal primitive: overlay, focus-trap-on-open, focus-restore-on-close, Escape, backdrop-click-to-close, explicit close button. **Not wired into any real page** -- no existing workflow needs a confirmation/modal interaction, and per this task's own instruction not to invent destructive-confirmation workflows, it stays a showcased-only primitive on `/ui-preview/` until a real use case exists.

**FilterBar** (`.filter-bar` CSS class, applied directly in `dashboard/index.html`)
Not a template include -- with a single real call site and no per-page variation beyond which fields appear, the reusable unit is the CSS treatment (bordered panel, `flex-wrap`, consistent field/label spacing), composed with `Select` + `Button` at the one place it's used. See section 51 (do not over-componentize).

**PageHeader** (`layout/page_header.html`)
Title + optional description + optional eyebrow. Django includes have no content "slot" for the primary action's arbitrary per-page markup, so the action button is rendered by the caller immediately after the include, inside a shared `.page-header-row` wrapper (see the include's own docstring for the exact pattern). Used on every list page; the RKAS detail page keeps its title inline instead (it needs `{{ rkas.school.name }} — {{ rkas.budget_year.name }}`-style string interpolation that doesn't fit the include's plain-string `description` param cleanly) -- this is a deliberate, documented exception, not an inconsistency.

## 33.3 Select -- Detail

`primitives/select.html` is a real accessible listbox (`role="listbox"`/`role="option"`, `aria-expanded`, `aria-selected`, `aria-haspopup`), not a styled `<div>`. It is backed by a genuine `<input type="hidden">` carrying the field's real `name`/`value`, so Django form/GET-param handling is completely unaffected by the visual layer -- verified end-to-end (see 33.4) by POSTing through the rendered School-create form and confirming Django's `ModelChoiceField` validation still runs and rejects an invalid branch exactly as it did before.

Keyboard: `Enter`/`Space`/`ArrowDown` opens from the trigger; `ArrowUp`/`ArrowDown` moves the active option; `Enter`/`Space` selects; `Escape` closes and returns focus to the trigger; clicking outside closes.

Applied as: (a) the dashboard filter bar's Branch/Sekolah/Tahun Anggaran filters (GET params), and (b) the School create/edit form's Branch field (POST, via `form.branch.field.queryset|as_select_options` and `selected=form.branch.value`). Every **other** ModelForm `<select>` in the app (financial-module create forms, month/semester/report-status fields, etc.) is intentionally left as a **styled native `<select>`** -- `appearance: none` plus a background-image chevron, applied globally in `@layer base` with zero per-form changes -- per the decision tree: native semantics are preferred whenever they're sufficient, custom interaction is reserved for the two places above where it visibly justified itself (a11y/reliability over visual imitation).

Two shaping filters back this component (`apps/core/templatetags/monitoring_extras.py`, presentation-only, no business logic): `as_select_options` (queryset/iterable → `[{"value", "label"}]`) and `select_label` (value → matching label, for the trigger's summary text).

## 33.4 Real Bugs Found Building This System

Documented so they are never silently reintroduced:

1. **Filter-argument `VariableDoesNotExist`.** `{{ x|default:maybe_undefined }}` and `{% if a == b %}` resolve their arguments/operands *without* `ignore_failures`, unlike a plain `{{ var }}` output -- a fully-undefined `selected`/`placeholder` (not merely `None`, but never passed to an `{% include %} with`) crashed the `/ui-preview/` page with a 500 before this was caught by `tests/test_ui_components.py::test_no_selection_falls_back_to_placeholder_without_crashing`. Fixed by defaulting every such variable through `{% with v=v|default_if_none:"" %}` at the top of `select.html`. See the anti-pattern entry in section 32.
2. **Verified, not a bug:** POSTing an out-of-scope `branch` value through the custom Select's hidden input was confirmed to still hit Django's normal `ModelChoiceField` validation and get rejected with "Select a valid choice... is not one of the available choices" -- proving the visual layer never bypasses server-side validation (section 45/52).

## 33.5 Deliberately Not Built

Per this task's own permission to skip components without a real use case (do not build unused complexity):

- **Tabs** -- no page currently has logical tabbed content.
- **Breadcrumb** -- the sidebar + compact header already establish location; no page is deep enough to need a trail.
- **Popover** -- Dropdown already covers the app's only overlay-menu interaction pattern; a separate primitive would duplicate it with no distinct use case.
- **Card with header/content/footer slots** -- Django `{% include %}` has no content-slot mechanism for arbitrary per-page body content; `.panel`/`.panel-padded` (plain CSS primitives) plus hand-authored internal structure (as on RKAS detail, Semester Summary) serve this need without a fragile templating workaround. `MetricCard` covers the one case that needed a true parameterized include.

---

# 34. Visual Art Direction & Product Polish

This section documents the phase that took the component system (section 33) from "functionally correct" to visually intentional. It changes presentation only -- every rule here composes the existing tokens (section 5); no new palette, no new components.

## 34.1 Surface Hierarchy

Three surface levels, communicated by background + border alone (no shadow at rest):

1. **Canvas** (`bg-canvas`, `#F6F7F9`) -- the application background (`<body>`, and now also the `<thead>` of every table, distinguishing it from the rows beneath it).
2. **Surface** (`bg-surface`, `#FFFFFF`) -- panels, forms, table row backgrounds, the sidebar, the header.
3. **Interactive/hover surface** -- a tinted state layer using the *accent* token at low opacity (`bg-accent/5` for table rows, `bg-accent/8` for select/dropdown options), not `bg-canvas`. Using accent-tinted hover instead of flat canvas was a deliberate fix: the previous phase's table rows hovered to the exact same color as their own `<thead>` background, erasing the header/body boundary. This is centralized once in `.table-base tbody tr:hover` -- every table improved automatically, and the redundant per-row `hover:bg-canvas` classes were removed from all 12 list templates.

## 34.2 Elevation

Three tiers, shadows reserved for genuine overlays only (never on a resting panel/card):

- **Level 0/1** (canvas / surface, panels, cards, tables): border only, no shadow.
- **Level 2** (Select listbox, Dropdown menu): `shadow-sm` -- a light lift, since these sit directly under their trigger and read as "part of" the control.
- **Level 3** (Dialog): `shadow-lg` -- the most elevated surface in the app, reserved for the one true modal overlay.

## 34.3 Typographic & Section Hierarchy

Two new section-level primitives added to `@layer components` (used everywhere a heading previously improvised `text-sm font-semibold uppercase tracking-wide text-muted`, which visually collided with `.eyebrow`):

- `.eyebrow` (12px, uppercase, muted) -- labels above a value or a nav category.
- `.section-title` (16px/`text-base`, semibold, `text-ink`) -- a genuine sub-heading inside a page ("Filter Monitoring", "Monitoring per Sekolah", "Riwayat Revisi", and the "Informasi Sekolah/Branch/Tahun Anggaran" form-section headers, the latter now with a `border-b border-hairline` divider under the title per the form-section mockup).

First-column emphasis: every table's primary entity column (school/branch/budget-year name) is now `font-medium text-ink` instead of default body weight, giving row scanning a clear anchor -- applied via the same `.table-base` component context across all 9 record-list tables plus the dashboard's monitoring table.

## 34.4 Sidebar & Header Identity

- **Sidebar brand mark**: replaced the single-line "Monitoring Keuangan Sekolah" text with a compact monogram ("MS", a solid `bg-primary` square) plus a two-line stacked wordmark (`MONITORING` eyebrow / `Sekolah` semibold) -- an intentional identity mark built entirely from existing tokens, no icon asset.
- **Sidebar user footer**: the plain two-line text block became a row with a circular initials avatar (`bg-primary/10` + `text-primary`, first letter of `user.name` via the `slice` filter) beside the name/scope text.
- **Header user context**: the plain floating text next to "Keluar" is now a `rounded-full bg-canvas` chip, giving it a visible boundary as a deliberate context element rather than loose text.

None of this changes what a Branch vs. Central user is shown -- purely presentational, same `user.branch`/`user.role` reads as before.

## 34.5 Dashboard Composition

Reordered/regrouped, no new data: Page Header → Metric row → **Filter Monitoring** panel (now titled, matching the "one control surface" direction rather than an unlabeled row of selects) → **Monitoring per Sekolah** (`.section-title`, promoted from an eyebrow-only label) → table → pagination → the OBD-DM-005 risk-status advisory (unchanged content, still last).

**MetricCard**: `.metric-card` now carries a 2px left accent rule (`border-l-primary/30`, intensifying to `border-l-primary` on hover) instead of a plain 4-sided border -- the "subtle vertical accent rule" called out as a reference option, applied via the shared component so every metric card in the app (dashboard, `/ui-preview/`) picked it up from one CSS change.

## 34.6 Detail Pages

RKAS Detail and Semester Summary both now lead with their one calculated headline figure (`RKAS Terakhir (kalkulasi)` / `Total Realisasi (kalkulasi)`) pulled out into its own accent-ruled block at `text-2xl` `text-primary`, with the remaining fields demoted into a plain `.eyebrow`-labeled grid below -- previously every field in these panels was visually equal weight.

## 34.7 Buttons & Micro-interactions

- `.btn-primary`/`.btn-secondary`/`.btn-danger` gained `active:translate-y-px` (a 1px press-down on click) and `transition-all duration-150` (previously `transition-colors` only) -- a deliberately small, 150ms tactile response, not a decorative animation.
- Global `prefers-reduced-motion: reduce` support added in `@layer base` (was missing entirely before this phase): every transition/animation duration collapses to near-zero for users who request it, app-wide, with no per-component opt-out needed.

## 34.8 Select / Dropdown Refinement

No architecture change (still the same listbox/menu built in section 33). Visual refinement only: hover/focus tint changed from flat `bg-canvas` to `bg-accent/8` (matching the table row-hover fix in 34.1), the selected option gained a subtle `bg-primary/5` fill in addition to the existing checkmark + `text-primary`, and both overlays moved from `shadow-md` to the tiered `shadow-sm` (34.2).

## 34.9 A Second Real Bug Found This Phase

A template literal containing a raw `"` character, passed as a component parameter (`{% include ... with title="Definisi \"lengkap\" ..." %}`), broke the surrounding HTML `title="..."` attribute in the rendered page. Root cause: Django does **not** HTML-escape template-source string literals the way it escapes `{{ variable }}` output from real data -- a literal typed directly in template syntax is treated as author-trusted and passed through raw. The `\"` was correctly parsed as a literal `"` *character* by the Django template lexer (Python-style string escaping is supported there), but that character then broke the *surrounding* HTML attribute unescaped. Fix: use `&quot;` HTML entities directly inside such literals instead of `\"`. Covered by `tests/test_ui_components.py::MetricCardComponentTests::test_title_tooltip_does_not_break_the_html_attribute`, and by a repo-wide grep confirming no other `\"`-inside-a-`with`-clause occurrences exist.
- Do not invent a risk score, completeness rule, or other business logic to "fill out" the dashboard -- every OBD-referenced TBD stays TBD until the business decides it.
