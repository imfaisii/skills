---
name: eeat-blog
description: Pick a target keyword from real data, then research and write a comprehensive EEAT-optimized SEO blog post inside any repo's existing blog system, with generated in-article images. When content-gap or the user passes a query cluster, that cluster stays locked and the draft targets those queries. Otherwise mines Search Console for the cluster with the highest click opportunity. Use when the user wants to write or create an SEO blog post, article, or long-form guide for a repo, target a keyword, maximize search reach, run a recurring blog cadence, or produce EEAT content with images. Common triggers include write a blog, SEO article, rank for a keyword, EEAT blog, blog post for my repo, or scheduled blog job.
---

# EEAT Blog Writer

Produce a definitive, search-optimized blog post that lives natively in the user's repo and reads like a human wrote it.

Two things separate this from generic blog generation:

1. **The topic comes from data, not imagination.** Search Console impressions, competitor gaps, and a ranking-probability model decide what to write. See [TOPIC-SELECTION.md](TOPIC-SELECTION.md).
2. **The skill adapts to the repo instead of imposing a structure.** Everything project-specific lives in a config file the skill writes on first run and reads on every run after, so it works the same in a Next.js repo, an Astro repo, or a CMS, and can run unattended on a schedule.

## Inputs

- **Repo / working directory**: the user picks it. Confirm the path before exploring.
- **Primary keyword**: optional. A locked cluster (keyword plus query rows with clicks, impressions, CTR, and position, usually from `content-gap`) is the topic. Sanity-check it. Do not replace it. If no cluster is given, Phase 1 chooses the query with the highest click opportunity.

Never invent the repo's brand, author, or stack. Detect everything in Phase 0.

## Project config: how this stays adaptive

The skill keeps one file per repo at **`.claude/eeat-blog.json`**. Phase 0 creates it on first run. Every later run reads it and skips re-detection, which is what makes an unattended scheduled run possible.

```jsonc
{
  "site": {
    "name": "",           // brand name, from the repo
    "baseUrl": "",
    "author": "",         // real author or a labeled editorial byline
    "gscProperty": "",    // e.g. "sc-domain:example.com", or "" if not connected
    "ga4Property": ""     // e.g. "properties/123456789", or ""
  },
  "blog": {
    "postsDir": "",       // where post bodies live
    "postFormat": "",     // mdx | ts-module | md-frontmatter | cms
    "indexFile": "",      // the file that must be edited to register a post
    "registerHow": "",    // one sentence: exactly how a new post gets listed
    "slugPattern": "",    // e.g. "/blog/[slug]"
    "imageDir": "",       // where generated images are saved
    "imageComponent": ""  // next/image | astro:assets | raw img
  },
  "seo": {
    "competitors": [],    // 3-5 real competitor domains
    "metadataMechanism": "",  // the existing helper to reuse
    "jsonLdMechanism": "",    // the existing component to reuse
    "houseStyleNotes": ""     // anything the repo does differently
  },
  "imageTool": "",        // the resolved MCP tool id, see Phase 3
  "cadence": { "everyDays": 0, "delivery": "pr" },  // pr | commit | branch
  "published": [],        // { slug, keyword, pattern, date } for every post this skill wrote
  "backlog": []           // scored candidates not yet written, so the next run starts warm
}
```

`published` and `backlog` matter most on a recurring schedule. Without them a scheduled run repeats itself. Always append to `published` in Phase 6.

If the config exists and the repo has not changed shape, trust it. Re-detect only the fields that are empty or that fail a quick existence check.

## Workflow

Run the phases in order. Each has a verify step you must satisfy before moving on.

### Phase 0: Understand the repo, write the config

If `.claude/eeat-blog.json` exists and its paths still resolve, read it and skip to Phase 1.

Otherwise explore before writing a line. Use the Explore agent, Grep and Read to determine:

- **Framework and router**: Next.js app router, pages router, Astro, Remix, MDX content collections, a CMS.
- **Where posts live and the exact format.** Open 1-2 existing posts and copy their structure exactly.
- **How the index lists posts**: frontmatter, a manifest array, `generateStaticParams`, a CMS query. You must register the new post the same way.
- **Existing SEO and metadata pattern**: `generateMetadata`, `next-seo`, JSON-LD components. Reuse them, never bolt on a parallel system.
- **Styling system**: Tailwind, a typography plugin, MDX components. Match it.
- **Image handling**: asset directory and how images are referenced.
- **Site identity**: brand, base URL, author, logo. These feed the author bio and schema.
- **Competitors**: infer 3-5 from the repo's own copy (comparison pages, "alternative to" content, the pricing page). Confirm with the user on first run.

Write `.claude/eeat-blog.json`.

**Verify:** you can state the exact path and format the new post must use, how to register it, and which metadata mechanism to reuse. If the repo uses MDX, do not force `page.tsx`.

### Phase 1: Choose the topic

**Locked cluster.** If `content-gap` or the user passed a primary keyword plus the query rows (clicks, impressions, CTR, position), that cluster is the topic.

