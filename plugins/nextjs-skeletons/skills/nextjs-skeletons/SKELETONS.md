## SKELETONS.md

Reference library for `nextjs-skeletons`. Every recipe is component-matched (mirrors the real element's box to avoid CLS), theme-aware (uses tokens, adapts to dark mode), reduced-motion safe, and carries the a11y status region. Examples use the shadcn primitive and Tailwind; adapt class names to the detected system. Read the real component first and copy its dimensions; the numbers below are starting points, not fixed truth.

### Library reuse table

Detect the installed system first and reuse it. Only create a new primitive when none of these exist.

| Detected | Reuse this | Notes |
| --- | --- | --- |
| shadcn `components/ui/skeleton.tsx` | the exported `Skeleton` | newer source uses `bg-accent` + `data-slot="skeleton"`; older used `bg-muted`. Keep whatever is installed. |
| `react-loading-skeleton` | `<Skeleton>` + `<SkeletonTheme>` | wire `baseColor`/`highlightColor` to CSS vars for dark mode. |
| MUI | `<Skeleton variant="text|rectangular|circular">` | respects theme palette and reduced motion already. |
| Chakra | `<Skeleton>` / `<SkeletonText>` | theme-aware. |
| Mantine | `<Skeleton>` | theme-aware. |
| none | create the primitive below | use the app's neutral/surface token, else `bg-foreground/10`, else `bg-black/10 dark:bg-white/10`. |

### Theme and a11y guidance

- Color: never hardcode gray. Prefer the app's own token (`bg-muted`/`bg-accent` for shadcn, or a project color like `bg-surface`). The single adaptive fallback when a `foreground` token exists is `bg-foreground/10`. Only with no usable token at all, use `bg-black/10 dark:bg-white/10`. Pick one fallback and use it identically everywhere. Token-based colors flip with `.dark` automatically.
- Reduced motion: add `motion-reduce:animate-none` to the primitive. Prefer built-in `animate-pulse` over a custom shimmer; if you add shimmer, gate it behind reduced motion and use theme-aware colors so dark mode has no harsh white streak.
- A11y: one wrapper per loading region with `role="status" aria-busy="true"` plus an `sr-only` label like "Loading posts". Use a concrete label per region, not a bare repeated "Loading". Mark decorative bars `aria-hidden="true"` so screen readers announce loading once, not every empty box. The `role="status"` wrapper must be valid HTML: do not put a non-`<li>` child (like an sr-only `<span>`) directly inside a `<ul>`; wrap with a `<div>` instead (see ListSkeleton).
- CLS: match height to line-height, width to typical content, radius to the real element (full for avatars, md for cards), gaps/padding to the real layout, aspect-ratio for images. For text, make the last line shorter.

### Primitive (create only if none exists)

```tsx
// components/ui/skeleton.tsx
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // bg-accent = theme token, auto-adapts to dark mode via CSS vars.
      // motion-reduce:animate-none disables the pulse for prefers-reduced-motion.
      // Older shadcn used bg-muted / bg-primary/10. Reuse whatever is installed.
      className={cn(
        "bg-accent animate-pulse rounded-md motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

// No token system? swap the className for the single adaptive fallback:
// "bg-foreground/10 animate-pulse rounded-md motion-reduce:animate-none"
// Only if no foreground token exists either:
// "bg-black/10 dark:bg-white/10 animate-pulse rounded-md motion-reduce:animate-none"
```

### Matched recipes

#### Text (multi-line, last line shorter)

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div role="status" aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading content</span>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          aria-hidden="true"
          // h-4 matches text-sm/base line height; last line shorter reads as a paragraph
          className={i === lines - 1 ? "h-4 w-4/5" : "h-4 w-full"}
        />
      ))}
    </div>
  )
}
```

#### Heading

```tsx
export function HeadingSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading heading</span>
      <Skeleton aria-hidden="true" className="h-8 w-1/2" />
    </div>
  )
}
```

#### Avatar

```tsx
// match the real avatar size and full rounding
export function AvatarSkeleton() {
  return <Skeleton aria-hidden="true" className="size-10 rounded-full" />
}
```

#### Card (image + title + text + footer)

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export function CardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      // match the real <Card>: same border, radius, padding
      className="rounded-lg border p-4 space-y-4"
    >
      <span className="sr-only">Loading card</span>
      <Skeleton aria-hidden="true" className="aspect-video w-full rounded-md" />
      <Skeleton aria-hidden="true" className="h-6 w-3/4" /> {/* title */}
      <div className="space-y-2">
        <Skeleton aria-hidden="true" className="h-4 w-full" />
        <Skeleton aria-hidden="true" className="h-4 w-2/3" />
      </div>
      <div className="flex items-center gap-3 pt-2"> {/* footer */}
        <Skeleton aria-hidden="true" className="size-8 rounded-full" />
        <Skeleton aria-hidden="true" className="h-4 w-24" />
      </div>
    </div>
  )
}
```

