# AGENTS.md

## Purpose

This repository builds the Observable Framework site at
`aws.frankcontrepois.com`. It is the presentation and editorial layer of the
AWS pricing project. The sibling `FinOpsGuyCloudFormationRepository` owns the
monthly AWS offer archive, raw Parquet conversion, and curated historical
pricing basket.

## Repository map

- `src/index.md`: current regional price and availability dashboard.
- `src/fx-exposure.md`: ECB foreign-exchange exposure analysis.
- `src/s3PriceHistory.md`: manually curated S3 history and commentary.
- `src/data/*.csv.js`: Observable data loaders; their CSV standard output is
  cached and bundled during the build.
- `src/data/*.csv`: small checked-in static datasets.
- `src/components/`: reusable browser-side JavaScript helpers.
- `src/comparisons/`: parameterized page loaders for anchor-relative managed
  service instance comparisons.
- `lib/instance-comparisons/`: comparison service registry and server-side
  adapters used by parameterized loaders.
- `observablehq.config.js`: site metadata, navigation, theme, analytics, and
  Observable source-root configuration.
- `dist/`: generated static output; do not commit it.

## Scoped context

Read the nearest scoped `AGENTS.md` before changing a specialized area:

- `src/comparisons/AGENTS.md`: instance comparator product intent, anchor
  semantics, Observable/Plot patterns, current decisions, and validation.

Keep this root file limited to repository-wide rules. Put page-specific context
beside the page so an agent only loads it when relevant.

## Commands

```sh
npm install
npm run dev
npm run build
npm run clean
```

Run `npm run build` after content, loader, or configuration changes. A normal
build may reuse `src/.observablehq/cache`. When loader behavior or source access
changes, use `npm run clean && npm run build` and expect AWS-backed loaders to
require network access and valid AWS credentials.

## Deployment

Pushing `main` to GitHub triggers the connected Cloudflare Pages build and
publishes `dist/` at `https://aws.frankcontrepois.com/`. The npm commands are
for local development and release validation; this repository does not deploy
through Observable Cloud. After a push, monitor the `Cloudflare Pages` check on
the commit and verify a changed route on the canonical domain. The check can
lag briefly behind the live promotion, so validate the response content rather
than treating an HTTP 200 alone as proof: Cloudflare may serve the site's
fallback page for a route that has not been deployed yet.

## Data conventions

- Keep published datasets small and specific to a chart or question.
- State the source, extraction or effective date, coverage, currency, unit, and
  important filters next to the visualization.
- AWS list-price history is stored in USD. Join ECB FX only in the presentation
  layer, and describe the result as currency exposure rather than an AWS price
  change.
- For time series, use a stable semantic signal or comparison key. SKU and rate
  code are provenance fields, not durable identities.
- Preserve missing historical observations as missing; never silently drop them
  or convert them to zero.
- Check the exact AWS price dimension and unit. For example, S3 storage is
  normally `GB-Mo`, while EC2 on-demand compute is normally `Hrs`.
- Loader diagnostics go to standard error. Standard output must contain only
  valid data in the advertised format.
- Escape CSV fields correctly; prefer `d3-dsv` or another CSV writer over manual
  comma concatenation when fields may contain punctuation.

## Adding or changing data

Use a local Observable loader for small current snapshots or metadata needed by
the site. Put durable monthly price-history transformations in the sibling
infrastructure repository and consume a compact result here. Do not add raw AWS
offer files or broad Parquet snapshots to this repository.

When adding a loader:

1. Use explicit AWS product and price-dimension filters.
2. Paginate until the source is exhausted.
3. Fail clearly when no records are returned.
4. Include provenance and snapshot metadata where practical.
5. Load the generated filename without the final `.js` using `FileAttachment`.

When adding a page, keep prose and code together in `src/<page>.md`. Prefer
Observable's reactive cells, Plot, Inputs, and `FileAttachment` over custom
client infrastructure. Put shared logic in `src/components/` only after it has
more than one likely consumer.

The service comparators consume compact family catalogues. Use the four
service-specific fixture variables for a network-free build:

```sh
EC2_CATALOG_SOURCE=test/fixtures/ec2-family-catalog.csv
RDS_CATALOG_SOURCE=test/fixtures/rds-family-catalog.csv
ELASTICACHE_CATALOG_SOURCE=test/fixtures/elasticache-family-catalog.csv
OPENSEARCH_CATALOG_SOURCE=test/fixtures/opensearch-family-catalog.csv
```

Dynamic paths must remain data-driven, and all candidate deltas must use the
selected exact instance as their anchor.

## Cross-repository coordination

The sibling repository publishes historical basket files under:

```text
s3://data.frankcontrepois.com/FinOpsGuyAwsPricingElaboratedData/
```

If a website change requires a new historical signal, update the versioned
basket configuration and pipeline there first. Document the output contract in
both repositories when columns or semantics change.

## Guardrails

- Never place AWS credentials, account secrets, or signed URLs in source files.
- Do not make AWS API calls from browser-executed page code.
- Do not edit generated files in `dist/` or cached files under
  `src/.observablehq/cache/` as source changes.
- Preserve unrelated worktree changes.
- Do not run `observable deploy` or add `npm run deploy`; Observable Cloud is
  not this site's hosting path. Production deployment is push-driven through
  Cloudflare Pages and still requires explicit user authority to push.
