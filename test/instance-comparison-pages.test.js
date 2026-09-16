import test from "node:test";
import assert from "node:assert/strict";
import {instanceComparisonService} from "../lib/instance-comparisons/registry.js";
import {renderServiceIndex} from "../src/comparisons/[service]/index.md.js";
import {renderFamilyPage} from "../src/comparisons/[service]/[family].md.js";

test("service index renderer produces resolved Observable Markdown", async () => {
  const page = await renderServiceIndex(instanceComparisonService("ec2"));
  assert.match(page, /^---\ntitle: EC2 family comparator/m);
  assert.match(page, /FileAttachment\("\.\.\/\.\.\/data\/ec2-family-catalog\.csv"\)/);
  assert.match(page, /comparisonPolicy = \{"fixedDimensions":\[\]\}/);
  assert.doesNotMatch(page, /@@[A-Z0-9_]+@@/);
});

test("family renderer bakes route values into the shared page", async () => {
  const page = await renderFamilyPage(instanceComparisonService("ec2"), "M");
  assert.match(page, /const family = "m";/);
  assert.match(page, /# EC2 \$\{family\.toUpperCase\(\)\} family price comparator/);
  assert.match(page, /comparatorGroups\(anchor, familyRows, comparisonPolicy\)/);
  assert.match(page, /const contextDimensions = \[\];/);
  assert.match(page, /const anchorRows = contextProfile/);
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

test("unknown comparison services fail clearly", () => {
  assert.throws(() => instanceComparisonService("unknown"), /Unknown instance comparison service/);
});
