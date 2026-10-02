# Topic Selection

How the skill decides what to write about, before it writes anything. Picking the wrong target wastes the whole post, so this phase runs first and its output is a written decision with a reason.

The rule: **never pick a topic from imagination.** Every topic comes from one of the five sources below, in priority order. Use the highest tier that has data. When Search Console rows exist, click opportunity outranks a merely interesting cluster.

## Locked topic

When `content-gap` or the user hands you a cluster, skip every tier except Tier 0. The cluster is the topic. Check cannibalization and the 10-impression floor. Do not replace it.

## Click opportunity

Compute this only from the rows in hand. Do not invent a CTR benchmark.

1. Drop branded queries and rows with fewer than 10 impressions.
2. Cluster related queries.
3. Position bands: 1–3, 4–7, 8–10, 11–20, 21+. For a band with at least 5 rows, the benchmark CTR is the median CTR of those rows. If a band has fewer than 5 rows, do not invent a median. Rank those clusters by impressions among positions 8–20 only, and say the band was too thin.
4. `click_opportunity = impressions × max(0, band_median_ctr − actual_ctr)`, summed across the cluster.
5. The topic to write is the new-page cluster with the highest click opportunity. A query that already takes the clicks available at its position is a weak topic even when impressions are high.

---

## Tier 0: Cannibalization guard (always run first)

List every existing post in the repo and its target keyword. A new post that overlaps an existing one splits the signal and both lose. If the best candidate overlaps, either improve the existing post instead, or narrow the new one until it is genuinely distinct.

State explicitly which existing posts you checked.

---

## Tier 1: Search Console striking distance (best signal, needs data)

Only usable when the property has real impressions. Threshold: **at least 50 queries with impressions in the last 90 days**. Below that, skip to Tier 3 and say why.

Pull from the connected Search Console MCP (`get_advanced_search_analytics`) with `dimensions: "query"`, `sort_by: "impressions"`, the last 90 days, `data_state: "all"`. Paginate (`row_limit` up to 25000, `start_row`) and stop once impressions fall below 10. Also pull `dimensions: "query,page"` so a page match is confirmed when the API links them.

Rank the rows into three buckets, then order candidates inside the striking-distance and orphan buckets by click opportunity:

| Bucket | Condition | What it means | Action |
|---|---|---|---|
| **Striking distance** | position 8-20, impressions >= 10 | Google already trusts you for this. A dedicated page could reach the top 5. | Highest priority when click opportunity is high. |
| **Impression orphan** | position > 20, impressions >= 10 | Real demand, no page aimed at it. | New post, after striking distance. |
| **CTR leak** | position 1-7, CTR below the band median | You rank but the title or description does not earn the click. | Not a new post. Rewrite the title or snippet. |

A CTR leak is a trap. Writing a new post for a query you already rank near the top makes things worse. Report it as a metadata fix and move to the next candidate.

Do not use Analytics metrics to choose or reject a topic. Analytics only confirms that the property matches the repo.

---

## Tier 2: Query expansion around a proven page

Take the repo's best-performing page from Tier 1 and pull its query list with `dimensions: "query,page"` filtered to that page. The long tail attached to a page that already works is the cheapest cluster to extend, because internal links from a trusted page pass real weight.

---

## Tier 3: Competitor content gap

Use this when the site is too new for GSC data. It is the fastest way to find topics that are proven to have demand, because a competitor already invested in them.

Identify 3 to 5 real competitors from the project config. For each, use `mcp__grok-remote__web_search` (agentic browsing, multi-turn) or `WebFetch`:

1. **Extract their content inventory.** "Open [competitor] and list every blog post, guide and comparison page with its title and target keyword. Return a table."
2. **Find the gap.** "Compare that inventory against [our inventory]. What topics do they cover that we do not? Rank by how close each is to a buying decision."
3. **Find the weakness.** "For the top 5 gap topics, what is thin, outdated, or wrong in their coverage? Where could a first-hand answer beat them?"

The gap alone is not enough. A topic only qualifies if you can answer it **better**, not just also. If the honest answer is "we would just be a worse copy", drop it.

