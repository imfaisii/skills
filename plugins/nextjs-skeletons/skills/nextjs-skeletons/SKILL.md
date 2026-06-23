---
name: nextjs-skeletons
description: Add and fix Next.js loading states and component-matched skeletons for faster perceived navigation, mirroring the app theme and dark mode with zero layout shift. Use when asked to add loading states, add or fix skeletons, add loading.tsx, set up loading UI, make navigation feel faster, fix layout shift on load, or improve perceived performance in a Next.js App Router or Pages Router app.
---

# nextjs-skeletons

Add route-level loading UI and component-matched skeletons to a Next.js app so navigation feels instant and content swaps in with no layout shift (CLS). Reuse the app's existing Skeleton primitive and theme tokens, honor dark mode and prefers-reduced-motion, and add accessibility. Works for App Router, Pages Router, and mixed mid-migration repos.

All long code lives in `SKELETONS.md` (same folder). Read it before writing any skeleton. Run `audit.sh` first to get a worklist of missing loading files, gaps, and existing skeletons to review.

## The one rule that drives everything

`loading.tsx` and server `<Suspense>` react ONLY to server render suspension: initial load and client navigation INTO a segment. They do NOT fire for client refetches, useEffect/useState loading, SWR/React Query refetch, server-action pending, or in-page filtering. Those each need their own in-component skeleton. Keep this split in mind through every phase.

## Match the real component before you draw a skeleton

A skeleton only prevents CLS if its box matches what replaces it. Before generating any skeleton, open the real component (the page body, the card, the row, the list item) and read its outer container classes and child structure: container width and padding, grid columns and gaps, item/row/column counts, each child's height, width, radius, and aspect-ratio. Mirror those exact values. Do not guess dimensions. If the real count is dynamic, use a representative count (cards 6, table rows 5 to 10, list items 6 to 10) and keep gaps and padding identical.

## Idempotency (safe to re-run)

Every phase checks before it writes, so a second run never duplicates work.
- loading.tsx: a segment already has a sibling `loading.*` -> skip (see audit "MISSING loading" vs "DUPLICATE").
- Suspense: the slow child is already wrapped in `<Suspense>` (grep the file for `Suspense` and the component name) -> skip.
- Client skeleton: the file already imports/uses a `Skeleton` AND has a `if (loading|isPending|isLoading)` branch returning one -> do not add a second; instead review it under Phase 5.
- Primitive: a Skeleton primitive already exists -> import it, never create a second.

## Workflow

Work one route or one component at a time.

### Phase 0: Detect project shape

Read `package.json`: `next` version (Next 13.4+ has App Router and loading.tsx stable; 13.0 to 13.3 were beta; 14/15/16 qualify), `react` version (19 enables `use()` and `useActionState`), and which of these are present: `tailwindcss`, `@mui/material`, `@chakra-ui/react`, `@mantine/core`, `react-loading-skeleton`, `next-themes`, `swr`, `@tanstack/react-query`. Detect TS vs JS via `tsconfig.json` and file extensions.

Detect the router. Glob all four roots since either may be nested under `src/`: `app/`, `src/app/`, `pages/`, `src/pages/`. Both present is the common mid-migration case; treat each tree with its own router rules.

Verify: state the router type(s), Next/React versions, styling system, and detected libraries before changing anything.

### Phase 1: Establish the Skeleton primitive and theme tokens

Reuse before you create. Probe for, in order: shadcn at `components/ui/skeleton.tsx` or `src/components/ui/skeleton.tsx`; `react-loading-skeleton` in deps; MUI/Chakra/Mantine Skeleton. If any exists, import and use it. Do not introduce a second skeleton style.

