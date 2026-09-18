import test from "node:test";
import assert from "node:assert/strict";
import {comparatorGroups, directGenerationPeers, newThisMonth, relativeTo} from "../src/components/instance-family-comparator.js";

const row = (instance_type, generation, processor, variant, price, extra = {}) => ({
  instance_type, family: "m", generation, processor, variant, size: "large",
  region_code: "us-east-1", status: "available", price_usd_per_hour: price,
  as_of_month: "2026-08", first_observed_month: "2026-07", ...extra
});

test("generation, CPU, and variant peers preserve their comparison dimensions", () => {
  const anchor = row("m6i.large", 6, "intel", "standard", 0.10);
  const rows = [anchor, row("m5.large", 5, "intel", "standard", 0.09),
    row("m7i.large", 7, "intel", "standard", 0.11), row("m8i.large", 8, "intel", "standard", 0.08),
    row("m6a.large", 6, "amd", "standard", 0.08), row("m6in.large", 6, "intel", "n", 0.13),
    row("m7in.large", 7, "intel", "n", 0.15),
    {...row("m6i.xlarge", 6, "intel", "standard", 0.20), size: "xlarge"}];
  const groups = comparatorGroups(anchor, rows);
  assert.deepEqual(groups.generations.map((d) => d.instance_type), ["m5.large", "m7i.large", "m8i.large"]);
  assert.deepEqual(groups.cpus.map((d) => d.instance_type), ["m6a.large"]);
  assert.deepEqual(groups.variants.map((d) => d.instance_type), ["m6in.large"]);
  assert.deepEqual(directGenerationPeers(anchor, groups.generations).older.instance_type, "m5.large");
});

test("m8in never substitutes m7i and deltas remain anchor-relative", () => {
  const anchor = row("m8in.large", 8, "intel", "n", 0.12);
  const groups = comparatorGroups(anchor, [anchor, row("m7i.large", 7, "intel", "standard", 0.10), row("m6in.large", 6, "intel", "n", 0.15)]);
  assert.deepEqual(groups.generations.map((d) => d.instance_type), ["m6in.large"]);
  assert.equal(groups.generations[0].relative_difference, 0.25);
  assert.equal(relativeTo(anchor, anchor).price_index, 100);
});

test("missing rows do not participate in price math", () => {
  const anchor = row("m6i.large", 6, "intel", "standard", 0.10);
  const missing = {...row("m5.large", 5, "intel", "standard", null), status: "missing", last_price_usd_per_hour: 0.09};
  assert.equal(comparatorGroups(anchor, [anchor, missing]).generations.length, 0);
  assert.equal(relativeTo(anchor, missing), null);
});

test("service-specific dimensions remain fixed", () => {
  const anchor = row("db.m7g.large", 7, "graviton", "standard", 0.10, {engine: "postgres"});
  const sameEngine = row("db.m6g.large", 6, "graviton", "standard", 0.12, {engine: "postgres"});
  const otherEngine = row("db.m6g.large", 6, "graviton", "standard", 0.14, {engine: "mysql"});
  const groups = comparatorGroups(anchor, [anchor, sameEngine, otherEngine], {fixedDimensions: ["engine"]});
  assert.deepEqual(groups.generations.map((d) => d.engine), ["postgres"]);
});

test("new lineages and sizes are distinct", () => {
  const rows = [
    row("m7i.large", 7, "intel", "standard", 0.10, {first_observed_month: "2026-07"}),
    {...row("m7i.xlarge", 7, "intel", "standard", 0.20, {first_observed_month: "2026-08"}), size: "xlarge"},
    row("m8i.large", 8, "intel", "standard", 0.11, {first_observed_month: "2026-08"}),
    {...row("m8i.xlarge", 8, "intel", "standard", 0.22, {first_observed_month: "2026-08"}), size: "xlarge"}
  ];
  const news = newThisMonth(rows);
  assert.equal(news.newLineages.length, 1);
  assert.equal(news.newLineages[0].size_count, 2);
  assert.deepEqual(news.newSizes.map((d) => d.instance_type), ["m7i.xlarge"]);
});

test("a first-of-month EC2 snapshot reports discoveries in the previous month", () => {
  const rows = [row("m8i.large", 8, "intel", "standard", 0.11, {
    as_of_month: "2026-09",
    first_observed_month: "2026-09"
  })];
  const news = newThisMonth(rows, {observationLagMonths: 1});
  assert.equal(news.month, "2026-09");
  assert.equal(news.appearanceMonth, "2026-08");
  assert.equal(news.appearanceMonthLabel, "August 2026");
});

test("new lineage grouping preserves service pricing context", () => {
  const rows = [
    row("db.m7g.large", 7, "graviton", "standard", 0.10, {database_engine: "PostgreSQL", first_observed_month: "2026-08"}),
    row("db.m7g.large", 7, "graviton", "standard", 0.12, {database_engine: "MySQL", first_observed_month: "2026-08"})
  ];
  const news = newThisMonth(rows, {fixedDimensions: ["database_engine"]});
  assert.equal(news.newLineages.length, 2);
  assert.deepEqual(news.newLineages.map((d) => d.size_count), [1, 1]);
});
