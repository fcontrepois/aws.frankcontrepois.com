# Instance comparator agent context

## Scope and user outcome

This directory implements reusable parameterized pages for AWS services with
instance-like pricing. Routes follow `/comparisons/<service>/<family>`, such as
`/comparisons/ec2/m`. The intended use is podcast preparation: when AWS
announces a new instance generation or variant, a visitor can select one exact
managed-service instance as an anchor and quickly answer whether comparable
generations, CPU types, or capability variants cost more or less.

Read the repository-root `AGENTS.md` first. For producer/schema changes, also
read `pipeline/pricing-basket/AGENTS.md` in the sibling
`FinOpsGuyCloudFormationRepository`.

## Data path

```text
sibling fg220 CodeBuild job
  -> s3://data.frankcontrepois.com/FinOpsGuyAwsPricingElaboratedData/
       ec2-family-catalog.csv
       rds-family-catalog.csv
  -> src/data/[service]-family-catalog.csv.js loader
  -> FileAttachment("../../data/<service>-family-catalog.csv")
  -> parameterized page loader and shared Markdown template
```

The loader defaults to the public S3 path-style HTTPS endpoint. The custom
`data.frankcontrepois.com` CloudFront endpoint returned a stale 404 during the
2026-08 release; do not change the loader back without testing a real build.
The browser never calls AWS APIs.

## Adding a comparison service

Add one adapter under `lib/instance-comparisons/services/` and register it in
`lib/instance-comparisons/registry.js`. The adapter supplies display language,
pricing scope, source notes, a catalogue reader, comparison policy, and any
service-specific `contextDimensions`. Context dimensions become one combined
configuration selector on the shared family page; they must also appear in the
policy's `fixedDimensions` so peers cannot cross engines, deployment models,
licence models, node roles, or similar service boundaries.

The service catalogue must normalize its common fields to the existing EC2
catalogue contract. Service-specific context columns may be appended. Adding a
service to the registry automatically adds its sidebar entry, service index
route, family routes, and parameterized catalogue loader. Add its card to
`src/comparisons/index.md` as the editorial entry point.

## Comparison contract

The anchor is the exact tuple of family, generation, processor, variant, size,
and region selected by the controls. All deltas use that one anchor:

- generation peers keep processor, variant, size, and region fixed;
- CPU peers keep generation, variant, size, and region fixed;
- capability peers keep generation, processor, size, and region fixed;
- missing or differently sized instances are not silently substituted.

Generation rows are ordered chronologically around the anchor: older exact
generations above it and newer generations below it. A family such as I2 may
exist without a requested size; for example, `i2.xlarge` exists but
`i2.large` does not. Selecting `xlarge` exposes the exact I2 comparison.

Do not add normalization-factor or size-aggregated comparisons without a new
explicit product decision. Investigation showed that generation price deltas
are highly consistent across sizes for ordinary M/C/R/I lineages but not
universally, especially for G accelerators. The current product intentionally
keeps exact-size comparisons.

## Page structure and current UX

The shared family-page template currently presents:

1. latest-month/new-lineage banner;
2. generation, processor, variant, and size anchor controls;
3. anchor price plus direct predecessor/successor and cheapest CPU peer;
4. direct specifications;
5. one anchor-relative Plot chart;
6. an explicit one-row anchor table;
7. equivalent-generation and CPU tables;
8. capability variants with the anchor repeated first and a computed
   “What changes from anchor” column;
9. the complete same-size family matrix.

Keep absent peers explicit as unavailable. The capability change summary only
reports changed vCPU, memory, network, and storage values. Its monthly column is
a difference from the anchor, not total monthly cost.

## Observable Framework preferences

Use standard Observable Framework and Observable Plot only. Prefer:

- Markdown pages with reactive JavaScript cells;
- `FileAttachment` for loader results;
- `Inputs.select` and `Inputs.table` for controls and tables;
- `Plot.plot`, Plot marks, and `resize` for responsive charts;
- parameterized page loaders and data-driven `dynamicPaths` in
  `observablehq.config.js`.

Do not introduce React, another chart library, custom routing, client fetches,
or a separate application framework. Keep calculation cells separate from
display cells: a cell containing `const` declarations is treated as a
declaration cell and will not render a trailing `Inputs.table(...)` expression.

## Plot approach

The price chart uses a single shared percentage axis and one row per candidate.
Do not restore faceting or repeated rows. Labels include the comparison role and
exact instance, such as `Gen · i2.xlarge` or `Variant · g7e.12xlarge`.

- zero is the selected anchor;
- negative is cheaper and positive is costlier;
- percentage labels render at bar endpoints;
- the x-domain includes padding so right-edge labels remain visible;
- left margin adapts for mobile labels;
- chart height scales with row count;
- tooltips retain exact values.

When changing the chart, verify both a dense family and a narrow/mobile
viewport. G is useful for variants; I with `generation=3`, `processor=intel`,
`variant=standard`, and `size=xlarge` is useful for generation ordering.

## Shared code and tests

- `../components/instance-family-comparator.js` owns normalization of typed CSV
  dates, policy-driven peer selection, anchor-relative math, latest-month news,
  and defaults.
- `../../lib/instance-comparisons/` owns the service registry and server-side
  adapters. Each parameterized page loader embeds its Markdown template so
  Framework's cache is invalidated when that template changes.
- `../../test/ec2-family-comparator.test.js` protects comparison dimensions,
  missing-data behavior, and new-lineage detection.
- `../../test/fixtures/*-family-catalog.csv` supports network-free builds.

Validate changes with:

```sh
npm test
EC2_CATALOG_SOURCE=test/fixtures/ec2-family-catalog.csv \
RDS_CATALOG_SOURCE=test/fixtures/rds-family-catalog.csv npm run build
```

For release validation, also build against the production loader and inspect a
real family page in the browser. Do not edit `dist/` or
`src/.observablehq/cache/` as source.
