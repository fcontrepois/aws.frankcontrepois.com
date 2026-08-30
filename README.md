# AWS Pricing Graphs

The live site is at [aws.frankcontrepois.com](https://aws.frankcontrepois.com).

This repository is the presentation layer for investigating AWS public pricing.
It uses Observable Framework, Observable Plot, and D3 to turn small static
datasets into interactive charts and editorial analysis. It is moving from
one-off, current-price charts to reproducible monthly price histories.

The collection and historical transformation layer lives in the sibling
`FinOpsGuyCloudFormationRepository`. That repository archives AWS offer files,
converts them to Parquet, and produces curated historical datasets. This
repository should consume only compact extracts suitable for a static website.

## What the site currently publishes

| Page | Purpose | Data |
| --- | --- | --- |
| `src/index.md` | Compare regional S3 and EC2 prices, EC2 generation availability, and service availability. | Observable data loaders calling AWS Pricing, EC2, and SSM APIs. |
| `src/fx-exposure.md` | Show how exchange rates change the local-currency cost of a constant USD invoice. | Checked-in monthly ECB-derived CSV. |
| `src/s3PriceHistory.md` | Present an editorial history of S3 Standard prices. | Manually curated AWS announcement dates and prices. |

Observable data loaders use names such as `src/data/example.csv.js`. During a
build, Observable executes the JavaScript loader, captures its standard output
as `example.csv`, and packages that generated file into the static site. The
browser does not call AWS APIs.

## Data architecture

```text
AWS public offer files
  -> monthly TBZ archive in S3
  -> raw Parquet snapshots (all archived columns retained)
  -> compact historical price datasets
  -> small chart-specific extracts for this website
```

The first three stages are implemented in the sibling repository. The final
historical website integration is in progress: the current regional charts
still use direct AWS API loaders, and the new `pricing-basket.csv` is not yet
consumed here.

## Current data

- **Raw pricing snapshots:** monthly archives and partitioned Parquet in
  `s3://data.frankcontrepois.com/FinOpsGuyAwsPricingRepository/`.
- **Foreign exchange reference data:** `src/data/fx-usd-monthly.csv`, sourced
  from the European Central Bank. It is deliberately separate from AWS pricing
  data so charts can express USD list prices and local-currency equivalents
  independently.
- **FX exposure page:** `src/fx-exposure.md` holds a USD invoice constant and
  shows how exchange-rate movements change its local-currency equivalent. Its
  date controls filter the available monthly observations; each selected series
  is normalised to its first observation with Observable Plot.
- **Current website datasets:** loaders under `src/data/*.csv.js` query the AWS
  Pricing, EC2, and SSM APIs during the build and emit chart-specific CSV.
- **Historical pricing basket:** the sibling repository produces cumulative
  EC2, S3, and Bedrock history in both CSV and Parquet. A website page consuming
  that basket is the next planned integration.
- **Manual S3 history:** `src/s3PriceHistory.md` contains a curated series based
  on AWS price-reduction announcements because the current AWS Pricing API does
  not expose the required historical series.
- **EC2 family catalogue:** `src/data/ec2-family-catalog.csv.js` downloads the
  compact current as-of catalogue produced by the sibling repository. `/ec2/`
  shows newly observed lineages and sizes; `/ec2/<family>` provides an
  anchor-relative family comparator. Set `EC2_CATALOG_SOURCE` to an explicit
  local CSV path for deterministic local builds; production never silently
  falls back to fixture data.

## Principles

- Preserve raw AWS snapshots so future questions can be answered again.
- Define a stable, explicit comparison key rather than treating AWS SKU changes
  as price changes.
- Publish a small number of trustworthy fields for each question or chart.
- Keep price history in USD; join FX at visualisation time.
- Treat FX charts as currency-exposure analysis, not evidence that AWS changed
  a list price. Consumption, taxes, payment terms, and hedging are outside this
  reference series.
- Show source and date coverage alongside published charts.

## Local development

```sh
npm install
npm run dev
```

Run a production build with:

```sh
npm run build
```

AWS-backed loaders require network access and an AWS credential chain that can
read the Pricing, EC2, and SSM APIs. Observable may reuse cached loader output
from `src/.observablehq/cache`; run `npm run clean` before a build when you need
to prove that data can be regenerated from its source.

## Extending the site

### Add a chart backed by a small static file

1. Put the file under `src/data/`.
2. Load it from a Markdown page with `FileAttachment` and `{typed: true}`.
3. Transform it in an Observable JavaScript cell and render it with Plot or an
   Observable input.
4. Include the source, units, snapshot coverage, and interpretation limits on
   the page.

### Add a current AWS snapshot

1. Add `src/data/<name>.csv.js`.
2. Filter the AWS response to an explicit product and price dimension.
3. Emit valid CSV to standard output; send diagnostics to standard error.
4. Include provenance and extraction-date fields when practical.
5. Reference `data/<name>.csv` from the page and validate with a clean build.

### Add historical pricing

Prefer extending the versioned pricing-basket configuration and pipeline in
`FinOpsGuyCloudFormationRepository`, then consume its compact output here. A
historical comparison should use a stable semantic key rather than SKU or rate
code, retain missing observations, keep AWS prices in USD, and join FX only at
visualisation time.

Reusable parsing, sorting, or presentation helpers belong in `src/components/`.
Explicit sidebar grouping can be added through the `pages` option in
`observablehq.config.js`.

## Repository boundaries

- Do not copy the raw AWS offer archive or broad Parquet datasets into this
  repository.
- Do not make browser-side AWS calls or expose AWS credentials in site code.
- Do not treat a currency-converted price movement as an AWS list-price change.
- Keep build outputs (`dist/`) and Observable caches out of version control.
- Prefer a narrow, documented dataset per published question over a generic
  dump of AWS pricing data.

## Technology

- [Observable Framework](https://observablehq.com/framework)
- Observable Plot and D3 for charts
- Static CSV/Parquet-derived data files published through the website build

## License

MIT
