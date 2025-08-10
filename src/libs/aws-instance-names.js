// aws-instance-names.js
// A tiny utility for AWS EC2 instance naming.
// Exports: parse, stringify, compareGenerations, sortGenerations, compareTypes, sortTypes,
//          groupByFamily, uniqueSorted, isGraviton, isAMD, isIntel, sizeRank, defaultOptions

export const defaultOptions = {
  // Optional: pin an explicit family ordering (e.g., common “class buckets” first)
  familyOrder: null, // e.g. ["c","m","r","x","i","g","p","t","d","h","z","f","inf","trn"]
  // Optional: fine-tune attribute (suffix) order within the same family+generation
  // If omitted, suffixes will be sorted lexicographically.
  suffixOrder: null   // e.g. ["", "a", "g", "i", "in", "d", "dn", "n", "e", "p"]
};

// Regex: family letters, optional generation digits, optional trailing letters (attributes),
// optional ".size" (like ".2xlarge" or ".large")
const RE = /^([a-z]+)(\d+)?([a-z]+)?(?:\.([a-z0-9]+))?$/i;

/** Normalize and parse an EC2 instance id or type (e.g., "m6i", "m6i.2xlarge") */
export function parse(str) {
  const raw = String(str).trim();
  const s = raw.toLowerCase();
  const m = RE.exec(s);
  if (!m) {
    return { raw, normalized: s, family: s, generation: null, suffix: "", size: null, valid: false };
  }
  const [, family, genDigits, suffixRaw, sizeRaw] = m;
  const generation = genDigits ? Number(genDigits) : null;
  const suffix = suffixRaw || "";
  const size = sizeRaw || null;

  return {
    raw,
    normalized: s,
    family,
    generation,
    suffix,
    size,
    valid: true
  };
}

/** Turn components back into a string (lossless for our parse format) */
export function stringify({ family, generation, suffix, size }) {
  let base = family ?? "";
  if (generation != null) base += String(generation);
  if (suffix) base += String(suffix);
  if (size) base += "." + String(size);
  return base;
}

/** Rank families with an optional explicit ordering, else fallback alphabetical. */
function familyRank(family, options) {
  const { familyOrder } = options || {};
  if (Array.isArray(familyOrder)) {
    const i = familyOrder.indexOf(family);
    if (i !== -1) return i;
  }
  // If not provided or not found, alpha rank via first letter(s)
  return family;
}

/** Rank suffixes with an optional explicit ordering, else fallback lexicographic. */
function suffixRank(suffix, options) {
  const { suffixOrder } = options || {};
  if (Array.isArray(suffixOrder)) {
    const i = suffixOrder.indexOf(suffix);
    if (i !== -1) return i;
    // unseen suffixes go after known ones, lexicographically within their block
    return suffixOrder.length + ":" + suffix;
  }
  return suffix; // simple lexicographic fallback
}

/** Determine an ordering for sizes. Returns a comparable number (and tie-breaker string). */
export function sizeRank(size) {
  if (!size) return -1; // “generation only” (no size) comes before sized types when mixing
  if (size === "metal") return 10_000; // shove “metal” to the end

  // Pre-xlarge sizes: nano < micro < small < medium < large < xlarge < 2xlarge < …
  const base = {
    nano: 0,
    micro: 1,
    small: 2,
    medium: 3,
    large: 4,
    xlarge: 5
  };
  if (size in base) return base[size];

  const m = /^(\d+)xlarge$/.exec(size);
  if (m) return 5 + Number(m[1]); // xlarge=5, 2xlarge=7, 4xlarge=9, etc.

  // Unknown size string — park it just after known ones, sorted lexicographically
  return 1_000; // use name as tie-breaker when needed
}

