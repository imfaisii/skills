---
name: eeat-blog
description: Research keywords and write a comprehensive, EEAT-optimized SEO blog post inside an existing repo's blog system, then generate in-article images with the Deeporax AI connector's Grok Imagine tool. Use when the user wants to write or create an SEO blog post, article, or long-form guide for a repo, target a keyword, maximize search reach, or produce EEAT content with images. Common triggers include write a blog, SEO article, rank for a keyword, EEAT blog, or blog post for my repo.
---

# EEAT Blog Writer

Produce a definitive, search-optimized blog post that lives natively in the user's repo and reads like a human wrote it. The whole point is keyword reach: pick the right target, cover the full semantic field, and structure for featured snippets and AI citation.

## Inputs

- **Repo / working directory** — the user picks it. Confirm the path before exploring.
- **Primary keyword** — if the user gave one, use it. If not, run Phase 1 keyword discovery first and propose 2-3 candidates with rationale, then confirm before writing.

Never invent the repo's brand, author, or stack. Detect everything in Phase 0.

## Workflow

Run the phases in order. Each has a verify step you must satisfy before moving on.

### Phase 0 — Understand the repo's blog system

Explore before writing a single line. Use the Explore agent / Grep / Read to determine:

- **Framework & router** — Next.js app router (`page.tsx`), pages router, Astro, Remix, MDX content collections, a CMS, etc.
- **Where posts live and the exact format** — e.g. `app/blog/[slug]/page.tsx`, `content/blog/*.mdx`, a posts array. Open 1-2 existing posts and copy their structure exactly.
- **How the index lists posts** — frontmatter, a manifest/array, `generateStaticParams`, a CMS query. You must register the new post the same way.
- **Existing SEO/metadata pattern** — `generateMetadata`, `next-seo`, `<Head>`, Open Graph / Twitter card helpers, JSON-LD components. Reuse them; don't bolt on a parallel system.
- **Styling system** — Tailwind classes, `prose`/typography plugin, a component library, MDX components. Match it.
- **Image handling** — where static assets live (`public/`, `src/assets/`), and how they're referenced (`next/image`, imports, raw `<img>`).
- **Site identity** — brand name, base URL, author(s), logo path. These feed the author bio and schema.

**Verify:** you can state the exact path + format the new post must use, how to register it in the index, and which metadata/JSON-LD mechanism to reuse. If the repo uses MDX, do NOT force `page.tsx` — mirror what exists.

### Phase 1 — Keyword research (target keywords, maximize search reach)

Goal: a primary keyword with real demand plus the full semantic field around it. Search widely — this is where ranking is won or lost.

- **Use installed SEO skills/tools when available** (check the skills list): `seo-cluster`, `seo-content-brief`, `seo-dataforseo` (live search volume/difficulty), `seo-content`, `seo-geo`, plus `WebSearch` for live SERPs and "People also ask".
- **Mine the repo** — read existing posts to avoid cannibalization and find gaps; pull internal anchor text and the sitemap for topic context.
- **No live SEO data tool? Reason from Claude knowledge + WebSearch** to estimate intent, competition, and harvest related terms. State clearly that volumes are estimates.

Produce a **keyword map** (save it or print it) covering:

- Primary keyword + chosen URL slug
- 10-15 LSI / secondary keywords
- 5-7 entity associations (brands, tools, concepts)
- 8-10 real question variations (for FAQ + PAA targeting)
- Search intent path (informational → transactional) and the featured-snippet target phrase

**Verify:** keyword map exists and the primary keyword is NOT already covered by an existing post in the repo.

### Phase 2 — Generate images with Deeporax (Grok Imagine)

Generate 2-3 images using the **Deeporax AI connector's Grok Imagine image tool**. Do NOT call any external image-generation HTTP endpoint or hardcoded API URL — only the connector tool.

Image set, prompts, placement, and markup are in [EEAT-FRAMEWORK.md](EEAT-FRAMEWORK.md) ("Images"). Save generated images into the repo's asset dir (detected in Phase 0) and reference them by local path using the repo's image component.

**If the Deeporax connector is not connected/available, stop and ask the user to connect it.** Do not fall back to a hardcoded API.

**Verify:** 2-3 images saved to the repo and referenced by local path, with descriptive keyword-rich alt text.

### Phase 3 — Write the blog (EEAT framework)

Follow [EEAT-FRAMEWORK.md](EEAT-FRAMEWORK.md) in full: EEAT signals, deep-dive section template, statistical data, buyer-intent bridge, three-tier FAQ, citations, content-format variety. 3,500-6,000 words of substantive content. Weave the keyword map in naturally — no stuffing. Place images at the specified points.

Write like a human (house style): no em-dashes, no `<em>` for emphasis, no "it's not just X, it's Y". Vary paragraph length. See the style note in the framework.

### Phase 4 — Technical SEO + integration

- Create the slug and post at the repo's blog path; register it in the index.
- Add metadata (title, description, Open Graph, Twitter card) via the repo's existing mechanism.
- Add JSON-LD: Article always; FAQ schema for the FAQ section; HowTo where the content is procedural. Template in the framework.

**Verify:** typecheck/build passes, the post appears in the blog index/listing, and structured data is well-formed.

### Phase 5 — Quality gate

Run the **Quality checklist** at the end of [EEAT-FRAMEWORK.md](EEAT-FRAMEWORK.md). Confirm keyword coverage, citations, images, FAQ, schema, and human tone before reporting done.

## Reference

[EEAT-FRAMEWORK.md](EEAT-FRAMEWORK.md) — full content architecture, image prompts, FAQ structure, citation rules, schema templates, length targets, and the quality checklist.
