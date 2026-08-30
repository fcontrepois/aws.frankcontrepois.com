# EC2 Family Comparator — implementation specification

## Outcome

Build an Observable-native EC2 comparison experience for podcast research.
A visitor selects an exact EC2 instance as an anchor and sees all relevant
prices and specifications around it: equivalent older and newer generations,
equivalent CPU-platform alternatives, and other capability variants in the same
generation. The page must answer whether each comparator is costlier or cheaper
than the selected anchor and by how much.

The feature spans two sibling repositories:

- `FinOpsGuyCloudFormationRepository` owns AWS offer ingestion and the compact
  derived EC2 catalogue.
- `aws.frankcontrepois.com` owns the Observable pages, inputs, tables, prose,
  and Plot visualization.

## Initial scope

- Region: `us-east-1`.
- Operating system: Linux.
- Purchase option: On Demand.
- Tenancy: Shared.
- License model: No license required.
- Pre-installed software: `NA`.
- Product family: Compute Instance.
- Price dimension: hourly instance usage only.
- Monthly estimate: 730 hours.
- Default family: M.
- Default size: `large` when available; otherwise use the first size that has a
  valid price and at least one useful comparator.
- Data coverage begins with the first available normalized archive, currently
  expected to be `2024-10`.

Do not add Windows, Spot, Reserved Instances, Savings Plans, currency
conversion, benchmarks, or calendar price-history charts in this version.

## Product vocabulary

An exact instance type is decomposed into:

- `family`: the workload family, such as `m`, `r`, `c`, `x`, or `f`.
- `generation`: the numeric generation.
- `processor`: semantic processor platform: `intel`, `amd`, `graviton`, or
  `other`.
- `processor_code`: the naming marker when one exists, such as `i`, `a`, or
  `g`; it may be empty for an implicit processor.
- `variant`: the non-processor capability suffix, such as standard, `n`, `d`,
  `dn`, or `flex`.
- `size`: `large`, `xlarge`, `2xlarge`, and so on.

Classification must use both AWS product attributes and the instance name.
Do not assume that the first suffix character always encodes the processor.
In particular, `m5.large` is an implicit-Intel, standard predecessor of
`m6i.large`. Preserve unknown or exceptional values explicitly instead of
inventing a classification.

## Comparison semantics

The selected instance is always the anchor. For a candidate price `c` and
anchor price `a`:

```text
relative_difference = (c - a) / a
price_index = (c / a) * 100
hourly_difference = c - a
monthly_difference = (c - a) * 730
```

Thus a positive relative difference means the candidate is costlier than the
anchor, a negative difference means the candidate is cheaper, and the anchor
is 0% / index 100. Use this definition consistently in prose, tables, and Plot.

Comparator groups:

1. **Generations:** same family, processor, variant, size, and region; any
   different generation, both older and newer. The direct predecessor is the
   greatest lower generation with an available equivalent, not necessarily
   generation minus one. The direct successor is the lowest higher generation.
2. **CPU alternatives:** same family, generation, variant, size, and region;
   different processor.
3. **Variant alternatives:** same family, generation, processor, size, and
   region; different capability variant. These are contextual rather than
   equivalent products, so capability and specification differences must stay
   visible.

Never silently substitute a different processor, variant, size, region, OS, or
purchase option. Show a missing equivalent as unavailable. Do not call
price-per-vCPU or price-per-GiB a performance comparison.

## “New this month” semantics

“New” means first observed in the latest processed AWS pricing snapshot, not an
official AWS launch date. Label the snapshot month and region explicitly.

Separate:

- **New lineage:** a family + generation + processor + variant combination not
  observed in any earlier processed snapshot.
- **New size:** an exact instance type first observed this month for a lineage
  that was already known.

Group exact sizes into lineage-level summaries so one new generation does not
produce a wall of nearly identical cards. Empty months are valid and should say
that no new lineages were observed.

## Derived EC2 catalogue contract

Add a derived dataset named `ec2-family-catalog` to the existing elaborated S3
prefix. Each dated output is a self-contained as-of snapshot with one row per
exact instance type observed up to that month. The undated output is identical
to the newest dated output.

Expected locations:

```text
FinOpsGuyAwsPricingElaboratedData/
  2026-07/ec2-family-catalog.csv
  2026-07/ec2-family-catalog.parquet
  2026-08/ec2-family-catalog.csv
  2026-08/ec2-family-catalog.parquet
  ec2-family-catalog.csv
  ec2-family-catalog.parquet
```

