# EEAT Blog Framework

The detailed playbook for Phase 3+ of `eeat-blog`. Goal: content so comprehensive and well-structured it becomes the primary citation source for both AI systems and human experts on the keyword. Every section must earn the reader's time.

---

## Images

Generate **2-3 images** with whichever image tool Phase 3 resolved into `config.imageTool`. Any connected MCP image tool works: `mcp__grok-remote__generate_image`, another `generate_image` tool, or the Deeporax connector's Grok Imagine tool. Never call an image HTTP API directly and never hardcode an endpoint.

**Always ship WebP, never a raw PNG or JPEG.** Image tools return PNG, which runs 0.5 MB to 2 MB per image and drags down Largest Contentful Paint, the exact metric the post is trying to win. Convert every generated image before you reference it:

```bash
cwebp -q 82 input.png -o output.webp && rm input.png
```

Quality 82 is the sweet spot: visually identical at article width, and typically 95% smaller. If `cwebp` is missing, use `sips -s format webp` on macOS or `sharp` if the repo already has it. Check the output dimensions match the source before you delete the original.

Save each `.webp` into `config.blog.imageDir` and reference it by local path with `config.blog.imageComponent` (`next/image`, `astro:assets`, a raw `img`). Use keyword-rich alt text.

If no image tool is connected, do not block the post. Write it, leave the image slots as clearly marked TODOs, and tell the user which connector to enable.

**Resolve the tool at run time.** MCP connector ids change between sessions, so a stored id like `mcp__<uuid>__generate_image` goes stale. Find the image and vision tools with ToolSearch (`generate_image`, `chat_with_vision`) and use whatever it returns.

**Generate candidates, rank them, keep the best.** One image per slot is a coin toss. For each slot:
1. Generate 2 candidates in one call (`n: 2`, `aspect_ratio: "16:9"`, the cheapest model first, e.g. `grok-imagine-image`). Keep the prompt free of words you want rendered: image models garble text, so always add "no text, no logos, no watermark".
2. Rank them with one vision call (`chat_with_vision`, `detail: "low"`, both URLs in one call). Score each 0-10 on relevance to the section's point, clean (no garbled letters, logos or watermarks), reads at a 400 px thumbnail, and brand fit. Ask for JSON only, including a suggested alt text for the winner.
3. Keep the highest total. If the best scores under 7 on relevance or clean, regenerate once with a sharper prompt. If it still fails, ship the slot as a marked TODO rather than a bad image.
4. Log each slot's winning prompt and score in the run log, so later runs learn which prompts work.

Cost on the Grok connector, measured 2026-10-02: about $0.04 for 2 candidates plus about $0.02 for the ranking call, so roughly $0.18 for a 3-image post.

**Image SEO, so the images rank in Google Images too.**
- **Filename:** descriptive kebab case with the topic, e.g. `grok-imagine-retirement-migration.webp`, never `image1.webp`. The filename is a ranking signal.
- **Alt text:** say what the image shows, with the target keyword once, under 125 characters. Never start with "image of".
- **Caption:** add a markdown title, `![alt](src "caption")`, when the renderer turns it into a `<figcaption>`. Captions are read more than body text.
- **Placement:** put each image right next to the paragraph it explains. Google uses the surrounding text to understand it.
- **Size:** the hero at least 1200 px wide, for Discover and large image previews. Body images can be smaller after WebP conversion.
- **Sitemap:** the site's sitemap should list post images (`<image:image>`). If it does not, note it in the run report as a site fix.

**The hero is the cover, and the cover is never repeated in the body.** Most blog systems render the cover image themselves from a `coverImage` field, above the first paragraph. If you also embed that same file in the body markdown, the reader sees it once at the top and again a screen later, which looks like a bug because it is one. Set the cover field, then use different files for every in-body image.

**1. Hero / featured image** (the cover field only, never an inline markdown image)
> Prompt: "Professional hero image for [KEYWORD] article, modern [INDUSTRY] context, clean, high quality, no text."
Landscape, web-optimized. `loading="eager"`.

