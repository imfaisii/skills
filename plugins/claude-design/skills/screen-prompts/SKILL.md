---
name: screen-prompts
description: Research an app idea, interrogate the user with pointed questions (via the /grill-me skill when installed), build the complete screen inventory, and generate Claude Design prompts for every screen — plus, for mobile apps, a prompt that sets up an interactive device-frame canvas where the whole app can be click-through tested. Use when the user wants prompts for all screens, a full app prompt package, says "generate the screen prompts", "map all my screens", "make the prototype canvas prompt", or wants to continue from a design-system prompt made earlier in the chat. Output is prompts and a screen map — not the designs themselves.
---

# Screen Prompts for Claude Design

Where the `design-prompt` skill produces the design-system kickoff, this skill produces everything after it: a researched, interrogated, complete map of the app's screens, and a prompt for each one — ending, for mobile apps, with an **interactive prototype canvas** prompt that lays every screen out in device frames on one canvas with flows wired, so the user can click through and test the entire app inside Claude Design.

Never generate screen prompts from the user's one-liner alone. The value of this skill is that research + interrogation happen FIRST, so the screen list is complete (including the screens users forget: auth recovery, empty states, permissions, settings, paywall) and every prompt is grounded in real decisions rather than guesses.

## Inputs & context reuse

- **The app idea / rough prompt** — required, unless already established in this chat.
- **Design-system context** — check the current conversation first. If the `design-prompt` skill already ran here (or the user pasted a Claude Design system/brief), reuse it: personality, IA decisions, component vocabulary, and content reality carry over verbatim into every screen prompt. Do not re-ask what's already decided. If no design system exists yet, say so and offer to run `design-prompt` first — screen prompts without an established system produce inconsistent screens.
- **Platform** — mobile app, web app, or both. Mobile (or "both") switches on the prototype-canvas deliverable.

## Workflow

Read [SCREENS-PLAYBOOK.md](SCREENS-PLAYBOOK.md) before starting — it holds the research method, the interrogation question bank, the screen-inventory checklists, and the prompt templates. If the `design-prompt` skill is installed alongside this one, also apply its `PROMPT-FRAMEWORK.md` anti-slop rulebook to every prompt you emit; the playbook carries a compact copy in case it isn't.

### Phase 1 — Research

Before asking the user anything, spend a few searches understanding the category (WebSearch): what screens and flows are table-stakes for this kind of app, how the top 2-3 comparable products structure onboarding/navigation/monetization, and which patterns users of this category already know (don't make users relearn conventions without a reason). Output: a short category-conventions note and a draft flow list. Research first so your questions to the user are sharp instead of generic.

### Phase 2 — Interrogation

**If the `grill-me` skill is installed** (check the skills list), invoke it with the app context and instruct it to grill the user about: primary flows and their endpoints, user types/roles, what happens on first launch with zero data, monetization and gating, notifications, offline/error behavior, and what's explicitly OUT of scope for v1.

**If `grill-me` is not installed**, run the fallback interrogation in the playbook yourself: at most 2 rounds of AskUserQuestion, 3-4 questions per round, drawn from the question bank — prioritized by what research left unresolved. Never ask what research or chat context already answered.

Stop interrogating when you can name every flow's trigger, steps, and end state. Unresolved minor points become stated assumptions, not more questions.

### Phase 3 — Screen inventory

Build the complete screen map per the playbook checklist: every screen grouped by flow, each with a one-line job, entry points, primary action, and exit points. Include the always-forgotten screens (auth + recovery, onboarding, empty/first-run, loading/skeleton, errors/offline, permissions prompts, settings/account, paywall/upgrade, search-with-no-results). Mark each screen P1 (core loop) / P2 (supporting) / P3 (edge). Show the inventory to the user as part of the deliverable — it is itself a design artifact.

### Phase 4 — Asset plan (Deeporax, optional)

List assets the screens need that Claude Design shouldn't improvise: app icon direction, onboarding/empty-state illustration style, category imagery. Offer to generate style-reference versions with the **Deeporax connector's graphic generation tool** for the user to upload into Claude Design — reference/mood level, consistent style across the set, never photorealistic stock-alikes. Connector only; if it's not connected, note the asset list and move on. Optional, never blocking.

### Phase 5 — Compose the prompt package

Using the playbook templates, in this order:

1. **Canvas setup prompt** (mobile or both): instructs Claude Design to create one canvas with every screen in a device frame, grouped by flow with labeled sections, and interactions wired so the full app is click-through testable — tabs navigate, buttons push screens, back works, the happy path of every P1 flow can be walked end to end. This prompt goes FIRST so all screens land on one testable canvas rather than scattered artifacts.
2. **Per-screen prompts** — one per inventory screen, P1s first. Each anchors to the established design system, states the screen's job, real content, primary action, entry/exit wiring, and its specific states. Keep each 80-150 words: dense, not padded.
3. **Wiring & states sweep prompts** — flow-connection check, then the batch states pass (empty/loading/error/offline) across all screens.
4. **Test-script prompt** — asks Claude Design for nothing new; it's a checklist the USER walks on the canvas (each P1 flow, tap-by-tap) to verify the prototype actually works.

Every prompt must pass the anti-slop bar: no hex/font names beyond the established system, real content everywhere, and the swap test per screen (a prompt that fits any app's "settings screen" is not done — it must mention THIS app's actual settings).

### Phase 6 — Deliver

One markdown deliverable (send the file; paste the canvas prompt in chat for immediate use): assumptions (if any), category-research note (5 lines max), the screen inventory table, the canvas setup prompt, per-screen prompts grouped by flow, sweep prompts, test script, and the asset list (with any Deeporax-generated references attached). Usage notes: run the canvas prompt first, then per-screen prompts in P1 order, reviewing each on the canvas before the next; run sweeps last; then walk the test script.

**Verify before delivering:** inventory includes every checklist category or states why not; no screen prompt fails the swap test; canvas prompt explicitly demands wired, walkable flows (a static grid of frames is a failure); nothing re-asks what the chat already established.
