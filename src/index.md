---
theme: [glacier, slate]
---

# AWS pricing graphs

This is the site where I take AWS pricing data and I create nice graphs from them.
The project is built using [Observable Framework](https://observablehq.com/framework)

```js
const s3FirstGbPerRegionData = FileAttachment("data/s3FirstGbPerRegion.csv").csv({typed: true});
```

# Regions and price
## S3 Standard - First GB price

A price below $0.03 per hour is what AWS charges for standard regions (blue colour) while anything above that line is to be considered expensive.

GovCloud should be expensive, most of the additional security is applied to the data.

```js
Plot.plot({
  marginBottom: 78,
  x:{tickRotate: -45, label: null},
  y:{label: "First Gb of S3 Storage per region ($/h) "},
  grid: true,
  width: width,
  color: {type: "diverging", pivot: d3.median(s3FirstGbPerRegionData, d=>d.PricePerUnit), scheme: "BuRd"},
  marks:[
    Plot.barY(
      s3FirstGbPerRegionData, {
        x: "Region Code",
        y: "PricePerUnit",
        fill: "PricePerUnit",
        sort: {x: "y", reduce: "max", order: "ascending"},
    }),
    Plot.tip(
      s3FirstGbPerRegionData,
      Plot.pointerX({
        x: "Region Code",
        y: "PricePerUnit",
        title: (d) =>` Region: ${d["Region Code"]}
 Price: $${d.PricePerUnit}/h`
      })
    )
  ]
})
```

<div class="grid grid-cols-2">
<div class="card"><h2>Costiest regions for S3</h2>

```js
// https://observablehq.com/framework/inputs/table
Inputs.table(s3FirstGbPerRegionData,{
  columns: ["Region Code", "Location", "PricePerUnit"],
  header: {
    "Region Code": "Code",
    "Location": "Place",
    "PricePerUnit": "Price"
  },
  width: {
      "Region Code": 120,
      "Location": 180,
      "PricePerUnit": 120
  },
  align: {
      "Region Code": "left",
      "Location": "left",
      "PricePerUnit": "right"
  },
  sort: "PricePerUnit",
  reverse: true,
  rows: 5.5,
  maxWidth: 640,
  multiple: false,
  layout: "fixed"
})
```

</div>
<div class="card"><h2>Chepest regions for S3</h2>

```js
// https://observablehq.com/framework/inputs/table
Inputs.table(s3FirstGbPerRegionData,{
  columns: ["Region Code", "Location", "PricePerUnit"],
  header: {
    "Region Code": "Code",
    "Location": "Place",
    "PricePerUnit": "Price"
  },
  width: {
      "Region Code": 120,
      "Location": 180,
      "PricePerUnit": 120
  },
  align: {
      "Region Code": "left",
      "Location": "left",
      "PricePerUnit": "right"
  },
  sort: "PricePerUnit",
  reverse: false,
  rows: 5.5,
  maxWidth: 640,
  multiple: false,
  layout: "fixed"
})
```

</div>
</div>

# T3.micro - OD cost

```js
const t3microOdHourPerRegion = FileAttachment("data/t3microOdHourPerRegion.csv").csv({typed: true})
```

```js
Plot.plot({
  marginBottom: 78,
  x:{tickRotate: -45, label: null},
  y:{label: "On-demand price to run a t3.micro Storage ($/h) "},
  grid: true,
  width: width,
  color: {type: "diverging", pivot: d3.median(t3microOdHourPerRegion, d=>d.PricePerUnit), scheme: "BuRd"},
  marks:[
    Plot.barY(
      t3microOdHourPerRegion, {
        x: "Region Code",
        y: "PricePerUnit",
        fill: "PricePerUnit",
        sort: {x: "y", reduce: "max", order: "ascending"},
    }),
    Plot.tip(
      t3microOdHourPerRegion,
      Plot.pointerX({
        x: "Region Code",
        y: "PricePerUnit",
        title: (d) =>` Region: ${d["Region Code"]}
 Price: $${d.PricePerUnit}/h`
      })
    )
  ]
})
```

## Number of services per region

```js
const number_of_services_per_region = FileAttachment("data/number_of_services_per_region.csv").csv({typed:true})
```

```js
Plot.plot({
  marginBottom: 78,
  x:{tickRotate: -45, label: null},
  y:{label: "Number of AWS services per region "},
  grid: true,
  width: width,
  color: {type: "diverging", pivot: d3.median(number_of_services_per_region, d=>d.count), scheme: "Greens"},
  marks:[
    Plot.barY(
      number_of_services_per_region, {
        x: "regioncode",
        y: "count",
        fill: "count",
        sort: {x: "y", reduce: "max", order: "descending"},
    }),
    Plot.tip(
      number_of_services_per_region,
      Plot.pointerX({
        x: "regioncode",
        y: "count",
        title: (d) =>` Region: ${d.regioncode}
 Number of services: ${d.count}`
      })
    )
  ]
})
```

## Service to region mapping

```js
const region_to_service = FileAttachment("data/region_to_service.csv").csv({typed:true})
```

```js
Plot.plot({
  grid: true,
  padding: 0,
  width: width,
  height: (new Set(region_to_service.map(item => item.service))).size*20,
  //grid: true,
  marginTop: 80,
  marginLeft: 120,
  x: {axis: "top", label: "Region", tickRotate: -45},
  y: {label: "Service", transform: s => s.replace('AWS', '')
    .replace('Amazon', '')
  },
  marks: [
    Plot.cell(region_to_service, {
      sort: "Region",
      x: "regioncode",
      y: "service",
      fill: "green",
      inset: 0.5,
      tip: true
    }),
  ]
})
```

## Region and Instances
```js
const ec2_generation_to_regions = FileAttachment("data/ec2_generation_to_regions.csv").csv({typed:true})
```

```js
Plot.plot({
  grid: true,
  padding: 0,
  width: width,
  height: (new Set(ec2_generation_to_regions.map(item => item.generation))).size*20,
  //grid: true,
  marginTop: 80,
  marginLeft: 120,
  x: {axis: "top", label: "Region", tickRotate: -45},
  y: {label: "Service", transform: s => s.replace('AWS', '')
    .replace('Amazon', '')
  },
  marks: [
    Plot.cell(ec2_generation_to_regions, {
      sort: "Region Code",
      x: "Region Code",
      y: "generation",
      fill: "green",
      inset: 0.5,
      tip: true
    }),
  ]
})
```