Read the theme so skeletons adapt to dark mode for free: `tailwind.config.*` `darkMode` and `theme.extend.colors` (the app's own neutral/surface names such as `surface`, `subtle`, `muted`), `globals.css` CSS variables (`--muted`, `--accent`, `--card`, or whatever the app declares), and `next-themes` ThemeProvider. Build skeletons from the app's own neutral or surface token first (`bg-muted`, `bg-accent`, or a project color like `bg-surface`, whatever the installed setup uses). If a `foreground` token is confirmed to exist, use the single adaptive class `bg-foreground/10`. Only if there is truly no usable token, fall back to `bg-black/10 dark:bg-white/10`.

If no primitive exists, create one matched to the app theme. See `SKELETONS.md` (Primitive) for the exact code with `motion-reduce:animate-none`.

Verify: skeletons reference a theme token or the existing primitive, not a hardcoded gray, and the chosen fallback is consistent across every skeleton you add.

### Phase 2: Add route-level loading.tsx (App Router)

For each directory containing a `page.*`, check for a sibling `loading.*` in the SAME folder. If present, skip (never overwrite). If missing and the page does meaningful data work (await/fetch/db) or nothing renders without data, add `loading.tsx` that mirrors that route's real layout using matched skeletons. Include route-group `(folders)`; they own loading files too. Skip trivially static pages.

The fallback replaces ONLY the page slot, not the surrounding `layout.tsx`. The sidebar, header, and nav that `layout.tsx` renders stay painted; only the page area shows the fallback. So mirror the page content region (same container width, padding, and grid as `page.tsx`) and do NOT redraw chrome the layout already provides, or you reintroduce the exact CLS this skill prevents. See `SKELETONS.md` (Route loading.tsx).

Parallel route slots (folders starting with `@`, e.g. `@modal`, `@analytics`) each own their own `loading.tsx` and `default.tsx`. Check each slot folder, not just the segment root.

Do NOT add a loading.tsx to paper over a slow same-segment `layout.tsx`. `loading.tsx` does not wrap the sibling layout, so if the layout awaits cookies/headers/uncached fetch the fallback never shows and navigation blocks. Fix by moving that data into `page.tsx` or wrapping it in its own `<Suspense>` inside the layout.

For dynamic routes (`[slug]`), adding loading.tsx enables partial prefetch and an instant nav skeleton; add `generateStaticParams` where the route can prerender.

Pages Router has no loading.tsx. Skip this phase for `pages/` and rely on Phase 4 plus the Pages fallback in `SKELETONS.md`.

Verify: each segment (and each `@slot`) has at most one loading file; the fallback matches the page region only; LCP hero stays outside any full-page skeleton where possible.

### Phase 3: Granular Suspense around slow async server data

Where a page renders both fast content and a slow async server component, wrap only the slow part in `<Suspense fallback={<MatchedSkeleton/>}>` so the shell and fast sections paint immediately and each section streams in. Prefer this over a route-wide loading.tsx when part of the page can render without data. Idempotency: if the slow child is already inside a `<Suspense>`, skip it. The skeleton goes in the fallback, never inside the async component. To stream a server-started fetch into a client component, pass the unresolved promise and read it with `use()` inside a `<Suspense>`. See `SKELETONS.md` (Suspense and use()).

Verify: fast content is not blocked behind slow data; the LCP element is outside Suspense; no double-wrapping.

### Phase 4: Client-side data-fetch skeletons

Find client gaps: grep `'use client'` files for `useEffect`+`fetch`, `useSWR`, `useQuery`, `useFormStatus`, `useActionState`, `use(`. Anything that returns null, a bare spinner, or the final layout shape with no skeleton is a gap. Before adding, confirm the site does not already have a skeleton branch (idempotency); if it does but the shape is wrong, fix it under Phase 5. Add a component-matched skeleton at the right gate:

- useEffect+fetch: branch `if (loading) return <XSkeleton/>` then explicit error and empty branches; init loading true, clear in finally, and guard every state setter with an `active` flag plus AbortController so a late or aborted response cannot flip state.
- SWR: gate on `isLoading` (not `isValidating`); `keepPreviousData: true` for pagination. SWR dedupes requests, so no manual AbortController is needed.
- React Query v5: gate on `isPending` (v4 name was `isLoading`). v5 still exposes `isLoading` but it now means `isPending && isFetching`; use `isPending` for the no-data-yet gate. Use `placeholderData: keepPreviousData` for pagination. React Query passes an AbortSignal to `queryFn` automatically; thread it into fetch.
- `use()`: create the promise in an ancestor that does not suspend on it, read it in a `<Suspense>`-wrapped child. For client-triggered refetch do not use raw `use()` with an inline promise; use useState/useMemo/a cache or a data library.
- Server actions: `useFormStatus` in a child SubmitButton inside the form, or `useActionState` `isPending`. Import `useFormStatus` from `react-dom`, `useActionState` from `react`.

Full code for each in `SKELETONS.md` (Client patterns).

Verify: no loading branch falls through to a spinner; pagination does not full-flash the skeleton; no site got a second duplicate skeleton.

### Phase 5: Fix existing skeletons

Repair, do not just add. The audit's "REVIEW existing skeleton" lines are your targets: files that already use a Skeleton but show likely defects. First read the real component the skeleton stands in for (see "Match the real component" above), then flag and fix: dimensions that do not mirror real content (one box for a card grid, a spinner for a table) causing CLS; hardcoded grays (`bg-gray-`, `bg-slate-`, `bg-zinc-`, hex, `rgb(`) that break dark mode; spinner-only or "Loading..." text where a matched skeleton belongs; missing `role="status"` + `aria-busy` + `sr-only` label; missing `prefers-reduced-motion` handling (`animate-` with no `motion-reduce`). Match height, width, radius, gaps, item count, and aspect-ratio to the real component. See `SKELETONS.md` (recipes) for the matched shapes.

Verify: each fixed skeleton matches its real component's box, uses theme tokens, and announces loading once to screen readers.

### Phase 6: Verify

Run typecheck and build (`bun run` scripts if present, else the repo's package manager per its lockfile; do not migrate tooling). Re-run `audit.sh` to confirm no segment gained a duplicate loading file, no duplicate skeleton was added, and the "REVIEW existing skeleton" list shrank. Confirm visually: skeleton boxes match content (no shift), dark variant renders, and reduced-motion stops the pulse.

Verify: typecheck and build pass; audit queries are clean; no duplicates.

## Quick reference

- App vs Pages vs mixed: glob `app`, `src/app`, `pages`, `src/pages`.
- Parallel route slots (`@slot` folders) each own their own loading.tsx and default.tsx.
- loading.tsx fills only the page slot; layout chrome stays painted, so mirror the page region only.
- Skeleton goes in the Suspense FALLBACK, never inside the async component.
- Text -> line skeleton (last line shorter). Card -> card skeleton. Plus table, list, avatar, image, button, form, stat. Read the real component, then match the box.
- Reuse the app primitive and tokens; honor dark mode and reduced motion; add the a11y status region.
- Re-runnable: check for an existing file, Suspense wrapper, or skeleton branch before inserting.