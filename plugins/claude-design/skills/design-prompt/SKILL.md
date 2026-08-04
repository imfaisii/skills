---
name: design-prompt
description: Turn a rough product idea (and optional inspiration screenshots) into a crafted prompt package for Claude Design (Anthropic Labs' visual creation tool) that produces a complete design system and screens for a web or mobile app. Use when the user wants a Claude Design prompt, a design-system prompt, wants to "design my app with Claude Design", says "create a design prompt for X", or shares screenshots as design inspiration for a prompt. Output is a master kickoff prompt plus follow-up iteration prompts — not the design itself.
---

# Claude Design Prompter

The user gives a rough idea ("a fitness tracking app", "dashboard for my SaaS") and optionally some inspiration screenshots. You return a **prompt package** they paste into Claude Design: one master kickoff prompt that makes Claude Design build a full design system and key screens, plus a small library of follow-up prompts for iterating. You do NOT produce the design yourself.

The core skill is a **specificity trade**: be ruthlessly specific about product, audience, information architecture, layout, content, and behavior — and deliberately *directional* (never prescriptive) about color and typography. Claude Design does its best work when it owns the aesthetic execution inside a strongly-defined brief. Naming hex codes and fonts in the prompt is how you get AI slop; naming personality, density, and constraints is how you avoid it.

## Inputs

- **The user's rough prompt** — required. Extract: what the product is, who it's for, web app / mobile app / both, and any must-have screens or flows.
- **Inspiration screenshots** — optional. If attached, analyze them (Phase 1) and fold the findings into the brief as *translated direction*, never "copy this".
- **Existing brand?** — if the user has real brand assets (logo, mandated palette, mandated typeface), those are the ONE exception to the no-colors/no-fonts rule: include them verbatim as constraints. Never invent a brand for them.

If platform (web vs mobile) or audience is genuinely unknowable from the prompt, ask one short question. Otherwise make the obvious assumption, state it at the top of your output, and proceed.

## Workflow

### Phase 0 — Read the framework

Read [PROMPT-FRAMEWORK.md](PROMPT-FRAMEWORK.md) before composing anything. It contains the master-prompt anatomy, the anti-slop rulebook, the direction vocabulary, and the follow-up prompt library. The rules there are binding.

### Phase 1 — Decode inspiration screenshots (only if provided)

For each screenshot, extract **structure and mood, not surface**:

- Layout topology: nav pattern (sidebar / top bar / tab bar / floating), grid vs freeform, card vs table vs canvas, content width, where primary actions live
- Density and rhythm: airy vs compact, how much whitespace, section separation style (rules, cards, spacing alone)
- Hierarchy moves: what makes the important thing look important (scale, weight, color pop, isolation)
- Shape and surface language: sharp vs soft corners, flat vs elevated, bordered vs borderless
- Personality read: 3-4 adjectives the screenshot earns (e.g. "calm, editorial, confident")
- One thing to explicitly NOT carry over (every reference has something that doesn't fit the user's product)

Write these observations into the brief as prose direction ("navigation like a fixed slim sidebar with icon+label, content in a single 720px column…"). Tell the user to also attach the screenshots in Claude Design itself, and include a line in the master prompt telling Claude Design what to take from them and what to ignore. Do not extract hex codes or identify fonts from screenshots — mood words only.

### Phase 2 — Optional: reference graphics via Deeporax

If the brief would benefit from a visual anchor the user doesn't have — e.g. an illustration-style reference, a hero-image mood reference, a placeholder logo mark — offer to generate 1-2 with the **Deeporax connector's graphic generation tool** for the user to upload into Claude Design alongside the prompt. Only via the connector; never an external image API. If Deeporax isn't connected, skip silently — this step is optional, never blocking. Keep generated references abstract/mood-level (style, composition, subject) so they inspire rather than dictate.

### Phase 3 — Compose the master prompt

Build it section-by-section per the anatomy in PROMPT-FRAMEWORK.md:

1. Product framing (goal + audience + platform)
2. Scope: the design system + named key screens
3. Information architecture & layout direction
4. Content reality (real example content, never lorem ipsum)
5. Personality & aesthetic direction (adjectives, density, temperature — the no-hex/no-font zone)
6. Inspiration notes (if screenshots exist)
7. Design-system deliverables checklist (tokens as roles, type scale as roles, spacing scale, core components with all states)
8. The anti-slop block (verbatim from the framework, trimmed to what's relevant)
9. Craft bar (accessibility, states, one memorable move)

Target 350-600 words for the master prompt. Under 300 is under-specified; over 800 buries the signal.

### Phase 4 — Compose the follow-up prompts

From the library in PROMPT-FRAMEWORK.md, select and customize the follow-ups that fit this project (usually 4-6): direction exploration, per-screen builds for each named screen, a hierarchy/density pass, a states-and-edge-cases pass, an accessibility pass, and a responsive/adaptive pass. Each follow-up must reference the established system ("using the design system you've built…") so Claude Design stays consistent across iterations.

### Phase 5 — Deliver

Output as a single markdown deliverable (send the file AND paste the master prompt in chat for easy copying):

- **Assumptions** (2-3 bullets max, only if you made any)
- **Master prompt** — in one copyable code block
- **Follow-up prompts** — each named, one code block apiece, in recommended order
- **Usage notes** — 3-4 lines: paste master prompt first, attach screenshots/references if any, then run follow-ups one at a time after reviewing each result

**Verify before delivering** — run the quality gate at the end of PROMPT-FRAMEWORK.md. Hard failures: any hex code or named font that didn't come from the user's real brand; lorem-ipsum-style placeholder content; a prompt that would produce a generic template for ANY product in this category (the "swap test": if you could swap the product name and the prompt still works, it's too generic).
