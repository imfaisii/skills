# Screens Playbook

Method and templates for turning an app idea + established design system into a complete, testable set of Claude Design screen prompts.

---

## 1. Research method (Phase 1)

3-5 targeted searches, not a research project. Answer these and stop:

1. **Table-stakes screens** — "what screens does a [category] app have", top comparable products' app-store screenshot sets. Output: draft screen list to validate, not invent, in interrogation.
2. **Navigation convention** — does this category live on a bottom tab bar (most consumer mobile), a single feed, or a hub-and-spoke? Deviating from category convention needs a reason; note the convention and whether to keep it.
3. **The category's hard screen** — every category has one screen that makes or breaks it (fitness: the logging screen; finance: the transaction feed; marketplace: the listing page). Identify it; it gets the most interrogation and the richest prompt.
4. **Monetization pattern** — how comparable apps gate (freemium wall, trial, subscription placement) so the paywall/upgrade screens are in the inventory from the start.

Write a ≤5-line category-conventions note. If the user's idea contradicts a strong convention, that's an interrogation question, not a silent override.

## 2. Interrogation question bank (Phase 2 fallback)

When `grill-me` isn't installed, draw from here — only what research + chat context left open. Max 2 rounds × 3-4 questions, multiple-choice where possible.

**Flows & core loop**
- Walk me through the ONE thing a user does daily. What triggers it, what are the steps, what does "done" look like?
- What's the very first thing a brand-new user must accomplish before the app is useful (the activation moment)?
- Which flows are v1 and which are explicitly later? (List candidates from research; make them choose.)

**Users & roles**
- One user type or several (e.g. customer vs provider)? Do roles see different navigation or the same app filtered?
- Logged-out experience: is there one (browse before signup), or is auth the front door?

**Data & states**
- What does the main screen show with ZERO data, day one? (Forces the empty-state decision.)
- What's the realistic extreme — 5 items or 5,000? (Sets list/search/pagination screens.)
- Offline: read-only cache, full offline, or online-only with a graceful error?

**Money & growth**
- What's free, what's paid, and WHERE does the user hit the wall?
- Notifications: which events genuinely warrant one? (Sets the permissions-prompt screen and notification settings.)

**Scope guillotine**
- Name two features you're tempted to include that we should cut from v1. (Best question in the bank — shrinks the inventory honestly.)

## 3. Screen inventory checklist (Phase 3)

Every app, walk all categories; include or consciously strike each:

