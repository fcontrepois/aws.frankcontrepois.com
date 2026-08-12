---
title: AWS prices through local currencies
theme: deep-space
---

# AWS pricing is not only a USD story

AWS publishes this price in US dollars. A customer paying in another currency
experiences the same invoice through a moving exchange rate. That can make a
flat AWS list price more expensive or cheaper locally, without AWS changing the
price at all.

This page holds a **$100 monthly AWS invoice** constant and asks a simple
question: what did that same invoice cost in each local currency over time?

```js
const fx = FileAttachment("data/fx-usd-monthly.csv").csv({typed: true});
```

```js
const currencyNames = new Map([
  ["AUD", "Australian dollar"],
  ["BRL", "Brazilian real"],
  ["CAD", "Canadian dollar"],
  ["EUR", "Euro"],
  ["GBP", "Pound sterling"],
  ["INR", "Indian rupee"],
  ["JPY", "Japanese yen"],
  ["KRW", "South Korean won"],
  ["SGD", "Singapore dollar"],
  ["ZAR", "South African rand"]
]);

const currencies = [...currencyNames.keys()];
const firstMonth = d3.min(fx, d => d.snapshot_month);
const lastMonth = d3.max(fx, d => d.snapshot_month);
const formatMonth = d3.utcFormat("%b %Y");
const invoiceUsd = 100;
```

```js
const selectedCurrencies = view(Inputs.checkbox(currencies, {
  label: "Compare currencies",
  value: ["GBP", "EUR", "JPY", "INR", "BRL"],
  format: d => `${d} — ${currencyNames.get(d)}`
}));
```

```js
const startDate = view(Inputs.date({
  label: "Start date",
  value: firstMonth,
  min: firstMonth,
  max: lastMonth,
  required: true
}));
```

```js
const endDate = view(Inputs.date({
  label: "End date",
  value: lastMonth,
  min: firstMonth,
  max: lastMonth,
  required: true
}));
```

```js
if (startDate > endDate) throw new Error("Choose an end date after the start date.");

const selectedFx = fx.filter(d => (
  d.quote_currency !== "USD" &&
  d.snapshot_month >= startDate &&
  d.snapshot_month <= endDate
));
const fxByCurrency = d3.group(selectedFx, d => d.quote_currency);
const localInvoice = selectedCurrencies.flatMap(currency => {
  const series = fxByCurrency.get(currency) || [];
  const baseline = series[0]?.usd_to_quote;
  return series.map(d => ({
    ...d,
    currency,
    month: d.snapshot_month,
    local_cost: invoiceUsd * d.usd_to_quote,
    change_from_start: ((d.usd_to_quote / baseline) - 1) * 100
  }));
});

const latestByCurrency = d3.rollup(
  localInvoice,
  values => d3.greatest(values, (a, b) => d3.ascending(a.snapshot_month, b.snapshot_month)),
  d => d.currency
);
const latestRows = [...latestByCurrency.values()].sort((a, b) => b.change_from_start - a.change_from_start);
```

<div class="fx-stats">
  <div class="card stat-card">
    <span>Starting point</span>
    <strong>${formatMonth(startDate)}</strong>
  </div>
  <div class="card stat-card">
    <span>Latest FX observation</span>
    <strong>${formatMonth(endDate)}</strong>
  </div>
  <div class="card stat-card">
    <span>Illustrative USD invoice</span>
    <strong>$100 / month</strong>
  </div>
</div>

## The same AWS bill, indexed

Every line starts at 0%. A value of +12% means the same $100 invoice costs 12%
more in that currency than it did at the beginning of this series. A value of
-9% means it costs 9% less.

<div class="card fx-chart">

```js
Plot.plot({
  width,
  height: 460,
  marginLeft: 56,
  marginRight: 84,
  x: {type: "utc", label: null, grid: true},
  y: {
    label: "Change in local-currency cost from first month",
    grid: true,
    tickFormat: d => d3.format("+.0%")(d - 1)
  },
  color: {legend: true, label: "Currency"},
  marks: [
    Plot.ruleY([1], {stroke: "currentColor", strokeOpacity: 0.45, strokeDasharray: "4,4"}),
    Plot.lineY(localInvoice, Plot.normalizeY("first", {
      x: "month",
      y: "local_cost",
      z: "currency",
      stroke: "currency",
      strokeWidth: 2.5,
      tip: true,
      title: d => `${d.currency}\n${formatMonth(d.month)}\nChange: ${d.change_from_start >= 0 ? "+" : ""}${d.change_from_start.toFixed(1)}%\n$100 = ${d.local_cost.toLocaleString(undefined, {maximumFractionDigits: 2})} ${d.currency}`
    })),
    Plot.text(localInvoice, Plot.selectLast(Plot.normalizeY("first", {
      x: "month",
      y: "local_cost",
      z: "currency",
      fill: "currency",
      text: d => `${d.change_from_start >= 0 ? "+" : ""}${d.change_from_start.toFixed(1)}%`,
      textAnchor: "start",
      dx: 6,
      fontWeight: 700
    })))
  ]
})
```

</div>

## What the latest month says

<div class="card">

```js
Inputs.table(latestRows, {
  columns: ["currency", "local_cost", "change_from_start", "rate_date"],
  header: {
    currency: "Currency",
    local_cost: "$100 invoice now costs",
    change_from_start: "Change since start",
    rate_date: "FX rate date"
  },
  format: {
    currency: d => `${d} — ${currencyNames.get(d)}`,
    local_cost: (d, i) => `${d.toLocaleString(undefined, {maximumFractionDigits: 2})} ${latestRows[i].currency}`,
    change_from_start: d => `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`
  },
  sort: "change_from_start",
  reverse: true,
  rows: Math.max(3, selectedCurrencies.length)
})
```

</div>

## Read this correctly

This is exchange-rate exposure, not an AWS price-change claim. AWS pricing,
consumption, tax, payment terms, hedging, and bank conversion costs can all
change a customer's actual bill. The point is narrower: holding the USD invoice
constant isolates one pressure that a USD-only price chart cannot see.

The exchange rates are end-of-month ECB reference rates. The USD-to-local rate
is calculated from the ECB's EUR reference series; the rate date is kept with
each record. See the [ECB exchange-rate dataset](https://data-api.ecb.europa.eu/service/data/EXR/D.USD+GBP+JPY+AUD+CAD+BRL+INR+SGD+KRW+ZAR.EUR.SP00.A)
used to create the static data file.

<style>
.stat-card {
  display: grid;
  gap: 0.35rem;
  min-height: 8rem;
  align-content: center;
  border-top: 3px solid var(--theme-foreground-focus, #5fd1b5);
}

.fx-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 1rem;
  margin: 1.5rem 0 2rem;
}

.stat-card span {
  color: var(--theme-foreground-muted);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stat-card strong {
  font-size: clamp(1.25rem, 2vw, 1.85rem);
}

.fx-chart {
  background: linear-gradient(135deg, color-mix(in srgb, var(--theme-background-alt) 88%, #0f766e), var(--theme-background-alt));
}
</style>