Required fields, with final names documented in the infrastructure README:

```text
as_of_month
first_observed_month
last_observed_month
status
region_code
location
instance_type
family
generation
processor
processor_code
variant
variant_label
size
vcpu
memory_gib
physical_processor
processor_architecture
network_performance
storage
price_usd_per_hour
last_price_usd_per_hour
unit
price_description
sku
rate_code
source_offer
source_file
dataset_version
```

Rules:

- All current matches are `available`, with `price_usd_per_hour` populated.
- Previously observed types absent from the current snapshot remain present as
  `missing`; their current price is null and their last known price is retained
  separately. Missing prices must not participate in comparisons.
- Preserve `first_observed_month` once established and advance
  `last_observed_month` only when the type is observed.
- Fail on ambiguous duplicate hourly price matches for an exact instance type;
  do not take an arbitrary first or minimum price.
- CSV and Parquet outputs must contain equivalent ordered records.
- The dataset version starts at `v1`.

Extend the existing `fg220` curated-data job rather than introducing a second
independent monthly schedule unless the repository structure makes that unsafe.
The established download → raw Parquet → curated-data chain must remain serial.

## Infrastructure work

In `FinOpsGuyCloudFormationRepository`:

1. Add a versioned configuration for the catalogue scope and classification
   exceptions.
2. Add a transformation that reads the current month’s AmazonEC2 on-demand raw
   Parquet plus the previous month’s derived catalogue, validates exact hourly
   price matches, classifies instance names, and writes the current as-of state.
3. Add single-month and serial-range entry points consistent with the existing
   pipeline conventions.
4. Run the catalogue from the existing curated-data buildspec and grant only
   permissions already required by the relevant S3 prefixes where possible.
5. Publish dated and undated CSV and Parquet.
6. Add deterministic fixtures and tests that do not require AWS access.
7. Document the contract, execution variables, versioning, and rebuild rules.

Do not start CodeBuild, deploy CloudFormation, upload S3 objects, or run a real
backfill as part of local implementation.

## Required classification fixtures

Tests must cover at least:

- `m5.large`: M, generation 5, implicit Intel, standard, large.
- `m5a.large`: M, generation 5, AMD, standard, large.
- `m6i.large`: Intel, standard.
- `m6in.large`: Intel, `n`.
- `m6idn.large`: Intel, `dn`.
- `m7g.large`: Graviton, standard.
- `m7gd.large`: Graviton, `d`.
- `c7gn.large`: Graviton, `n`.
- at least one `flex` name.
- at least one multi-letter family such as `inf` or `trn`.
- at least one exceptional or unclassifiable name that remains explicit.

Tests must also prove:

- `m5.large`, `m6i.large`, `m7i.large`, and `m8i.large` share an Intel-standard
  generational lineage.
- `m8in.large` does not compare as a generation peer with `m7i.large`.
- CPU peers keep generation, variant, size, and region fixed.
- Variant peers keep generation, processor, size, and region fixed.
- Anchor-relative signs and percentages are correct.
- New lineages and new sizes are distinguished correctly.
- Missing current rows retain provenance but are excluded from price math.

## Observable information architecture

Use native file-based and parameterized routing:

```text
/ec2/       EC2 discovery page
/ec2/m      M-family page
/ec2/r      R-family page
/ec2/c      C-family page
...
```

Use one template at `src/ec2/[family].md`. `dynamicPaths` must enumerate all
families in the latest derived catalogue during the build; do not maintain a
handwritten list. A family page is permanent even when a newer generation is
introduced.

The website data loader should retrieve the compact undated catalogue from the
public elaborated-data location during build and emit a valid static snapshot.
Visitors must not access AWS or S3 credentials. Loader diagnostics go to
standard error, and source-fetch failures must fail the loader.

For local tests before the S3 object exists, support an explicit local fixture
source or seed only the ignored Observable cache. Never silently fall back to
sample data in a production build.

## `/ec2/` discovery page

At the top, show the latest snapshot month and new lineages as native Framework
cards. Each card includes family, generation, processor, variant, number of new
sizes, a representative direct-predecessor comparison when one exists, and a
link to the permanent family page. Below it, show new sizes in existing lineages
with a native `Inputs.table`. Then provide links or native controls to browse all
families.

