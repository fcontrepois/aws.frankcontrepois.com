---
---

# AWS pricing graphs

This is the site where I take AWS pricing data and I create nice graphs from them.
The project is built using [Observable Framework](https://observablehq.com/framework)

```js
const s3FirstGbPerRegionData = FileAttachment("data/s3FirstGbPerRegion.csv").csv({typed: true});
```

```js
const s3FirstGbPerRegionDataMedian = d3.median(s3FirstGbPerRegionData, d=>d.PricePerUnit);
```

# Regions and price
## S3 Standard - First GB price
The calculated median value is **$${s3FirstGbPerRegionDataMedian}/h**. You need to have a good reason to be above that value. For example, GovCloud is costlier but the added security credentials and legal requirements might make it the only possible option.

A price below $${s3FirstGbPerRegionDataMedian}/h per hour is good and should be the first choice.

<div class="card">

```js
Plot.plot({
  marginBottom: 78,
  x:{tickRotate: -45, label: null},
  y:{label: "First Gb of S3 Storage per region ($/h). The lower the better."},
  grid: true,
  width: width,
  color: {type: "diverging", pivot: s3FirstGbPerRegionDataMedian, scheme: "BuRd"},
  marks:[
    Plot.barY(
      s3FirstGbPerRegionData, {
        x: "Region Code",
        y: "PricePerUnit",
        fill: "PricePerUnit",
        sort: {x: "y", order: "ascending"},
    }),
    Plot.tip(
      s3FirstGbPerRegionData,
      Plot.pointerX({
        x: "Region Code",
        y: "PricePerUnit",
        title: (d) =>` Region: ${d["Region Code"]}\n Price: $${d.PricePerUnit}/h`
      })
    ),
    //Plot.ruleY([s3FirstGbPerRegionDataMedian])
  ]
})
```

</div>

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
const t3microOdHourPerRegionMedian = d3.median(t3microOdHourPerRegion, d=>d.price);
```

The t3.micro instance type exists in all regions. We can use the cost of running a t3.micro between each regions. We can assume that any difference in cost comes from factor outside of running the server. Example of external factors are: the price of electricity, climate, local laws, security requirements.

The median price of running a t3.micro is **$${t3microOdHourPerRegionMedian}/h**. Again, you need a good reason to select regions where the price is higher.

<div class="tip">
  <p>Note how in GovCloud running a t3 instance costs the same as in most other regions, as opposed to the inflated price for storage?  </p>
</div>


<div class="card">

```js
Plot.plot({
  marginBottom: 68,
  x:{tickRotate: -45, label: null},
  y:{label: "On-demand price to run a t3.micro ($/h). The lower the better."},
  grid: true,
  width: width,
  color: {type: "diverging", pivot: t3microOdHourPerRegionMedian, scheme: "BuRd"},
  marks:[
    Plot.barY(
      t3microOdHourPerRegion, {
        x: "regioncode",
        y: "price",
        fill: "price",
        sort: {x: "y", order: "ascending"},
    }),
    Plot.tip(
      t3microOdHourPerRegion,
      Plot.pointerX({
        x: "regioncode",
        y: "price",
        title: (d) =>` Region: ${d["location"]}\n Price: $${d.price}/h`
      })
    )
  ]
})
```

</div>

## Number of services per region

```js
const number_of_services_per_region = FileAttachment("data/number_of_services_per_region.csv").csv({typed:true})
```

<div class="card">

```js
Plot.plot({
  marginBottom: 78,
  x:{tickRotate: -45, label: null},
  y:{label: "Number of AWS services per region. The higher the better."},
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
        title: (d) =>` Region: ${d.regioncode}\n Number of services: ${d.count}`
      })
    )
  ]
})
```

</div>

## Service to region mapping

```js
const region_to_service = FileAttachment("data/region_to_service.csv").csv({typed:true})
```

```js
const serviceCount = [...new Set(region_to_service.map(d => d.service))].length
const serviceRowHeight = 15; // px per service
```

<div class="card">

```js
Plot.plot({
  width,
  padding: 0,
  grid: true,
  marginTop: 80,
  marginLeft: 120,
  height: serviceCount * serviceRowHeight, 
  x: {axis: "top", label: "Region", tickRotate: -45},
  y: { label: "Service", transform: s => s.replace('AWS', '').replace('Amazon', '') },
  marks: [
    Plot.cell(region_to_service,{
      x: "regioncode",
      y: "service",
      fill: "green",
      inset: 0.5,
      tip: true,
    }),
  ]
})
```

</div>

## Region and Instances

```js
const regionInstanceData = FileAttachment("data/ec2_generation_to_regions.csv").csv({typed:true})
```

```js
const instanceCount = [...new Set(regionInstanceData.map(d => d.generation))].length
const regionCount = [...new Set(regionInstanceData.map(d => d.region_code))].length
const instanceRowHeight = 8

```

<div class="card">

```js
Plot.plot({
  width,
  padding: 0,
  grid: true,
  marginTop: 80,
  marginLeft: 80,
  height: serviceCount * instanceRowHeight, 
  x: {axis: "top", label: "Region", tickRotate: -45},
  y: { label: "Generation"},
  marks: [
    Plot.cell(regionInstanceData, {
      x: "region_code",
      y: "generation",
      fill: "green",
      inset: 0.5,
      tip: true,
    }),
  ]
})
```
</div>
