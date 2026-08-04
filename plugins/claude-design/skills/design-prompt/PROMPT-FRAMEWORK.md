# Prompt Framework for Claude Design

How to compose prompts that make Claude Design produce distinctive, coherent design systems instead of generic AI output. Everything here is in service of one principle:

> **Specify the problem completely; direct the aesthetics; never dictate the pixels.**
> Claude Design reads codebases, design files, and images, builds a design system, and iterates conversationally. It rewards briefs that read like a sharp creative director's — full of intent, empty of hex codes.

---

## 1. Master prompt anatomy

Nine sections, in this order. Write flowing prose with occasional lists — a brief, not a form.

### 1.1 Product framing
One tight paragraph: what the product does, who uses it, in what context, on what platform. Include the emotional job ("helps freelancers feel in control of unpaid invoices"), not just the functional one. Platform matters early: "responsive web app, desktop-first" vs "iOS-first mobile app, one-handed use" changes everything downstream.

### 1.2 Scope
Name exactly what you want back: "a complete design system, then apply it to N key screens: [list them]." Always ask for the system FIRST and screens second — screens designed before the system exist outside it. 3-5 screens in the master prompt; more go in follow-ups.

### 1.3 Information architecture & layout direction
The highest-leverage section. Be concrete and opinionated:
- Navigation model (slim icon sidebar / top nav with sections / bottom tab bar + FAB / etc.) and why it fits the usage pattern
- Page anatomy for the main screen: what's above the fold, where primary actions live, what's persistent vs scrollable
- Content model: is this a table product, a card product, a feed product, a canvas product, a form product? Say which and for what data
- Density target tied to the user: "data-dense — these users live in this screen 6 hours a day" vs "spacious — used twice a week, must be instantly re-learnable"

### 1.4 Content reality
Give real example content: actual feature names, realistic user names, plausible numbers, real button labels, real empty-state copy. "Sarah's team has 14 open invoices totaling $23,400, 3 overdue" beats any amount of styling instruction — real content forces real hierarchy decisions. Explicitly forbid lorem ipsum and gray placeholder boxes.

### 1.5 Personality & aesthetic direction — the no-hex zone
Direct the feeling; delegate the execution:
- 3-5 personality adjectives that could NOT describe every product ("clinical, warm, unhurried" — not "clean, modern, user-friendly", which mean nothing)
- Temperature and weight in words: "warm neutrals over cold grays", "high-contrast and inky", "muted with one assertive accent used sparingly"
- Type direction as character, not names: "a confident geometric sans for UI with a touch of character in display sizes" / "editorial serif display over a quiet workhorse sans" — never Inter, Roboto, Playfair, or any font name
- An explicit delegation sentence, always: **"Choose the specific palette and typefaces yourself — commit to one distinctive direction that serves this personality, and use it consistently. Do not default to your house style."**

**Exception:** the user's real, existing brand (their logo, their mandated palette/typeface) is included verbatim as a constraint. You never invent one, and you never let a screenshot smuggle one in.

### 1.6 Inspiration notes (only when screenshots exist)
Reference the attached images by what to extract: "From the first screenshot, take the layout rhythm and the calm density; ignore its color scheme entirely. From the second, take how it isolates the primary metric." One take + one ignore per image keeps Claude Design from cloning.

### 1.7 Design-system deliverables
Ask for the system as roles and scales, so it's a real system rather than one pretty screen:
- Color tokens as roles: background layers, surface, borders, primary/secondary text, one primary accent, semantic (success/warning/danger/info) — each with the accessible pairings
- Type scale as roles: display, heading levels, body, secondary, caption, mono where relevant — with size/weight/line-height relationships
- A spacing scale and a radius + elevation language used everywhere
- Core components for THIS product (name them — e.g. data table with sorting, invoice status chip, date-range picker), each with default / hover / active / focus / disabled / loading / error / empty states
- Light and dark treatment if the product warrants it — say which is primary