- Run Tier 0 from [TOPIC-SELECTION.md](TOPIC-SELECTION.md) only. If an existing post already targets it, stop and say to update that URL.
- If the supplied impressions total under 10, stop.
- Do not pick a different topic, including when Tier 4 would score something else higher.
- Write the `TOPIC DECISION` block with those figures. Source tier: `locked`. Put the supplied click opportunity on the Score line.

**No cluster passed.** Follow [TOPIC-SELECTION.md](TOPIC-SELECTION.md). When Search Console rows exist, the winner is the new-page cluster with the highest click opportunity. Reject a topic that cannot bring more clicks. A new site with no Search Console data drops to Tier 3. Say so.

**Verify:** the `TOPIC DECISION` block is written out, with figures from the rows and named rejected candidates. Never proceed on a topic you cannot justify from a data source.

### Phase 2: Keyword map

Expand the chosen topic into the full semantic field. Use the GSC query list, `mcp__grok-remote__web_search` for live SERPs and People Also Ask, `mcp__grok-remote__x_search` for the words real users actually type, and any installed SEO skills (`seo-cluster`, `seo-content-brief`, `seo-geo`).

Produce a keyword map:

- Primary keyword and the chosen URL slug
- 10-15 LSI / secondary keywords
- 5-7 entity associations
- 8-10 real question variations, for the FAQ and People Also Ask
- The featured-snippet target phrase, 40-60 words

When the cluster is locked, every secondary keyword and question must appear in the supplied query rows. Do not add keywords. Do not estimate search volume. When no Search Console rows exist, any volume you estimate must be labelled an estimate.

**Verify:** the keyword map exists and the primary keyword is not already covered by an existing post.

### Phase 3: Generate images

Resolve the image tool once and store it in `config.imageTool`. Check in this order and use the first that is connected:

1. `mcp__grok-remote__generate_image` (Grok Imagine)
2. Any other connected MCP image tool whose name matches `generate_image` or `generate_graphic`
3. The Deeporax connector's Grok Imagine tool

Never call an external image HTTP endpoint or a hardcoded API URL. If none of the above is connected, write the post without images, leave the image slots marked as TODO, and tell the user which connector to enable. Do not block the whole post on images.

Prompts, placement and markup are in [EEAT-FRAMEWORK.md](EEAT-FRAMEWORK.md) under "Images". Save outputs into `config.blog.imageDir` and reference them by local path using `config.blog.imageComponent`.

**Verify:** 2-3 images saved and referenced by local path with keyword-rich alt text, or an explicit note saying why there are none.

### Phase 4: Write

Follow [EEAT-FRAMEWORK.md](EEAT-FRAMEWORK.md) in full: EEAT signals, the deep-dive section template, statistical data, buyer-intent bridge, three-tier FAQ, citations, format variety. 3,500 to 6,000 words of substantive content. Weave the keyword map in naturally, no stuffing.

Match the pattern chosen in Phase 1. A `pricing` post and a `how to` post are not the same shape: the pricing post leads with a table and the real numbers, the how-to leads with the steps.

Write like a human. No em dashes, no "it's not just X, it's Y", no decorative structure. Vary paragraph length.

### Phase 5: Technical SEO and integration

- Create the post at `config.blog.postsDir` and register it exactly as `config.blog.registerHow` describes.
- Add metadata through the repo's existing mechanism.
- Add JSON-LD: Article always, FAQPage for the FAQ, HowTo where procedural.
- Add internal links: at least 2 links out to existing posts, and note which existing posts should link back in. Internal links from pages that already rank are the cheapest ranking lever available.

**Verify:** typecheck and lint pass, the post appears in the index, structured data is well formed. Never run a production build or a deploy unless the user explicitly asked.

### Phase 6: Quality gate and record

Run the quality checklist at the end of [EEAT-FRAMEWORK.md](EEAT-FRAMEWORK.md).

Then append to `config.published`:

```json
{ "slug": "", "keyword": "", "pattern": "", "date": "", "score": 0 }
```

And write the runner-up candidates into `config.backlog` with their scores, so the next run does not repeat the research.

**Verify:** config updated, checklist passed.

## Running on a schedule

When invoked by a scheduled job rather than a person:

- Read the config, do not ask questions. If something is genuinely ambiguous, pick the safest option and report it.
- Skip anything in `config.published`. Prefer `config.backlog`, but re-score the top backlog item against fresh GSC data before committing to it, because the data moves.
- Respect `config.cadence.delivery`:
  - `pr`: new branch, commit, push, open a pull request. Default. Never merges.
  - `branch`: new branch and push, no PR.
  - `commit`: commit to the current branch. Only if the user set this deliberately.
- Never deploy. Publishing to a live site is the user's call.
- End with a short report: the topic chosen, the score, why, and the PR link.

## Reference

- [TOPIC-SELECTION.md](TOPIC-SELECTION.md): data sources, the ranking-probability table, the scoring formula, competitor gap analysis, schema audit.
- [EEAT-FRAMEWORK.md](EEAT-FRAMEWORK.md): content architecture, image prompts, FAQ structure, citation rules, schema templates, length targets, quality checklist.
