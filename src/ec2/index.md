---
title: EC2 family comparator
theme: deep-space
---

# EC2 family comparator

Pick an EC2 family, anchor the comparison on an exact instance type, and see whether equivalent generations and CPU platforms are cheaper or costlier. Prices are Linux On-Demand list prices in **us-east-1**.

```js
import {comparatorGroups, directGenerationPeers, formatDelta, newThisMonth, normalizeCatalog} from "../components/ec2-family-comparator.js";
const catalog = normalizeCatalog(await FileAttachment("../data/ec2-family-catalog.csv").csv({typed: true}));
const news = newThisMonth(catalog);
const families = [...new Set(catalog.map((d) => d.family))].sort();
```

## First observed in ${news.month}

“First observed” means the instance first appeared in this project’s ${news.month} AWS price snapshot. It is not an official AWS launch date.

```js
function lineageComparison(lineage) {
  const anchor = lineage.representative;
  const {generations} = comparatorGroups(anchor, catalog);
  const {older} = directGenerationPeers(anchor, generations);
  return older ? `${anchor.instance_type} is ${formatDelta(relativeToAnchor(older))} vs ${older.instance_type}` : "No equivalent predecessor observed";
  function relativeToAnchor(peer) { return peer.relative_difference; }
}
function familyLink(family, label) {
  const link = html`<a>${label}</a>`;
  link.setAttribute("href", `./${family}`);
  return link;
}
const newLineageCards = news.newLineages.length ? html`<div class="grid grid-cols-3">${news.newLineages.map((d) => html`<div class="card">
  <h2>${d.family.toUpperCase()}${d.generation} · ${d.processor}</h2>
  <p><strong>${d.variant_label}</strong> · ${d.size_count} new ${d.size_count === 1 ? "size" : "sizes"}</p>
  <p>${lineageComparison(d)}</p>
  <p>${familyLink(d.family, `Open ${d.family.toUpperCase()} family →`)}</p>
</div>`)}</div>` : html`<div class="note">No new EC2 lineages were first observed in this snapshot.</div>`;
const emptyNewSizes = news.newSizes.length ? html`` : html`<div class="note">No new sizes in existing lineages were first observed this month.</div>`;
const browseCards = html`<div class="grid grid-cols-4">${families.map((family) => html`<div class="card"><h2>${family.toUpperCase()}</h2><p>${catalog.filter((d) => d.family === family && d.status === "available").length} available instance types</p><p>${familyLink(family, `Compare ${family.toUpperCase()} instances →`)}</p></div>`)}</div>`;
```

${newLineageCards}

## New sizes in known lineages

```js
Inputs.table(news.newSizes, {
  columns: ["instance_type", "processor", "variant_label", "vcpu", "memory_gib", "price_usd_per_hour"],
  header: {instance_type: "Instance", processor: "CPU", variant_label: "Variant", vcpu: "vCPU", memory_gib: "GiB", price_usd_per_hour: "USD/hour"},
  format: {price_usd_per_hour: (d) => d == null ? "Unavailable" : `$${d.toFixed(4)}`},
  rows: 8
})
```

${emptyNewSizes}

## Browse families

${browseCards}

<div class="note">Source: AWS public price-list snapshots transformed by the sibling FinOpsGuyCloudFormationRepository. Scope: us-east-1, Linux, Shared tenancy, On Demand, no pre-installed software, USD, hourly usage.</div>