Adapted from the local-SEO workflow in [this thread](https://x.com/bloggersarvesh/status/2090789546925642183). That thread used a browser-driving Grok bot for Google Business Profile work. The transferable idea is not the bot, it is that competitor gaps are a demand signal you can read for free. The line worth keeping from it: automation replaces the busywork, not the strategy.

---

## Tier 4: Pattern probability

When several gap topics survive, this table decides the order. All figures are from 2026 studies, listed under Sources. They are directional, not guarantees.

| Pattern | Intent | Typical KD | Time to page 1, new site | AI Overview trigger | Conversion | AI citation rate | Verdict |
|---|---|---|---|---|---|---|---|
| **`[Product] pricing`** | Transactional | 10-30 | 4-9 months | **~5%** | Very high | Moderate | **Best odds for a first-party site.** AI Overviews barely touch transactional queries, and the official page almost always outranks third-party roundups. Most underrated pattern. |
| **`How to [task]`** | Informational | **10-30** | **2-6 months to first rankings** | ~86% | 2.44% | Strong | **Start here on a new domain.** Lowest difficulty and fastest to move. Accept that AI Overviews take most of the clicks; you are buying topical authority and AI citations, not traffic, in the first 6 months. |
| **`[Competitor] alternatives`** | Commercial | 18-35 | 6-12 months, 3-6 on long tail | ~95% | **8.43%** | Very high | **Highest conversion of any pattern.** You are literally one of the answers, which is a real advantage. Needs roughly DA 25-40 to beat affiliate listicles. Go long-tail first: "best free [X] alternative for [specific job]". |
| **`[A] vs [B]`** | Commercial | 20-40 | 6-12 months | 95.4% | 5.45% | High | Good when you are one of the two products and can publish honest numbers. Third-party comparisons that do not involve you are a losing fight for a new site. |
| **`Best apps/tools for [job]`** | Commercial | 20-50 | 6-14 months | ~81% | High | **Highest (46% of AIO citations)** | **Do not lead with this.** Most cited pattern by AI, and the hardest SERP: established affiliate listicles own it. Worth writing only once DA is 25+, or on a very narrow job nobody has covered. |

### Baseline reality for a new domain

- Only **1.74% to 5.7%** of new pages reach the top 10 within a year.
- Domains under 2 years old are about **2%** of top-10 results.
- Expect a 3 to 9 month trust period before anything meaningful moves.

Do not promise the user rankings inside a month. Say what is realistic.

### Scoring formula

Score each surviving candidate. Write the numbers down in the output so the choice is auditable.

```
score = demand + winnability + intent + moat - aio_penalty
```

| Term | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| `demand` | no evidence | competitor covers it | GSC impressions or real volume | GSC striking distance |
| `winnability` | KD far above our authority | KD roughly at our level | KD below our level | we already rank 5-20 |
| `intent` | pure curiosity | informational | commercial investigation | transactional |
| `moat` | anyone could write this | we have some first-hand view | we have data or access nobody else has | (max 2) |
| `aio_penalty` | transactional, under 20% trigger | mixed, 20-80% | informational, over 80% | (max 2) |

**Hard gate:** any commercial pattern (`alternatives`, `vs`, `best apps`) requires `moat >= 1`. Without a real first-party angle you are writing a worse version of a page that already outranks you.

Pick the highest score. On a tie, pick the lower `aio_penalty`, because those clicks actually arrive.

---

## Tier 5: Trend and timing

Use `mcp__grok-remote__x_search` to check whether the topic is moving right now: a new model release, a price change, a competitor outage, a policy change. A topic with a live conversation attached ranks and gets shared faster than an evergreen one.

Ask X for: what people in this niche are complaining about, what they are comparing, what they just switched away from. Complaints are keywords.

This tier never selects a topic on its own. It reorders the shortlist and it sets urgency. A timely topic that scores 6 beats an evergreen that scores 7, but only if it is genuinely time-sensitive.

---

## Schema and technical audit (once per site, not per post)

Before the first post on a site, and every tenth post after, audit the structured data. Adapted from the same thread, with the browser step replaced by `WebFetch`.

Fetch the site's key pages and check the rendered source. Report:

1. Existing schema types, and whether each is actually correct.
2. Missing or weak schema, ranked by priority.
3. For HIGH priority only, generate clean JSON-LD using the repo's existing pattern.

No guessing. If a field's value is not visible in the repo or the live page, leave a placeholder and say so. Be blunt about what is wrong.

---

## Output of this phase

Write this block before moving on. It goes in the run log and in the project config's backlog.

```
TOPIC DECISION
Chosen:      [title] -> /blog/[slug]
Pattern:     [one of the five patterns]
Source tier: [0-5, and the specific evidence]
Score:       demand X + winnability X + intent X + moat X - aio X = N
Moat:        [the specific first-party thing we know that competitors do not]
Rejected:    [2-3 candidates and the one-line reason each lost]
Cannibalism: [existing posts checked, why this does not overlap]
Realistic:   [expected time to first rankings, stated honestly]
```

---

## Sources

- Seer Interactive, April 2026, AI Overview impact on CTR, 5.47M queries. AIO trigger rates by intent, CTR compression.
- Ahrefs, February 2026. Position-1 CTR drop of 58% on AIO queries.
- Zero Click Labs, 2026. Citation share by content type across ChatGPT, Perplexity, AI Overviews.
- Grow and Convert, 2023. Conversion rate by content pattern. Still the most-cited dataset for this, but it predates AI Overviews, so treat the absolute numbers as relative rankings rather than current truth.
- Ahrefs new-page ranking analyses, 2025-2026. Top-10 rates for new pages and young domains.

Re-verify these before quoting them in a post. Numbers this old age badly, and citing a stale figure in published content is exactly the trust failure this skill exists to avoid.
