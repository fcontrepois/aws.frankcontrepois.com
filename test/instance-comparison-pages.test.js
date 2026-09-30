import test from "node:test";
import assert from "node:assert/strict";
import {instanceComparisonService} from "../lib/instance-comparisons/registry.js";
import {renderServiceIndex} from "../src/comparisons/[service]/index.md.js";
import {renderContextControls, renderFamilyPage} from "../src/comparisons/[service]/[family].md.js";

test("service index renderer produces resolved Observable Markdown", async () => {
  const page = await renderServiceIndex(instanceComparisonService("ec2"));
  assert.match(page, /^---\ntitle: EC2 family comparator/m);
  assert.match(page, /FileAttachment\("\.\.\/\.\.\/data\/ec2-family-catalog\.csv"\)/);
  assert.match(page, /comparisonPolicy = \{"fixedDimensions":\[\],"observationLagMonths":1\}/);
  assert.match(page, /## New in \$\{news\.appearanceMonthLabel\}/);
  assert.match(page, /snapshot was taken at the start of the month/);
  assert.doesNotMatch(page, /@@[A-Z0-9_]+@@/);
});

test("family renderer bakes route values into the shared page", async () => {
  const page = await renderFamilyPage(instanceComparisonService("ec2"), "M");
  assert.match(page, /const family = "m";/);
  assert.match(page, /# EC2 \$\{family\.toUpperCase\(\)\} family price comparator/);
  assert.match(page, /comparatorGroups\(anchor, familyRows, comparisonPolicy\)/);
  assert.match(page, /const contextDimensions = \[\];/);
  assert.match(page, /const anchorRows = pricedRows/);
  assert.doesNotMatch(page, /observable\.params/);
  assert.doesNotMatch(page, /@@[A-Z0-9_]+@@/);
});

test("RDS renderer fixes every pricing context dimension", async () => {
  const service = instanceComparisonService("rds");
  const page = await renderFamilyPage(service, "M");
  assert.match(page, /FileAttachment\("\.\.\/\.\.\/data\/rds-family-catalog\.csv"\)/);
  assert.match(page, /const contextDimensions = \[\{"field":"database_engine","label":"Engine"\}/);
  assert.match(page, /"operation","label":"AWS pricing code"/);
  assert.match(page, /No exact \$\{label\.toLowerCase\(\)\} is available for this processor, variant, size, database configuration, and region/);
  assert.doesNotMatch(page, /@@[A-Z0-9_]+@@/);
});

test("context controls cascade through valid service configurations", () => {
  const service = instanceComparisonService("rds");
  const controls = renderContextControls(service);
  assert.match(controls, /label: "Engine"/);
  assert.match(controls, /contextRows1 = contextRows0\.filter/);
  assert.match(controls, /label: "AWS pricing code"/);
  assert.match(controls, /const anchorRows = contextRows6/);
  assert.doesNotMatch(controls, /Configuration/);
});

test("ElastiCache uses cache engine as a fixed comparison dimension", async () => {
  const cache = instanceComparisonService("elasticache");
  assert.deepEqual(cache.comparisonPolicy.fixedDimensions, ["cache_engine"]);
  assert.match(await renderFamilyPage(cache, "m"), /# ElastiCache \$\{family\.toUpperCase\(\)\} family price comparator/);
});

test("OpenSearch uses the shared exact-instance comparison policy", async () => {
  const search = instanceComparisonService("opensearch");
  assert.deepEqual(search.comparisonPolicy.fixedDimensions, []);
  assert.match(await renderFamilyPage(search, "r"), /# OpenSearch \$\{family\.toUpperCase\(\)\} family price comparator/);
});

test("unknown comparison services fail clearly", () => {
  assert.throws(() => instanceComparisonService("unknown"), /Unknown instance comparison service/);
});

test("new-lineage summary describes the new price relative to its predecessor", async () => {
  const {comparatorGroups, directGenerationPeers, formatDelta, relativeTo} = await import("../src/components/instance-family-comparator.js");
  const page = await renderServiceIndex(instanceComparisonService("elasticache"));
  const functionSource = page.slice(page.indexOf("function lineageComparison("), page.indexOf("function familyLink("));
  const base = {family: "m", processor: "graviton", variant: "standard", size: "large", region_code: "us-east-1", cache_engine: "Valkey", status: "available"};
  const older = {...base, instance_type: "cache.m6g.large", generation: 6, price_usd_per_hour: 0.10};
  const anchor = {...base, instance_type: "cache.m7g.large", generation: 7, price_usd_per_hour: 0.08};
  const describe = new Function("catalog", "comparisonPolicy", "comparatorGroups", "directGenerationPeers", "formatDelta", "relativeTo", `${functionSource}; return lineageComparison;`)([older, anchor], {fixedDimensions: ["cache_engine"]}, comparatorGroups, directGenerationPeers, formatDelta, relativeTo);
  assert.equal(describe({representative: anchor}), "cache.m7g.large is -20.0% vs cache.m6g.large");
});

test("managed-service matrices retain missing rows in the selected pricing context", async () => {
  const {familyMatrix, comparatorGroups, available} = await import("../src/components/instance-family-comparator.js");
  for (const id of ["elasticache", "opensearch"]) {
    const service = instanceComparisonService(id);
    const anchor = {family: "m", generation: 7, processor: "graviton", variant: "standard", size: "large", region_code: "us-east-1", cache_engine: "Valkey", instance_type: "m7g.large", status: "available", price_usd_per_hour: 0.1};
    const missing = {...anchor, generation: 6, instance_type: "m6g.large", status: "missing", price_usd_per_hour: null, last_price_usd_per_hour: 0.12};
    const rows = [anchor, missing, {...missing, size: "xlarge"}, {...missing, region_code: "eu-west-1"}];
    if (id === "elasticache") rows.push({...missing, cache_engine: "Redis"});
    assert.deepEqual(familyMatrix(anchor, rows, service.comparisonPolicy), [anchor, missing]);
    assert.deepEqual(comparatorGroups(anchor, rows, service.comparisonPolicy).generations, []);
    assert.match(await renderFamilyPage(service, "m"), /Inputs.table\(familyMatrix\(anchor, familyRows, comparisonPolicy\)/);
    assert.deepEqual(available([{...anchor, price_usd_per_hour: null}, {...anchor, price_usd_per_hour: ""}]), []);
  }
});