#### Table (header + N rows x M cols)

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  const grid = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
  return (
    <div role="status" aria-busy="true" className="w-full rounded-lg border">
      <span className="sr-only">Loading table</span>
      <div className="grid gap-4 border-b px-4 py-3" style={grid}>
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} aria-hidden="true" className="h-4 w-24" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-4 px-4 py-3" style={grid}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} aria-hidden="true" className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}
```

#### List (repeated avatar + 2 lines)

```tsx
import { Skeleton } from "@/components/ui/skeleton"

// role/aria-busy and the sr-only label live on the wrapping div, not the ul.
// A <ul> may only contain <li>, so an sr-only <span> child of <ul> is invalid HTML.
export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading list</span>
      <ul className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="flex items-center gap-3">
            <Skeleton aria-hidden="true" className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton aria-hidden="true" className="h-4 w-3/4" />
              <Skeleton aria-hidden="true" className="h-3 w-1/2" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

#### Image, Button, Form, StatCard

```tsx
export function ImageSkeleton() {
  // match the real image aspect ratio (aspect-video / aspect-square)
  return <Skeleton aria-hidden="true" className="aspect-video w-full rounded-md" />
}

export function ButtonSkeleton() {
  return <Skeleton aria-hidden="true" className="h-10 w-24 rounded-md" />
}

export function FormSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div role="status" aria-busy="true" className="space-y-4">
      <span className="sr-only">Loading form</span>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton aria-hidden="true" className="h-4 w-24" /> {/* label */}
          <Skeleton aria-hidden="true" className="h-10 w-full rounded-md" /> {/* input */}
        </div>
      ))}
      <Skeleton aria-hidden="true" className="h-10 w-28 rounded-md" /> {/* submit */}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div role="status" aria-busy="true" className="rounded-lg border p-4 space-y-2">
      <span className="sr-only">Loading stat</span>
      <Skeleton aria-hidden="true" className="h-3 w-20" />  {/* label */}
      <Skeleton aria-hidden="true" className="h-8 w-28" />  {/* big number */}
      <Skeleton aria-hidden="true" className="h-3 w-16" />  {/* delta */}
    </div>
  )
}
```

### Route loading.tsx (App Router)

```tsx
// app/dashboard/loading.tsx
// Next auto-wraps app/dashboard/page.tsx in <Suspense fallback={<Loading/>}>.
// Shows on initial load and on navigation INTO /dashboard while the server renders.
// IMPORTANT: this fills ONLY the page slot. The layout.tsx chrome (sidebar, header,
// nav) stays painted, so mirror the page CONTENT region only (same container width,
// padding, grid, card count as page.tsx). Do NOT redraw the sidebar/header here.
import { CardSkeleton } from "@/components/skeletons/card-skeleton"

export default function Loading() {
  return (
    <div role="status" aria-busy="true" className="grid gap-4 md:grid-cols-3">
      <span className="sr-only">Loading dashboard</span>
      {/* mirror the real page body: same grid columns, gap, and card count */}
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
```

