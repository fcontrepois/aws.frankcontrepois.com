export const MONTHLY_HOURS = 730;

function monthKey(value) {
  return value instanceof Date ? value.toISOString().slice(0, 7) : String(value ?? "").slice(0, 7);
}

export function normalizeCatalog(rows) {
  return rows.map((d) => ({
    ...d,
    as_of_month: monthKey(d.as_of_month),
    first_observed_month: monthKey(d.first_observed_month),
    last_observed_month: monthKey(d.last_observed_month)
  }));
}

export function available(rows) {
  return rows.filter((d) => d.status === "available" && Number.isFinite(+d.price_usd_per_hour));
}

export function lineageKey(d) {
  return [d.family, d.generation, d.processor, d.variant].join("|");
}

export function relativeTo(anchor, candidate) {
  const a = +anchor?.price_usd_per_hour;
  const c = +candidate?.price_usd_per_hour;
  if (!(a > 0) || candidate?.status !== "available" || candidate?.price_usd_per_hour == null || !Number.isFinite(c)) return null;
  const hourlyDifference = c - a;
  return {
    ...candidate,
    relative_difference: hourlyDifference / a,
    price_index: (c / a) * 100,
    hourly_difference: hourlyDifference,
    monthly_difference: hourlyDifference * MONTHLY_HOURS
  };
}

export function comparatorGroups(anchor, rows) {
  if (!anchor) return {generations: [], cpus: [], variants: []};
  const peers = available(rows).filter((d) =>
    d.family === anchor.family && d.size === anchor.size && d.region_code === anchor.region_code
  );
  const generations = peers.filter((d) =>
    d.processor === anchor.processor && d.variant === anchor.variant && d.generation !== anchor.generation
  );
  const cpus = peers.filter((d) =>
    d.generation === anchor.generation && d.variant === anchor.variant && d.processor !== anchor.processor
  );
  const variants = peers.filter((d) =>
    d.generation === anchor.generation && d.processor === anchor.processor && d.variant !== anchor.variant
  );
  const byGeneration = (a, b) => +a.generation - +b.generation || a.instance_type.localeCompare(b.instance_type);
  return {
    generations: generations.sort(byGeneration).map((d) => relativeTo(anchor, d)),
    cpus: cpus.sort((a, b) => a.processor.localeCompare(b.processor)).map((d) => relativeTo(anchor, d)),
    variants: variants.sort((a, b) => a.variant.localeCompare(b.variant)).map((d) => relativeTo(anchor, d))
  };
}

export function directGenerationPeers(anchor, generations) {
  const older = generations.filter((d) => +d.generation < +anchor.generation).at(-1) ?? null;
  const newer = generations.find((d) => +d.generation > +anchor.generation) ?? null;
  return {older, newer};
}

export function latestMonth(rows) {
  return rows.reduce((latest, d) => monthKey(d.as_of_month) > latest ? monthKey(d.as_of_month) : latest, "");
}

export function newThisMonth(rows) {
  const month = latestMonth(rows);
  const seenBefore = new Set(rows.filter((d) => monthKey(d.first_observed_month) < month).map(lineageKey));
  const newlyObserved = rows.filter((d) => monthKey(d.first_observed_month) === month);
  const grouped = new Map();
  for (const row of newlyObserved) {
    const key = lineageKey(row);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  const newLineages = [];
  const newSizes = [];
  for (const values of grouped.values()) {
    const summary = {
      family: values[0].family,
      generation: values[0].generation,
      processor: values[0].processor,
      variant: values[0].variant,
      variant_label: values[0].variant_label,
      size_count: values.length,
      sizes: values.map((d) => d.size).sort(),
      representative: values.find((d) => d.size === "large") ?? values[0]
    };
    if (seenBefore.has(lineageKey(values[0]))) newSizes.push(...values);
    else newLineages.push(summary);
  }
  return {month, newLineages, newSizes};
}

export function defaultSelection(rows) {
  const priced = available(rows);
  const generation = Math.max(...priced.map((d) => +d.generation));
  const atGeneration = priced.filter((d) => +d.generation === generation);
  const processor = atGeneration.some((d) => d.processor === "intel") ? "intel" : atGeneration[0]?.processor;
  const atProcessor = atGeneration.filter((d) => d.processor === processor);
  const variant = atProcessor.some((d) => d.variant === "standard") ? "standard" : atProcessor[0]?.variant;
  const atVariant = atProcessor.filter((d) => d.variant === variant);
  const size = atVariant.some((d) => d.size === "large") ? "large" : atVariant[0]?.size;
  return {generation, processor, variant, size};
}

export function formatDelta(value) {
  if (value == null || !Number.isFinite(value)) return "Unavailable";
  return `${value > 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}
