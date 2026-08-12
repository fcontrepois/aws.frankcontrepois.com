# AWS Pricing Graphs

The live site is at [aws.frankcontrepois.com](https://aws.frankcontrepois.com).

This is an Observable Framework site for investigating AWS public pricing. It is
moving from one-off, current-price charts to a reproducible monthly price history.
The site will pair editorial investigations with durable reference pages for AWS
regions, services, instance families, and instance types.

## Data architecture

```text
AWS public offer files
  -> monthly TBZ archive in S3
  -> raw Parquet snapshots (all source columns retained)
  -> compact historical price datasets
  -> small chart-specific extracts for this website
```

The infrastructure and raw-Parquet conversion job live in the sibling
`FinOpsGuyCloudFormationRepository`. Raw data is intentionally kept separate
from website data: the website should load only compact, static files needed for
a chart.

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
- **Website datasets:** the existing loaders and CSV files support the current
  snapshot charts. Historical, compact EC2 price datasets are the next planned
  layer; they are not implemented in this repository yet.

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
npm start
```

Run a production build with:

```sh
npm run build
```

## Technology

- [Observable Framework](https://observablehq.com/framework)
- Observable Plot and D3 for charts
- Static CSV/Parquet-derived data files published through the website build

## License

MIT
