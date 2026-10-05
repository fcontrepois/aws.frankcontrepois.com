import {readFile} from "node:fs/promises";
import {parseArgs} from "node:util";
import {fileURLToPath} from "node:url";
import {instanceComparisonService} from "../../../lib/instance-comparisons/registry.js";

const templateStart = "/* __PAGE_TEMPLATE__\n";
const templateEnd = "\n__END_PAGE_TEMPLATE__ */";

export async function renderServiceIndex(service) {
  const source = await readFile(fileURLToPath(import.meta.url), "utf8");
  let page = source.slice(source.indexOf(templateStart) + templateStart.length, source.lastIndexOf(templateEnd));
  const values = {
    SERVICE_SHORT_NAME: service.shortName,
    FAMILY_LABEL: service.familyLabel,
    NOUN: service.noun,
    NOUN_TITLE: service.noun.replace(/^./, (character) => character.toUpperCase()),
    PLURAL_NOUN: service.pluralNoun,
    PRICE_SCOPE: service.priceScope,
    SOURCE_NOTE: service.sourceNote,
    COMPARISON_POLICY: JSON.stringify(service.comparisonPolicy),
    CONTEXT_DIMENSIONS: JSON.stringify(service.contextDimensions ?? []),
    CATALOG_ATTACHMENT: JSON.stringify(`../../data/${service.id}-family-catalog.csv`)
  };
  for (const [name, value] of Object.entries(values)) page = page.replaceAll(`@@${name}@@`, String(value));
  return page;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const {values: {service}} = parseArgs({options: {service: {type: "string"}}});
  process.stdout.write(await renderServiceIndex(instanceComparisonService(service)));
}

/* __PAGE_TEMPLATE__
---
title: @@SERVICE_SHORT_NAME@@ family comparator
theme: deep-space
---

# @@SERVICE_SHORT_NAME@@ family comparator

Pick an @@SERVICE_SHORT_NAME@@ @@FAMILY_LABEL@@, anchor the comparison on an exact @@NOUN@@ type, and see whether equivalent generations and CPU platforms are cheaper or costlier. Pricing uses @@PRICE_SCOPE@@ for **us-east-1**.

```js
import {comparatorGroups, directGenerationPeers, formatDelta, hardwareNews, normalizeCatalog, relativeTo} from "../../components/instance-family-comparator.js";
const comparisonPolicy = @@COMPARISON_POLICY@@;
const catalog = normalizeCatalog(await FileAttachment(@@CATALOG_ATTACHMENT@@).csv({typed: true}));
const news = hardwareNews(catalog, comparisonPolicy);
const contextDimensions = @@CONTEXT_DIMENSIONS@@;
const observationExplanation = news.appearanceMonth === news.month
  ? html`“First observed” means the @@NOUN@@ first appeared in this project’s ${news.month} AWS price snapshot. It is not an official AWS launch date.`
  : html`The ${news.month} snapshot was taken at the start of the month, so @@PLURAL_NOUN@@ first seen there are attributed to ${news.appearanceMonthLabel}. This is an inferred appearance period, not an official AWS launch date.`;
const families = [...new Set(catalog.map((d) => d.family))].sort();
```

## New in ${news.appearanceMonthLabel}

${observationExplanation}

```js
function lineageComparison(lineage) {
  const anchor = lineage.representative;
  const {generations} = comparatorGroups(anchor, catalog, comparisonPolicy);
  const {older} = directGenerationPeers(anchor, generations);
  return older ? `${anchor.instance_type} is ${formatDelta(relativeTo(older, anchor)?.relative_difference)} vs ${older.instance_type}` : "No equivalent predecessor observed";
}
function familyLink(family, label) {
  const link = html`<a>${label}</a>`;
  link.setAttribute("href", `./${family}`);
  return link;
}
function configurationDetails(configuration) {
  const row = configuration.representative;
  return contextDimensions.map(({field, label}) => `${label}: ${row[field] || "Unspecified"}`).join(" · ");
}
function newsCards(lineages) {
  return html`<div class="grid grid-cols-3">${lineages.map((d) => html`<div class="card">
    <h2>${d.family.toUpperCase()}${d.generation} · ${d.processor}</h2>
    <p><strong>${d.variant_label}</strong> · ${d.size_count} ${d.size_count === 1 ? "size" : "sizes"} across newly observed configurations</p>
    ${contextDimensions.length ? html`<ul>${d.configurations.map((c) => html`<li><strong>${configurationDetails(c)}</strong><br>${c.size_count} ${c.size_count === 1 ? "size" : "sizes"} · ${lineageComparison(c)}</li>`)}</ul>` : html`<p>${lineageComparison(d)}</p>`}
    <p>${familyLink(d.family, `Open ${d.family.toUpperCase()} family →`)}</p>
  </div>`)}</div>`;
}
const newLineageCards = news.newLineages.length ? newsCards(news.newLineages) : html`<div class="note">No new @@SERVICE_SHORT_NAME@@ hardware lineages were observed for ${news.appearanceMonthLabel}.</div>`;
const newConfigurationCards = news.newConfigurations.length ? html`<section><h2>New configurations on existing hardware</h2><p>These hardware lineages were already present in earlier snapshots. The configurations below were first observed in the ${news.month} snapshot, attributed to ${news.appearanceMonthLabel}.</p>${newsCards(news.newConfigurations)}</section>` : html``;
const emptyNewSizes = news.newSizes.length ? html`` : html`<div class="note">No new sizes in existing lineages were observed for ${news.appearanceMonthLabel}.</div>`;
const browseCards = html`<div class="grid grid-cols-4">${families.map((family) => html`<div class="card"><h2>${family.toUpperCase()}</h2><p>${catalog.filter((d) => d.family === family && d.status === "available").length} available @@NOUN@@ types</p><p>${familyLink(family, `Compare ${family.toUpperCase()} @@PLURAL_NOUN@@ →`)}</p></div>`)}</div>`;
```

${newLineageCards}

${newConfigurationCards}

## New sizes in known lineages

```js
Inputs.table(news.newSizes, {
  columns: ["instance_type", ...contextDimensions.map((d) => d.field), "processor", "variant_label", "vcpu", "memory_gib", "price_usd_per_hour"],
  header: {...Object.fromEntries(contextDimensions.map(({field, label}) => [field, label])), instance_type: "@@NOUN_TITLE@@", processor: "CPU", variant_label: "Variant", vcpu: "vCPU", memory_gib: "GiB", price_usd_per_hour: "USD/hour"},
  format: {price_usd_per_hour: (d) => d == null ? "Unavailable" : `$${d.toFixed(4)}`},
  rows: 8
})
```

${emptyNewSizes}

## Browse families

${browseCards}

<div class="note">@@SOURCE_NOTE@@</div>
__END_PAGE_TEMPLATE__ */
