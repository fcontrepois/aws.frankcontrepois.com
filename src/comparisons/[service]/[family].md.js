import {readFile} from "node:fs/promises";
import {parseArgs} from "node:util";
import {fileURLToPath} from "node:url";
import {instanceComparisonService} from "../../../lib/instance-comparisons/registry.js";

const templateStart = "/* __PAGE_TEMPLATE__\n";
const templateEnd = "\n__END_PAGE_TEMPLATE__ */";

export async function renderFamilyPage(service, family) {
  const source = await readFile(fileURLToPath(import.meta.url), "utf8");
  let page = source.slice(source.indexOf(templateStart) + templateStart.length, source.lastIndexOf(templateEnd));
  const values = {
    SERVICE_SHORT_NAME: service.shortName,
    NOUN: service.noun,
    NOUN_TITLE: service.noun.replace(/^./, (character) => character.toUpperCase()),
    PRICE_SCOPE: service.priceScope,
    COMPARISON_NOTE: service.comparisonNote,
    COMPARISON_POLICY: JSON.stringify(service.comparisonPolicy),
    CONTEXT_DIMENSIONS: JSON.stringify(service.contextDimensions),
    CONTEXT_DEFAULTS: JSON.stringify(service.contextDefaults),
    EQUIVALENCE_SCOPE: service.equivalenceScope,
    CATALOG_ATTACHMENT: JSON.stringify(`../../data/${service.id}-family-catalog.csv`),
    FAMILY: JSON.stringify(String(family).toLowerCase())
  };
  for (const [name, value] of Object.entries(values)) page = page.replaceAll(`@@${name}@@`, String(value));
  return page;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const {values: {service, family}} = parseArgs({
    options: {service: {type: "string"}, family: {type: "string"}}
  });
  process.stdout.write(await renderFamilyPage(instanceComparisonService(service), family));
}