### Granular Suspense around slow async server components

```tsx
// app/dashboard/page.tsx
import { Suspense } from "react"
import { Revenue } from "./revenue"            // async server component (slow)
import { RecentOrders } from "./recent-orders" // async server component (slow)
import { CardSkeleton, TableSkeleton } from "@/components/skeletons"

export default function Dashboard() {
  return (
    <div>
      {/* paints instantly in the static shell, not blocked by data; keep LCP here */}
      <h1>Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        <Suspense fallback={<CardSkeleton />}>
          <Revenue />
        </Suspense>
        <Suspense fallback={<TableSkeleton rows={5} cols={4} />}>
          <RecentOrders />
        </Suspense>
      </div>
    </div>
  )
}
```

The skeleton lives in the fallback. Do NOT put it inside `Revenue`/`RecentOrders` (those do not render until their awaits resolve, so the skeleton would never show).

### Stream a server promise into a client component with use()

```tsx
// app/dashboard/page.tsx (server) - start the fetch, do NOT await
import { Suspense } from "react"
import { StatsChart } from "./stats-chart"
import { CardSkeleton } from "@/components/skeletons"
import type { Stats } from "./types"

export default function Page() {
  // Created during render of a component that does NOT suspend on it.
  // This page re-creates the promise each render, which is fine for initial-load
  // streaming. It is NOT a cache: an unrelated re-render makes a fresh promise.
  const statsPromise: Promise<Stats> = fetch("https://api.example.com/stats").then((r) => r.json())
  return (
    <Suspense fallback={<CardSkeleton />}>
      <StatsChart dataPromise={statsPromise} />
    </Suspense>
  )
}

// app/dashboard/stats-chart.tsx (client)
"use client"
import { use } from "react"
import type { Stats } from "./types"
export function StatsChart({ dataPromise }: { dataPromise: Promise<Stats> }) {
  const stats = use(dataPromise) // suspends until resolved -> Suspense shows the fallback
  return <div>{/* render chart from stats */}</div>
}
```

The deciding rule: the promise must be created during render of a component that is NOT itself suspended by that promise, and there must be an ancestor `<Suspense>`. Creating it inside the component that calls `use()` makes a new promise every render that never settles. Hoisting it to an ancestor does not make it stable across unrelated re-renders either; that ancestor re-rendering produces a fresh promise. That is acceptable for initial-load streaming. For client-triggered refetch, do not use raw `use()` with an inline promise: drive it with useState/useMemo, a cache, or a data library (SWR/React Query).

### Client patterns

#### useEffect + fetch (loading -> skeleton, plus error and empty)

```tsx
"use client"
import { useEffect, useState } from "react"
import { CardSkeleton } from "@/components/skeletons"

export function Profile({ id }: { id: string }) {
  const [data, setData] = useState<{ name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true            // guards setters after unmount or id change
    const ctrl = new AbortController()
    setLoading(true)
    fetch(`/api/users/${id}`, { signal: ctrl.signal })
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json() })
      .then((d) => { if (active) setData(d) })
      .catch((e) => { if (active && e.name !== "AbortError") setError(e) })
      .finally(() => { if (active) setLoading(false) }) // active guard: a stale finally cannot flip loading
    return () => { active = false; ctrl.abort() }
  }, [id])

  if (loading) return <CardSkeleton />     // matched skeleton, not a spinner
  if (error) return <p role="alert">Could not load profile.</p>
  if (!data) return <p>No profile found.</p>
  return <article>{data.name}</article>
}
```

#### SWR (gate on isLoading, keepPreviousData for pagination)