| Category | Screens to consider |
|---|---|
| Entry | Splash/loading, onboarding (value, not tutorial — 3 max), auth (sign in/up, social, forgot/reset, verify) |
| Core loop | The 1-3 screens of the daily action — the app IS these; they get the richest prompts |
| Browse/find | Home/feed, list, search + results + **no-results**, filters, detail view |
| Create/edit | Composer/form, confirmation, success state |
| Social/share (if any) | Profile (own + others'), share sheet moment, invite |
| Money | Paywall/upgrade, plan picker, purchase confirm, manage subscription |
| System | Settings, account/profile edit, notification prefs, permissions prompts (notifications, camera, location — each is a designed moment, not an OS default), about/legal |
| Sad paths | Global error, offline banner/screen, empty states per major list, maintenance |

Inventory table format:

| # | Screen | Flow | Job (one line) | Entry from | Primary action | Exits to | Priority |

Rules: every screen has exactly one primary action; every entry/exit names another screen in the table (dangling exits = missing screen); P1 = core loop + activation path, P2 = supporting, P3 = edge. A typical v1 mobile app lands at 15-30 screens — under 12 means categories were skipped; over 40 means the scope guillotine wasn't used.

## 4. Prompt templates (Phase 5)

### 4.1 Canvas setup prompt (mobile / both) — runs FIRST

Template — fill brackets from the inventory and design system:

> Set up a single prototype canvas for **[App]** using the design system we've established. Lay out every screen as an iPhone-frame artboard, grouped into labeled sections by flow: [flow names]. Order screens left-to-right in the sequence a user actually moves through them.
>
> Make it fully interactive so I can test the whole app on this canvas: the tab bar navigates between [tabs]; every primary action pushes its target screen ([list the key wirings: e.g. "Log workout" → Exercise picker → Set logger → Summary]); back returns correctly; [modal/sheet] opens as an overlay, not a new page. I should be able to complete these journeys end-to-end by tapping: [P1 flow 1 in one line], [P1 flow 2], [P1 flow 3].
>
> Use real content throughout — [carry the content reality from the design system brief]. Where a screen isn't designed in detail yet, still place its artboard with a correct skeleton (nav, layout blocks, real title) so the map is complete; we'll refine screen by screen next.
>
> Nothing decorative on the canvas itself: section labels and flow arrows only where they aid testing.

The non-negotiables the filled prompt must keep: one canvas; grouped and labeled by flow; wired, walkable P1 journeys; overlays behave as overlays; placeholders are skeletons not gray boxes.

### 4.2 Per-screen prompt

> On the canvas, design the **[Screen]** screen (in [flow section]) using the established design system. Job: [one line — what the user accomplishes]. It's reached from [entries] and leads to [exits] — keep those wired.
>
> Content: [real, screen-specific content — names, numbers, labels from the content reality]. Primary action: **[action]** — nothing on this screen may compete with it. [1-2 screen-specific decisions: layout call, component reuse, the one thing that makes THIS screen different from a generic one.]
>
> Also design its [empty / loading / error — only the states that matter here] state[s]. Reuse system components; if a new component is needed, add it to the system with all states.

80-150 words filled. The swap test applies per screen: mention this app's actual data and decisions or it's not done.

### 4.3 Wiring sweep

> Walk every flow on the canvas as a user: tap through [P1 flows] end to end. Fix any dead taps, wrong back behavior, or unreachable screens. Then confirm every screen in sections [list] is reachable from the tab bar in ≤3 taps or has a deliberate deeper path.

### 4.4 States sweep

> Batch pass across all screens on the canvas: give every list its empty state (useful, action-forward — no sad illustration filler), every fetch a loading treatment consistent with the system, and every failure path the system's error pattern. Add an offline treatment for [the screens that need one]. Show me a list of what you added.

### 4.5 Test script (for the user, not Claude Design)

Generate a tap-by-tap checklist per P1 flow: "1. Launch → onboarding appears. 2. Skip → empty Home with [empty-state action] …" ending each flow with its done-state. The user walks this on the canvas; anything that fails becomes a follow-up prompt.

## 5. Assets via Deeporax (Phase 4)

Screens that commonly need assets Claude Design shouldn't improvise: onboarding illustrations, empty states, app icon, category imagery (e.g. exercise thumbnails, food photos). For each needed set, generate 1-2 **style references** with the Deeporax connector's graphic tool — one consistent, ownable style across the whole set (state the style in words in the generation prompt; align it with the design system's personality). The user uploads these into Claude Design; the per-screen prompts then say "match the attached illustration style". Never generate one-off styles per screen — a mixed illustration language is instant slop. Connector only; no external image APIs.

## 6. Compact anti-slop rules (fallback if design-prompt's PROMPT-FRAMEWORK.md is absent)

Apply to every emitted prompt:

- No hex codes or font names anywhere — the design system already made those calls; prompts reference it ("the established system"), never restate values
- Real content only; lorem ipsum and gray boxes banned, including on skeleton artboards (real titles, real nav)
- One primary action per screen; elements that carry no information get cut
- Empty states are useful (action + why), not decorative sadness
- No emoji as icons; no uniform card grids as the answer to every list; vary containment
- Permissions prompts and paywalls are designed moments with honest copy, not dark patterns
- Commit: each screen makes its one distinctive move consistent with the system's "memorable move" — sameness across 25 screens is system coherence; sameness with every other app is slop

## 7. Quality gate

1. Every checklist category in §3 addressed (included or consciously struck)
2. No dangling exits in the inventory table
3. Canvas prompt demands wired, walkable P1 journeys — reject static-grid phrasing
4. Every per-screen prompt passes the swap test and stays 80-150 words
5. Zero re-asked questions the chat/design brief already answered
6. Asset styles: one language across the set, generated via Deeporax connector only
7. Deliverable order: canvas → screens (P1 first) → sweeps → test script