### 1.8 The anti-slop block
Include a trimmed version of the rulebook in §2 as literal "avoid" lines in the prompt. Pick the 5-8 most relevant to this product; a full 20-line ban list dilutes itself.

### 1.9 Craft bar
Close with the standard: WCAG AA contrast, visible focus states, real hierarchy (a screen should read correctly squinting), designed empty/error/loading states — and **one memorable move**: "give this system one distinctive, ownable detail — in a component, a transition, or a compositional habit — that someone would recognize it by."

---

## 2. Anti-slop rulebook

The recognizable "AI design" defaults. In the generated master prompt, phrase as instructions to Claude Design ("Avoid: …"). Positive framing beats pure bans, so pair where possible ("instead of X, do Y").

**Color & surface**
- No purple-to-blue (or any) gradient washes as the default identity; gradients only if the personality justifies them, and then committed and specific
- Not every surface on a card; not every card with the same radius, same shadow, same padding — vary containment (some sections are just spacing and a rule)
- No "colored icon in a pastel rounded square" as the universal list-item ornament
- One accent doing real work beats five accents decorating

**Type & content**
- No single-font-everywhere sameness where display and body are indistinguishable
- No vague marketing copy in the UI ("Unlock your potential") — interfaces say things
- No emoji as icons; no icon-per-heading decoration

**Layout**
- No centered-hero → three-feature-cards → testimonial → CTA conveyor belt unless it's actually a marketing page, and even then earn it
- No uniform 3-column card grids as the answer to every content problem
- No identical section rhythm down the whole page — vary density and width so the page has chapters

**System**
- No decorative filler: every element earns its place; if a stat, chart, or badge carries no information, cut it
- Depth over breadth: fewer components, every state designed, beats many components at 80%

**The commit rule (most important)**
Slop is the average of everything. The cure is commitment: pick one direction and push it to the edges — a design that's confidently *something* beats one that's inoffensively everything. This is why the master prompt delegates palette/type choice but demands commitment.

---

## 3. Direction vocabulary

Reach for precise words instead of "clean and modern":

- **Personality:** clinical, warm, editorial, utilitarian, playful, austere, confident, quiet, technical, crafted, institutional, energetic, calm, serious, friendly-but-competent
- **Density:** airy, generous, comfortable, efficient, compact, dense, data-dense
- **Weight/contrast:** inky, high-contrast, soft, muted, tonal, punchy, restrained
- **Shape:** sharp, precise, softened, rounded, pill-heavy, geometric, organic
- **Motion (if relevant):** instant, snappy, smooth, deliberate, springy, minimal-motion

Pairs of tensions are especially effective: "warm but precise", "dense but calm", "playful but trustworthy".

---

## 4. Follow-up prompt library

Customize with the project's actual names; every follow-up anchors to the established system. Recommended order as listed.

**A. Direction exploration (run FIRST if the user is unsure of the aesthetic)**
> Before building everything out: show me 3 distinctly different aesthetic directions for this system as a single key screen each — same layout and content, different personality. Make them genuinely divergent (different temperature, type character, surface language), not three tints of one idea. One line on the intent of each. I'll pick one to commit to.

**B. Per-screen build (one per remaining screen)**
> Using the design system exactly as established, design the [screen name] screen. Its job: [what the user accomplishes here]. Key content: [real content]. Primary action: [action]. Reuse existing components where they fit; if this screen needs a new component, design it in the system's language and add it to the system with all states.

**C. Hierarchy & density pass**
> Review [screen] purely for hierarchy and rhythm. What should the user see 1st, 2nd, 3rd — does the current design agree? Tighten: demote anything competing with the primary action, vary section density so the page has rhythm, and cut any element that isn't earning its place. Show before/after and list what changed.

**D. States & edge cases pass**
> Take [screen/component] through its unhappy paths: empty (first-run and cleared-out — make empty states useful, not sad-illustration filler), loading, error, one item, overflowing content ([realistic extreme, e.g. 400 rows / a 90-character project name]), and no-permissions. Design each within the system.