```tsx
"use client"
import useSWR from "swr"
import { CardSkeleton } from "@/components/skeletons"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function StatsCard({ range }: { range: string }) {
  const { data, error, isLoading } = useSWR(
    `/api/stats?range=${range}`,
    fetcher,
    { keepPreviousData: true }, // keep prior data while a new range loads
  )
  if (isLoading) return <CardSkeleton /> // isLoading = first load, no cached data (not isValidating)
  if (error) return <p role="alert">Could not load stats.</p>
  if (!data) return <p>No data.</p>
  return <div className="rounded-xl border p-4">{data.total}</div>
}
```

#### React Query v5 (gate on isPending, placeholderData for pagination)

```tsx
"use client"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { ListSkeleton } from "@/components/skeletons"

export function PostList({ page }: { page: number }) {
  const { data, isPending, isError, isPlaceholderData } = useQuery({
    queryKey: ["posts", page],
    // React Query passes signal automatically; thread it into fetch
    queryFn: ({ signal }) => fetch(`/api/posts?page=${page}`, { signal }).then((r) => r.json()),
    placeholderData: keepPreviousData, // v5: avoids full skeleton flash on page change
  })
  if (isPending) return <ListSkeleton count={10} /> // v5 isPending (v4 was isLoading)
  if (isError) return <p role="alert">Failed to load posts.</p>
  // This example assumes the endpoint returns an array. For an envelope like
  // { items: [...] }, read data.items and adjust the empty/.map checks to match.
  const posts: { id: string; title: string }[] = data ?? []
  if (posts.length === 0) return <p>No posts yet.</p>
  return (
    <ul className={isPlaceholderData ? "opacity-60" : undefined}>
      {posts.map((p) => <li key={p.id}>{p.title}</li>)}
    </ul>
  )
}
```

#### use() in a client child

```tsx
"use client"
import { use } from "react"
export function Comments({ commentsPromise }: { commentsPromise: Promise<{ id: string; body: string }[]> }) {
  const comments = use(commentsPromise) // ancestor must be <Suspense fallback={<ListSkeleton/>}>
  return <ul>{comments.map((c) => <li key={c.id}>{c.body}</li>)}</ul>
}
```

#### Server action pending (useFormStatus)

```tsx
"use client"
import { useFormStatus } from "react-dom" // react-dom, NOT react

// MUST be a child rendered INSIDE the <form> to read its pending state
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? (
        <span className="inline-flex items-center gap-2" role="status" aria-busy="true">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
          Saving...
        </span>
      ) : "Save"}
    </button>
  )
}

export function ProfileForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  return (
    <form action={action}>
      <input name="name" />
      <SubmitButton />
    </form>
  )
}
```

#### Server action pending (useActionState, when you need the return value)

```tsx
"use client"
import { useActionState } from "react" // React 19 (was useFormState in 18.3)
import { saveProfile } from "./actions" // 'use server' action returning { error?: string }

export function ProfileForm() {
  const [state, formAction, isPending] = useActionState(saveProfile, { error: undefined })
  return (
    <form action={formAction}>
      <input name="name" />
      {state.error && <p role="alert">{state.error}</p>}
      <button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save"}</button>
    </form>
  )
}
```

#### Optional: avoid skeleton flash on very fast loads

```tsx
"use client"
import { useEffect, useState } from "react"

// Only flips true after `delay` ms, so fast responses paint straight to content.
function useDelayedFlag(active: boolean, delay = 200) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!active) { setShow(false); return }
    const t = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(t)
  }, [active, delay])
  return show
}
// usage: const showSkeleton = useDelayedFlag(isPending); if (showSkeleton) return <ListSkeleton />
```

### Pages Router fallback (no loading.tsx)

The `loading.tsx` convention does not exist in `pages/`. Use three mechanisms.