/* __PAGE_TEMPLATE__
---
title: @@SERVICE_SHORT_NAME@@ family comparison
theme: deep-space
---

```js
import {available, comparatorGroups, defaultSelection, directGenerationPeers, formatDelta, latestMonth, newThisMonth, normalizeCatalog, relativeTo, MONTHLY_HOURS} from "../../components/instance-family-comparator.js";
const family = @@FAMILY@@;
const comparisonPolicy = @@COMPARISON_POLICY@@;
const contextDimensions = @@CONTEXT_DIMENSIONS@@;
const contextDefaults = @@CONTEXT_DEFAULTS@@;
const catalog = normalizeCatalog(await FileAttachment(@@CATALOG_ATTACHMENT@@).csv({typed: true}));
const familyRows = catalog.filter((d) => d.family === family);
if (!familyRows.length) throw new Error(`Unknown @@SERVICE_SHORT_NAME@@ family: ${family}`);
const pricedRows = available(familyRows);
const contextKey = (row) => contextDimensions.map(({field}) => JSON.stringify(row[field] ?? null)).join("|");
const sameContext = (a, b) => contextKey(a) === contextKey(b);
const contextProfiles = pricedRows.filter((row, index, rows) => rows.findIndex((candidate) => sameContext(row, candidate)) === index);
const defaults = defaultSelection(familyRows);
const snapshot = latestMonth(familyRows);
const familyNews = newThisMonth(familyRows, comparisonPolicy);
const familyNewsBanner = familyNews.newLineages.length
  ? html`<div class="tip"><strong>First observed this month:</strong> ${familyNews.newLineages.map((d) => `${family}${d.generation} ${d.processor} / ${d.variant_label} (${d.size_count} ${d.size_count === 1 ? "size" : "sizes"})`).join("; ")}.</div>`
  : html`<div class="note">No new ${family.toUpperCase()} lineages were first observed in ${snapshot}.</div>`;
```

# @@SERVICE_SHORT_NAME@@ ${family.toUpperCase()} family price comparator

Anchor the analysis on one exact @@NOUN@@ type. Every percentage below compares the candidate with that selected anchor—not with the newest generation or with the preceding row.

**Snapshot:** ${snapshot} · **Region:** us-east-1 · **Price:** @@PRICE_SCOPE@@

${familyNewsBanner}

## Choose the anchor

```js
const defaultContextProfile = contextProfiles.find((row) => Object.entries(contextDefaults).every(([field, value]) => row[field] === value)) ?? contextProfiles[0];
const defaultContextIndex = contextProfiles.indexOf(defaultContextProfile);
const contextProfileIndex = contextDimensions.length
  ? view(Inputs.select(contextProfiles.map((_, index) => index), {
      label: "Configuration",
      value: defaultContextIndex,
      format: (index) => {
        const row = contextProfiles[index];
        return contextDimensions.map(({field, label}) => `${label}: ${row[field]}`).join(" · ");
      }
    }))
  : null;
```

```js
const contextProfile = contextProfileIndex == null ? null : contextProfiles[contextProfileIndex];
const anchorRows = contextProfile ? pricedRows.filter((row) => sameContext(row, contextProfile)) : pricedRows;
```

<div class="grid grid-cols-4">
<div class="card">

```js
const generationOptions = [...new Set(anchorRows.map((d) => d.generation))].sort((a, b) => b - a);
const generation = view(Inputs.select(generationOptions, {label: "Generation", value: generationOptions.includes(defaults.generation) ? defaults.generation : generationOptions[0]}));
```

</div>
<div class="card">

```js
const processorRows = anchorRows.filter((d) => +d.generation === +generation);
const processorOptions = [...new Set(processorRows.map((d) => d.processor))].sort();
const processor = view(Inputs.select(processorOptions, {label: "Processor", value: processorOptions.includes(defaults.processor) ? defaults.processor : processorOptions[0]}));
```

</div>
<div class="card">

```js
const variantRows = processorRows.filter((d) => d.processor === processor);
const variantOptions = [...new Set(variantRows.map((d) => d.variant))].sort();
const variant = view(Inputs.select(variantOptions, {label: "Variant", value: variantOptions.includes(defaults.variant) ? defaults.variant : variantOptions[0], format: (value) => variantRows.find((d) => d.variant === value)?.variant_label ?? value}));
```

</div>
<div class="card">

```js
const sizeRows = variantRows.filter((d) => d.variant === variant);
const sizeOptions = [...new Set(sizeRows.map((d) => d.size))];
const size = view(Inputs.select(sizeOptions, {label: "Size", value: sizeOptions.includes(defaults.size) ? defaults.size : sizeOptions[0]}));
```

</div>
</div>

```js
const anchor = sizeRows.find((d) => d.size === size);
```

```js
const groups = comparatorGroups(anchor, familyRows, comparisonPolicy);
const {older, newer} = directGenerationPeers(anchor, groups.generations);
const cheapestCpu = groups.cpus.toSorted((a, b) => a.price_usd_per_hour - b.price_usd_per_hour)[0] ?? null;
const money = (value, digits = 4) => value == null ? "Unavailable" : `${+value < 0 ? "-" : ""}$${Math.abs(+value).toFixed(digits)}`;
const comparisonSentence = (label, peer) => {
  if (!peer) return `No exact ${label.toLowerCase()} is available for this @@EQUIVALENCE_SCOPE@@.`;
  const percent = `${Math.abs(peer.relative_difference * 100).toFixed(1)}%`;
  const comparison = peer.relative_difference > 0
    ? `${percent} more expensive than`
    : peer.relative_difference < 0
      ? `${percent} cheaper than`
      : `the same price as`;
  return `The ${label.toLowerCase()}, ${peer.instance_type}, is ${comparison} the anchor, ${anchor.instance_type}.`;
};
```

## ${anchor.instance_type}

<div class="grid grid-cols-4">
  <div class="card"><h2>Anchor</h2><span class="big">${money(anchor.price_usd_per_hour)}</span><p>The selected anchor costs ${money(anchor.price_usd_per_hour * MONTHLY_HOURS, 2)} per 730-hour month.</p></div>
  <div class="card"><h2>Direct predecessor</h2><span class="big">${older ? formatDelta(older.relative_difference) : "Unavailable"}</span><p>${comparisonSentence("Direct predecessor", older)}</p></div>
  <div class="card"><h2>Direct successor</h2><span class="big">${newer ? formatDelta(newer.relative_difference) : "Unavailable"}</span><p>${comparisonSentence("Direct successor", newer)}</p></div>
  <div class="card"><h2>Cheapest CPU peer</h2><span class="big">${cheapestCpu ? formatDelta(cheapestCpu.relative_difference) : "Unavailable"}</span><p>${comparisonSentence("Cheapest CPU peer", cheapestCpu)}</p></div>
</div>

## Direct specifications

```js
const directSpecs = [anchor, older, newer, cheapestCpu].filter(Boolean).filter((d, i, values) => values.findIndex((x) => x.instance_type === d.instance_type) === i);
const contextFields = contextDimensions.map(({field}) => field);
const contextHeaders = Object.fromEntries(contextDimensions.map(({field, label}) => [field, label]));
Inputs.table(directSpecs, {
  columns: ["instance_type", ...contextFields, "processor", "variant_label", "vcpu", "memory_gib", "physical_processor", "processor_architecture", "network_performance", "storage", "price_usd_per_hour"],
  header: {instance_type: "@@NOUN_TITLE@@", ...contextHeaders, processor: "CPU", variant_label: "Variant", vcpu: "vCPU", memory_gib: "GiB", physical_processor: "Physical processor", processor_architecture: "Architecture", network_performance: "Network", storage: "Storage", price_usd_per_hour: "USD/hour"},
  format: {price_usd_per_hour: (d) => money(d)}
})
```

## Price difference from ${anchor.instance_type}

```js
const chartData = [
  ...[...groups.generations, relativeTo(anchor, anchor)]
    .sort((a, b) => +a.generation - +b.generation || a.instance_type.localeCompare(b.instance_type))
    .map((d) => ({...d, comparison_group: "Generations", group_label: d.instance_type === anchor.instance_type ? "Anchor" : "Gen"})),
  ...groups.cpus.map((d) => ({...d, comparison_group: "CPU alternatives", group_label: "CPU"})),
  ...groups.variants.map((d) => ({...d, comparison_group: "Variant alternatives", group_label: "Variant"}))
].map((d) => ({
  ...d,
  row_label: `${d.group_label} · ${d.instance_type}`,
  percent: d.relative_difference * 100,
  direction: d.relative_difference > 0 ? "Costlier" : d.relative_difference < 0 ? "Cheaper" : "Anchor"
}));
const chartMinimum = Math.min(0, ...chartData.map((d) => d.percent));
const chartMaximum = Math.max(0, ...chartData.map((d) => d.percent));
const chartSpan = Math.max(10, chartMaximum - chartMinimum);
const chartDomain = [chartMinimum - chartSpan * 0.18, chartMaximum + chartSpan * 0.18];
```

<div class="card">

```js
resize((width) => Plot.plot({
  width,
  height: Math.max(260, chartData.length * 34 + 75),
  marginLeft: width < 500 ? 125 : 155,
  marginRight: 18,
  x: {domain: chartDomain, label: `Difference from ${anchor.instance_type} (%)`, grid: true, tickFormat: (d) => `${d > 0 ? "+" : ""}${d}%`},
  y: {domain: chartData.map((d) => d.row_label), label: null},
  color: {domain: ["Cheaper", "Anchor", "Costlier"], range: ["#57c4ad", "#b8b8b8", "#f28e8e"], legend: true},
  marks: [
    Plot.ruleX([0], {stroke: "currentColor", strokeOpacity: 0.6}),
    Plot.barX(chartData, {x: "percent", y: "row_label", fill: "direction", insetTop: 4, insetBottom: 4, tip: {format: {x: (d) => `${d > 0 ? "+" : ""}${d.toFixed(1)}%`, y: true}}}),
    Plot.dot(chartData, {x: "percent", y: "row_label", fill: "direction"}),
    Plot.text(chartData.filter((d) => d.percent < 0), {x: "percent", y: "row_label", text: (d) => formatDelta(d.relative_difference), dx: -7, textAnchor: "end", fill: "currentColor"}),
    Plot.text(chartData.filter((d) => d.percent >= 0), {x: "percent", y: "row_label", text: (d) => formatDelta(d.relative_difference), dx: 7, textAnchor: "start", fill: "currentColor"})
  ]
}))
```

</div>

Equivalent generations are ordered oldest to newest around the anchor: earlier generations appear above it and later generations below it. Positive values are costlier than the anchor; negative values are cheaper. The anchor is 0% and price index 100.

## Anchor data

This is the selected baseline used by every table below.

```js
Inputs.table([{...anchor, monthly_cost: anchor.price_usd_per_hour * MONTHLY_HOURS, relative_difference: 0, price_index: 100}], {
  columns: ["instance_type", ...contextFields, "generation", "processor", "variant_label", "vcpu", "memory_gib", "price_usd_per_hour", "monthly_cost", "relative_difference", "price_index"],
  header: {instance_type: "Instance", ...contextHeaders, generation: "Generation", processor: "CPU", variant_label: "Variant", vcpu: "vCPU", memory_gib: "GiB", price_usd_per_hour: "USD/hour", monthly_cost: "USD/730h", relative_difference: "Vs anchor", price_index: "Index"},
  format: {price_usd_per_hour: (d) => money(d), monthly_cost: (d) => money(d, 2), relative_difference: formatDelta, price_index: (d) => d.toFixed(1)}
})
```

## Equivalent generations

```js
Inputs.table(groups.generations, {columns: ["instance_type", "generation", "price_usd_per_hour", "relative_difference", "price_index", "monthly_difference"], header: {instance_type: "Instance", generation: "Generation", price_usd_per_hour: "USD/hour", relative_difference: "Vs anchor", price_index: "Index", monthly_difference: "USD/730h"}, format: {price_usd_per_hour: (d) => money(d), relative_difference: formatDelta, price_index: (d) => d.toFixed(1), monthly_difference: (d) => money(d, 2)}})
```

## CPU alternatives

```js
Inputs.table(groups.cpus, {columns: ["instance_type", "processor", "vcpu", "memory_gib", "price_usd_per_hour", "relative_difference", "monthly_difference"], header: {instance_type: "Instance", processor: "CPU", vcpu: "vCPU", memory_gib: "GiB", price_usd_per_hour: "USD/hour", relative_difference: "Vs anchor", monthly_difference: "USD/730h"}, format: {price_usd_per_hour: (d) => money(d), relative_difference: formatDelta, monthly_difference: (d) => money(d, 2)}})
```

## Capability variants

These are contextual alternatives, not equivalent products. The anchor is repeated first; “What changes” lists only specifications that differ from it.

```js
const changedSpecification = (candidate) => [
  ["vCPU", anchor.vcpu, candidate.vcpu, (d) => d ?? "Unavailable"],
  ["Memory", anchor.memory_gib, candidate.memory_gib, (d) => d == null ? "Unavailable" : `${d} GiB`],
  ["Network", anchor.network_performance, candidate.network_performance, (d) => d || "Unavailable"],
  ["Storage", anchor.storage, candidate.storage, (d) => d || "Unavailable"]
].filter(([, before, after]) => String(before ?? "") !== String(after ?? ""))
  .map(([label, before, after, format]) => `${label}: ${format(before)} → ${format(after)}`)
  .join("; ") || "No listed specification change";
const capabilityRows = [
  {...relativeTo(anchor, anchor), comparison_role: "Anchor", specification_changes: "Selected baseline"},
  ...groups.variants.map((d) => ({...d, comparison_role: "Alternative", specification_changes: changedSpecification(d)}))
];
```

```js
Inputs.table(capabilityRows, {
  columns: ["comparison_role", "instance_type", "variant_label", "specification_changes", "price_usd_per_hour", "relative_difference", "monthly_difference"],
  header: {comparison_role: "Role", instance_type: "Instance", variant_label: "Variant", specification_changes: "What changes from anchor", price_usd_per_hour: "USD/hour", relative_difference: "Vs anchor", monthly_difference: "Difference USD/730h"},
  format: {price_usd_per_hour: (d) => money(d), relative_difference: formatDelta, monthly_difference: (d) => money(d, 2)}
})
```

## Complete ${family.toUpperCase()} matrix for size ${size}

```js
Inputs.table(anchorRows.filter((d) => d.size === size), {columns: ["instance_type", "status", "processor", "variant_label", "vcpu", "memory_gib", "price_usd_per_hour", "last_price_usd_per_hour", "first_observed_month"], header: {instance_type: "Instance", status: "Status", processor: "CPU", variant_label: "Variant", vcpu: "vCPU", memory_gib: "GiB", price_usd_per_hour: "Current USD/hour", last_price_usd_per_hour: "Last USD/hour", first_observed_month: "First observed"}, format: {price_usd_per_hour: (d) => money(d), last_price_usd_per_hour: (d) => money(d)}})
```

<div class="note">@@COMPARISON_NOTE@@</div>
__END_PAGE_TEMPLATE__ */