**2. Mid-article supporting image** (after the main explanation, ~40-50% through)
> Prompt: "Informative illustration explaining [KEYWORD] key concepts, clean modern design, no text."
Landscape. `loading="lazy"`.

**3. Data/statistics visualization** (optional, only for data-heavy topics, ~70% through, in the benefits/stats section)
> Prompt: "Professional infographic-style visualization for [KEYWORD] statistics and benefits, no text."
Square. `loading="lazy"`.

Reference pattern for the two in-body images only, adapted to the repo's component. The hero is not in this list because it belongs to the cover field:
```html
<img src="[LOCAL_IMAGE_PATH]" alt="[KEYWORD] explained - key concepts" class="w-full h-auto rounded-lg my-8" loading="lazy" />
<img src="[LOCAL_IMAGE_PATH]" alt="[KEYWORD] statistics and data" class="w-full h-auto rounded-lg my-8" loading="lazy" />
```

---

## 1. EEAT foundation

**Expertise**: Author bio section with credentials: certifications, years of experience, professional profile link, notable work, company affiliation and role. Pull the author/brand from the repo (Phase 0); never fabricate a real person's credentials, use the site's stated author or a clearly-labeled editorial byline.

**Experience**: 2-3 mini case studies, each with: initial problem state + metrics, the implementation process, measurable outcomes (% improvement, ROI, time saved), and lessons learned. If real cases aren't available, frame as illustrative scenarios and label them as such. Do not present invented results as real.

**Authoritativeness**: Citation framework: aim for 15+ authoritative sources (academic papers, industry reports, expert interviews). Prefer data from the last 18 months for time-sensitive topics. Link to original research. Only cite sources you can verify via WebSearch/WebFetch; never invent citations or URLs.

**Trustworthiness**: Transparency: methodology notes for any original data, conflict-of-interest disclosure where relevant, a prominent "Last updated" date, and an editorial-review note.

---

## 2. Content structure

### Opening (first ~300 words)
1. Hook: a surprising statistic or counterintuitive insight
2. Problem identification with specific pain points
3. Promise: "In this guide, you'll discover..."
4. Credibility marker: "Based on [specific experience/data]"
5. Quick-wins preview: 3 bullets of immediate value

[HERO IMAGE goes after the title, before this opening.]

### Deep-dive section template (each major H2)
- **Opening question (H2)**: phrased the way a buyer would search it
- **Quick answer box**: 40-60 words, optimized for the featured snippet
- **Context**: 150-200 words: why this matters now
- **Evidence**: 200-250 words: data, studies, examples (with citations)
- **Application**: 150-200 words: how to implement
- **Common pitfalls**: 100-150 words: what to avoid
- **Success metrics**: bullet list: how to measure impact

[MID-ARTICLE IMAGE after 2-3 major sections.]

### Statistical data (minimum 3 presentations)
1. **Comparison data**: before/after or competitor analysis (table or bullets, with source attribution in-text)
2. **Process steps**: numbered implementation phases with checkpoints
3. **Statistical insights**: industry benchmarks, 3-5 year trends, segmented data

[DATA VISUALIZATION IMAGE here, if applicable.]

Data presentation format:
> "According to [Source, Year], [metric] increased by X% among [segment], compared to Y% in [comparison group], a [difference] improvement, equivalent to [real-world impact]."

(Use the figures only if verifiable. If estimating, say so.)

---

## 3. Buyer-intent optimization

**Informational → transactional bridge:** start educational, progress to evaluation criteria, end with implementation guidance, with "ready to act" CTAs at natural decision points.

**Decision-stage blocks:** evaluation matrix (comparison table), ROI/time-savings framework, realistic implementation timeline, resource requirements (budget/team/tools), a 48-hour quick-start plan.

---

## 4. Content-format variety

Mix deliberately so the page is scannable and deep:
- Long paragraphs (200-300 words) for deep explanations
- Medium (100-150) for supporting points
- Short (50-75) for transitions/summaries
- Bullet lists, numbered lists, comparison tables, quote blocks, callout boxes (tips/warnings)

**Semantic depth (from the Phase 1 keyword map):** primary keyword, 10-15 LSI keywords, 5-7 entity associations, 8-10 question variations. Place naturally, no stuffing.