Use “first observed” wording, not “launched”. State `us-east-1` prominently.

## Family page

Use only Observable Framework Markdown/reactive JavaScript, `FileAttachment`,
native Observable Inputs, Framework `grid`, `card`, and `resize`, plain
JavaScript transformations, and Observable Plot. Do not add React, Vue, Svelte,
Vega-Lite, another charting library, a CSS framework, custom elements, or a
client-side database.

Controls:

```text
Generation
Processor
Variant
Size
```

The family comes from the route and the region is fixed/displayed for v1.
Controls are reactive and only offer valid combinations. Default to the newest
generation, then Intel if available, then standard variant if available, then
`large` if available. Always show the resolved exact anchor instance.

Content order:

1. Family title, scope, latest snapshot, and family-specific new-this-month
   summary.
2. Anchor controls and resolved selected instance.
3. Reactive prose stating the direct predecessor and successor differences.
4. Framework summary cards for anchor price, direct predecessor, direct
   successor, and cheapest equivalent CPU peer where available.
5. A direct specification comparison table.
6. One responsive Plot showing candidate price differences relative to the
   anchor, grouped into generations, CPU alternatives, and variant alternatives.
7. Native `Inputs.table` sections for all three groups and the complete family
   matrix for the selected size.
8. Interpretation notes explaining list-price scope, missing equivalents,
   variant differences, and why normalized resource costs are not benchmarks.

The Plot must be built from standard Plot marks such as `barX` or `ruleX`, a
zero `ruleX`, `dot`, `text`, and native tips. Positive means the candidate is
costlier than the anchor; negative means cheaper. The anchor is 0% / index 100.
Do not add a calendar time axis.

Avoid custom CSS unless a requirement cannot be met by Framework’s standard
dashboard theme, grids, cards, notes, Inputs, tables, and Plot. Any unavoidable
CSS must be minimal and documented.

## Website work

In `aws.frankcontrepois.com`:

1. Add the catalogue loader with explicit production and local-fixture modes.
2. Add pure reusable comparison helpers with unit tests, rather than embedding
   all logic in Markdown cells.
3. Add `/ec2/index.md` and `/ec2/[family].md`.
4. Add data-driven `dynamicPaths` without duplicating catalogue semantics.
5. Add the EC2 section to navigation while preserving existing pages.
6. Update README and AGENTS guidance for the new dataset and routes.
7. Keep all client functionality within standard Observable Framework and Plot.

## Acceptance scenarios

Using deterministic fixture prices:

1. Anchor `m6i.large` shows `m5.large` as an older implicit-Intel comparator
   and `m7i.large`/`m8i.large` as newer comparators.
2. Every displayed delta uses `m6i.large` as zero, including later generations.
3. Anchor `m8in.large` includes only `in` generation peers; `m7i.large` is not
   silently substituted.
4. CPU alternatives for an anchor keep family, generation, variant, size, and
   region fixed.
5. Variant alternatives remain visibly labelled as capability-different.
6. Missing exact equivalents render “Unavailable” without NaN, Infinity, a
   zero price, or a misleading percentage.
7. The discovery page distinguishes a new lineage from a new size and renders a
   valid empty month.
8. Each family in the fixture has a built parameterized route.
9. Changing each control recomputes prose, cards, Plot, and tables without a
   page reload or invalid combination.
10. The page builds and renders at wide and narrow viewport sizes.

## Validation

The implementation agent must run, as applicable:

- Infrastructure Python unit tests.
- Website JavaScript unit tests using the existing Node toolchain or Node’s
  built-in test runner.
- JSON validation.
- `bash -n` for changed shell scripts.
- Python compilation.
- `git diff --check` in both repositories.
- `npm run build` with an explicit fixture source or seeded ignored cache.

The reviewing agent will independently rerun these checks, inspect both diffs,
and visually exercise desktop and narrow layouts in the local preview.

## Approval boundaries

Authorized:

- Read both repositories.
- Make local in-scope edits in both repositories.
- Add deterministic fixtures and tests.
- Run non-destructive local tests, builds, and preview servers.

Not authorized without a separate explicit request:

- AWS API mutations.
- CloudFormation deployment.
- CodeBuild execution.
- S3 upload or overwrite.
- Historical backfill.
- Observable deployment.
- Git commit, push, merge, reset, or destructive cleanup.