```tsx
// 1) Conditional skeleton on client data state (SWR / React Query / useEffect)
import { useQuery } from "@tanstack/react-query"
import { TableSkeleton } from "@/components/skeletons"

export default function Orders() {
  const { data, isPending } = useQuery({ queryKey: ["orders"], queryFn: fetchOrders })
  if (isPending) return <TableSkeleton rows={10} />
  return <OrdersTable data={data} />
}

// 2) next/dynamic with a loading component (code-split)
import dynamic from "next/dynamic"
import { ChartSkeleton } from "@/components/skeletons"
const Chart = dynamic(() => import("@/components/Chart"), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})

// 3) Global route-change progress via router events (pages/_app.tsx)
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
export function NavProgress() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  useEffect(() => {
    const start = () => setPending(true)
    const done = () => setPending(false)
    router.events.on("routeChangeStart", start)
    router.events.on("routeChangeComplete", done)
    router.events.on("routeChangeError", done)
    return () => {
      router.events.off("routeChangeStart", start)
      router.events.off("routeChangeComplete", done)
      router.events.off("routeChangeError", done)
    }
  }, [router])
  return pending ? <div className="top-progress-bar" role="status" aria-busy="true" /> : null
}
```

### Pending-navigation feedback on slow networks (App Router, Next 15.3+)

```tsx
// app/ui/loading-indicator.tsx
"use client"
import { useLinkStatus } from "next/link"

export default function LoadingIndicator() {
  const { pending } = useLinkStatus()
  // Debounce via CSS: opacity:0 + ~100ms animation delay so it only shows on slow navs.
  return <span aria-hidden className={`link-hint ${pending ? "is-pending" : ""}`} />
}
// Use inside the Link: <Link href="/dashboard">Dashboard<LoadingIndicator /></Link>
//
// NOTE: pending is SKIPPED for already-prefetched routes. In-viewport Links are
// prefetched by default, so this indicator often never fires for them. It is most
// useful on links with prefetch={false} or routes not yet prefetched.
```

### react-loading-skeleton (when the app already depends on it)

```tsx
import Skeleton, { SkeletonTheme } from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

export function ThemedSkeletons() {
  return (
    // wire library colors to the app CSS variables so dark mode works
    <SkeletonTheme baseColor="var(--muted)" highlightColor="var(--accent)">
      <div role="status" aria-busy="true">
        <span className="sr-only">Loading content</span>
        <Skeleton count={3} />
        <Skeleton circle width={40} height={40} />
      </div>
    </SkeletonTheme>
  )
}
```

### Pitfalls checklist

- loading.tsx covers only server suspension on initial load and nav into a segment. Not client refetch, useEffect/useState, SWR/RQ refetch, server-action pending, or in-page filtering.
- loading.tsx fills only the page slot; the sibling layout.tsx chrome stays painted. Mirror the page region only, not the sidebar/header.
- loading.tsx does NOT wrap the sibling layout.tsx; a layout awaiting cookies/headers/uncached fetch blocks navigation. Move data into page.tsx or its own Suspense.
- Parallel route slots (`@slot` folders) each own their own loading.tsx and default.tsx.
- A high loading.tsx collapses the whole route to one full-page skeleton. Use per-section Suspense for streaming.
- Keep the LCP element (hero heading/image) outside Suspense.
- Skeleton goes in the Suspense fallback, never inside the async component.
- useFormStatus must be a child inside the form and imported from react-dom.
- React Query v5: gate on isPending (not isLoading; v5 isLoading now means isPending && isFetching) and placeholderData: keepPreviousData.
- useEffect+fetch: guard setters with an `active` flag plus AbortController; a stale finally can otherwise flip loading.
- use() needs the promise created in an ancestor that does not suspend on it, plus an ancestor Suspense. It is not a cache; for client refetch use useState/useMemo or a data library.
- useLinkStatus pending is skipped for prefetched (in-viewport) links.
- Never hardcode gray. Read the real component, then match dimensions, count, radius, aspect-ratio. Reuse the existing primitive. Add role=status/aria-busy/sr-only and motion-reduce.
- a11y HTML: do not put an sr-only span directly inside a ul; put role/aria-busy on a wrapping div.