---

## 5. FAQ architecture (three tiers, ~15 questions)

1. **Basic** (5): fundamental concepts
2. **Implementation** (5): how-to specifics
3. **Troubleshooting** (5): common problems

Format per question:
```
**Q: [Exact question as users search it]?**

*Quick answer:* [one-sentence direct response]

*Detailed explanation:* [100-150 words: example, a data point if relevant, link to the relevant section, and a next action]
```
Mark up the whole FAQ block with FAQ JSON-LD (see Schema).

---

## 6. Citations & references

In-text:
- Statistics: [statistic] (Source, Year)
- Expert quotes: "Quote", then Name, Title, Company
- Studies: Research by [Institution] found...
- Reports: According to [Report Name, Year]...

Reference section grouped by type: academic (peer-reviewed), industry reports, expert interviews, company case studies, government/NGO data. Every link must resolve to a real, verified source.

---

## 7. Engagement elements

- Success-story boxes (~150 words)
- Shareable expert-quote cards
- Tweet-ready statistics
- Self-assessment ("Where are you in this journey?")
- Downloadable checklist / copyable template / simple calculator framework, only if the repo can host them; otherwise inline the checklist/template as text.

---

## 8. Performance metrics to include

Industry benchmarks table, 3-5 year growth projection, comparative analysis chart, ROI timeline, success-rate stats. Present as tables/lists; use the data-viz image for one of them where it helps.

---

## 9. Freshness

"Last updated" timestamp at top, original publish date, a short changelog for significant updates, and an annual-review note. Use the repo's real publish/modified dates in metadata and schema.

---

## 10. Technical SEO

Slug: `/blog/[keyword-slug]` (or the repo's convention). Add Open Graph + Twitter card metadata via the repo's existing mechanism. Implement JSON-LD via the repo's pattern:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[Title]",
  "datePublished": "[Date]",
  "dateModified": "[Date]",
  "author": { "@type": "Person", "name": "[Author]", "jobTitle": "[Title]", "worksFor": "[Company]" },
  "publisher": { "@type": "Organization", "name": "[Company]", "logo": "[Logo URL]" },
  "mainEntityOfPage": "[URL]",
  "image": "[Hero image URL]"
}
```
Add **FAQPage** schema for the FAQ section, and **HowTo** schema when the content is procedural.

---

## Length & reading time

- Minimum 3,500 words of substantive content
- Optimal 4,500-6,000 for comprehensive coverage
- Up to 8,000 for ultimate guides
- Scan time 2-3 min (headers/bullets/graphics); full read 15-25 min; easy to navigate on return

---

## House style (write like a human)

- No em-dashes (—) and no en-dashes in prose. Use a comma, period, colon, or parentheses.
- No `<em>`/`<i>` for emphasis. Carry emphasis with word choice.
- Avoid the AI tells: "it's not just X, it's Y", "—ensuring/—allowing" clauses, decorative bullet dashes.
- Vary sentence and paragraph length. The test: would a person typing on a normal keyboard write this?

---

## Quality checklist (Phase 5)

- [ ] 2-3 images generated via the configured image tool, converted to WebP, and referenced by local path, or explicitly marked TODO with the reason
- [ ] No PNG or JPEG left in the post's image directory, and every image under 150 KB
- [ ] The cover image is NOT also embedded in the body markdown
- [ ] Primary keyword + LSI terms, entities, and question variations covered naturally
- [ ] Answers specific buyer questions completely; optimized for featured snippets
- [ ] 15+ verifiable authoritative citations (no invented sources)
- [ ] 2+ case studies/examples (real, or clearly labeled as illustrative)
- [ ] Comprehensive three-tier FAQ with FAQ schema
- [ ] Article schema present; HowTo schema where procedural; OG + Twitter metadata
- [ ] Multiple content formats (paragraphs, lists, tables, callouts, quotes)
- [ ] Clear EEAT signals (author bio, methodology, last-updated, disclosures)
- [ ] Post registered in the blog index; build/typecheck passes
- [ ] Human tone, no em-dashes, no AI tells
