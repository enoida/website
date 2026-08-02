# enoida.fr

Static pages. No build step, no dependencies, no framework — what is committed is what is
served, by GitHub Pages, from the repository root.

## Layout

| Path | |
|---|---|
| `index.html` | Landing page, English |
| `fr/index.html` | Landing page, French |
| `september-2026/` | Compliance note on the two French age-verification regimes, English |
| `fr/loi-septembre-2026/` | The same note, French |
| `assets/site.css` | Every style for every page |
| `assets/site.js` | Theme picker, sticky header, scroll reveals, the wallet figure |
| `og.png` | Social card, 1200×630 |
| `robots.txt`, `sitemap.xml`, `llms.txt` | Crawler and answer-engine surface |

Four pages share one stylesheet and one script on purpose: the copy is allowed to differ
between languages, the design is not.

## Conventions worth knowing before editing

**Language pairs.** Each page declares `hreflang` alternates for both languages plus
`x-default`, and `sitemap.xml` repeats them. Adding a page means adding it in both languages,
or deliberately deciding not to and leaving the alternates out.

**Theme.** Three choices — light, dark, system — persisted in `localStorage` under
`enoida-theme`. "System" *removes* `data-theme` from `<html>` rather than setting a third
value: the stylesheet resolves the system preference through `prefers-color-scheme`, so absence
is the system choice. A small inline script in each page applies the stored value before first
paint; without it a dark-theme visitor gets a white flash.

**Padding.** `.shell` sets the horizontal gutter with `padding-inline`. Anything that also
carries `.shell` must use `padding-block`, never the `padding` shorthand — the shorthand resets
the horizontal padding to zero, which is how the hero once ran off the left edge of every
phone.

**`env()` needs a fallback.** `env(safe-area-inset-left, 0px)`, not
`env(safe-area-inset-left)`. Without the fallback the declaration is invalid wherever the
variable is unsupported, and the whole padding rule is dropped.

**Structured data.** Every page carries JSON-LD. The `Organization` and `WebSite` nodes are
defined once, on the English landing page, and referenced by `@id` from the others. The notes
carry `Article`, `BreadcrumbList` and `FAQPage`; the FAQ answers are written to be quoted
verbatim by an answer engine, so they are self-contained and factual rather than promotional.

## Checking a change

```bash
python3 -m http.server 8123
```

Then confirm, at minimum: every page returns 200, every internal link and `hreflang` target
resolves, the JSON-LD parses, and the pages hold up at 390 px. The last one is easiest to check
by loading them in a fixed-width `<iframe>` — headless Chrome clamps its window to 500 px and
will quietly lie to you about narrow layouts.