/** Compare two “generation ids” like "m6i" or "c5n" (no size part required). */
export function compareGenerations(a, b, options = defaultOptions) {
  const pa = typeof a === "string" ? parse(a) : a;
  const pb = typeof b === "string" ? parse(b) : b;

  // 1) family (custom order if supplied)
  const fa = familyRank(pa.family, options);
  const fb = familyRank(pb.family, options);
  if (fa < fb) return -1;
  if (fa > fb) return 1;

  // If both are strings (not numeric ranks), fall back alpha when needed
  if (typeof fa === "string" && typeof fb === "string") {
    if (fa < fb) return -1;
    if (fa > fb) return 1;
  }

  // 2) numeric generation (nulls sort after actual numbers)
  const ga = pa.generation ?? Number.POSITIVE_INFINITY;
  const gb = pb.generation ?? Number.POSITIVE_INFINITY;
  if (ga !== gb) return ga - gb;

  // 3) attribute suffix (custom order if supplied; else lexicographic)
  const sa = suffixRank(pa.suffix, options);
  const sb = suffixRank(pb.suffix, options);
  if (sa < sb) return -1;
  if (sa > sb) return 1;

  // 4) finally, stable by normalized string
  return pa.normalized < pb.normalized ? -1 : pa.normalized > pb.normalized ? 1 : 0;
}

/** Compare two full instance *types* like "m6i.large" or "m6i.2xlarge". */
export function compareTypes(a, b, options = defaultOptions) {
  const pa = typeof a === "string" ? parse(a) : a;
  const pb = typeof b === "string" ? parse(b) : b;

  // Compare by family/gen/suffix first
  const g = compareGenerations(pa, pb, options);
  if (g !== 0) return g;

  // Then by size rank
  const ra = sizeRank(pa.size);
  const rb = sizeRank(pb.size);
  if (ra !== rb) return ra - rb;

  // If same bucket (e.g., both unknown size patterns), tiebreak lexicographically
  const sa = pa.size ?? "";
  const sb = pb.size ?? "";
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  return 0;
}

/** Sort an array of generation ids (e.g., ["m6i","m7g","c5n", ...]) */
export function sortGenerations(arr, options = defaultOptions) {
  return [...arr].sort((a, b) => compareGenerations(a, b, options));
}

/** Sort an array of full types (e.g., ["m6i.large","m6i.2xlarge", ...]) */
export function sortTypes(arr, options = defaultOptions) {
  return [...arr].sort((a, b) => compareTypes(a, b, options));
}

/** Deduplicate + sort strings (generation ids or types) with the chosen comparator. */
export function uniqueSorted(arr, comparator = compareGenerations, options = defaultOptions) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = typeof x === "string" ? x.toLowerCase().trim() : stringify(x);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out.sort((a, b) => comparator(a, b, options));
}

/** Group any list (generations or types) by family. */
export function groupByFamily(arr) {
  const map = new Map(); // family -> array
  for (const item of arr) {
    const p = typeof item === "string" ? parse(item) : item;
    const k = p.family;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
  }
  return map; // iterate map.entries() to consume
}

/** Architecture helpers (simple heuristics; adjust if you keep a stricter catalog). */
export function isGraviton(x) {
  const p = typeof x === "string" ? parse(x) : x;
  // Examples: c7g, m7g, r8g, or suffix 'g' after digits (e.g., c6g, m6g, r6g)
  return p.family.endsWith("g") || /^g/.test(p.suffix || "");
}
export function isAMD(x) {
  const p = typeof x === "string" ? parse(x) : x;
  // Examples: c7a, m7a families, or suffix 'a'
  return p.family.endsWith("a") || /^a/.test(p.suffix || "");
}
export function isIntel(x) {
  const p = typeof x === "string" ? parse(x) : x;
  // Default to Intel when explicitly marked 'i' (e.g., m6i) or ‘in’, ‘id’ families/suffixes.
  return p.family.endsWith("i") || /^i/.test(p.suffix || "");
}

/* -----------------------
   EXAMPLES / QUICK TESTS
--------------------------

// Generations
sortGenerations(["m7g","m6i","c5n","c5","c6i","c6in"])
// => ["c5","c5n","c6i","c6in","m6i","m7g"]

// Types
sortTypes(["m6i.large","m6i.2xlarge","m6i.xlarge","m6i.metal"])
// => ["m6i.large","m6i.xlarge","m6i.2xlarge","m6i.metal"]

// Custom suffix order example (base < i < in < d < dn < n < g)
const opts = { suffixOrder: ["", "i", "in", "d", "dn", "n", "g"] };
sortGenerations(["c6g","c6i","c6in","c6dn","c6d","c6n"], opts)
// => ["c6i","c6in","c6d","c6dn","c6n","c6g"]

// Grouping
[...groupByFamily(["c5n","c6i","m6i","m7g"]).entries()]
// => [["c",["c5n","c6i"]],["m",["m6i","m7g"]]]

*/