**E. Accessibility pass**
> Audit the system and screens for WCAG AA: text and interactive-element contrast in both themes, focus visibility on every interactive element, touch targets ≥44px on mobile, color never the only signal (status chips need shape/label too), and a sane keyboard/reading order. Fix directly and list what changed.

**F. Responsive / adaptive pass**
> Adapt [screens] to [the other form factor]. Don't shrink — re-decide: what does this screen's job look like at this size? State what you demoted, moved, or dropped and why. Keep tokens and components identical; only composition changes.

**G. Polish pass (last)**
> Final polish pass across everything: alignment to the spacing scale, consistent radii and elevation, orphaned styles folded into tokens, type-scale violations corrected, and the one-memorable-move detail applied consistently. List every inconsistency you found and fixed.

**H. Handoff (when the user plans to build it)**
> Prepare this for engineering handoff: the design system as a token reference (color roles, type scale, spacing, radii, elevation), a component inventory with props/variants/states, and notes on interaction behavior that isn't visible in statics. Export a handoff bundle for Claude Code.

---

## 5. Worked example (abbreviated)

**User's rough prompt:** "design system for my invoicing app for freelancers"

**Master prompt (excerpt showing the moves):**

> Design a complete design system for **Ledgerly**, a web app where freelance designers and developers create invoices, track payment status, and chase overdue clients. Desktop-first responsive web. The emotional job: money is stressful — the product should feel like a calm, competent bookkeeper, never like enterprise accounting software.
>
> Build the design system first, then apply it to three screens: the dashboard, the invoice editor, and the client detail page.
>
> Navigation is a slim fixed sidebar (icon + label). The dashboard leads with one number — total outstanding — followed by an invoice table (client, amount, status, due date, quiet per-row actions). This is a table-and-forms product used a few times a week: comfortable density, instantly re-learnable. Use real content: Sarah has 14 open invoices totaling $23,400, 3 overdue, clients like "Meridian Studio" and "Bright & Co". No lorem ipsum anywhere.
>
> Personality: calm, precise, quietly confident — warm but never cute. Warm neutrals over cold grays; muted overall with one assertive accent doing real work on primary actions and overdue signals. Type: a workhorse sans with genuine character at display sizes; tabular figures for money. **Choose the specific palette and typefaces yourself — commit to one distinctive direction that serves this personality and use it consistently; don't default to your house style.**
>
> Deliver: color tokens as roles (background layers, surface, borders, text pair, accent, success/warning/danger) with accessible pairings; a type scale as roles; a spacing scale; radius + elevation language; core components — invoice table, status chip, money input, date picker, client card, empty states — each with default/hover/focus/disabled/loading/error/empty. Light mode primary.
>
> Avoid: gradient washes, everything-on-a-card sameness, pastel icon squares on list items, emoji as icons, uniform 3-column grids, decorative stats. Every element earns its place.
>
> Craft bar: WCAG AA contrast, visible focus states, designed empty/error/loading states. Give the system one memorable, ownable detail someone would recognize it by.

Note what it does: exhaustive on product/IA/content, directional on mood, silent on hex and font names, explicit delegation, trimmed anti-slop list, one-memorable-move close.

---

## 6. Quality gate (run before delivering)

1. **No invented specifics** — zero hex codes, zero font names, unless they came from the user's real brand
2. **Swap test** — swap the product name for a competitor's; if the prompt still fits perfectly, it lacks product-specific IA/content. Sharpen §1.3-1.4
3. **Adjective test** — could the personality adjectives describe any app? Replace with words that exclude something
4. **Real content present** — names, numbers, labels are plausible and specific; lorem ipsum banned in the prompt text
5. **Delegation sentence present** — Claude Design is explicitly told to choose and commit
6. **Anti-slop block trimmed** — 5-8 relevant lines, not the whole rulebook
7. **System-first ordering** — design system requested before screens; follow-ups anchor to "the established system"
8. **Screenshot hygiene** — each referenced image has a take AND an ignore; no colors/fonts extracted from them
9. **Length** — master prompt 350-600 words
