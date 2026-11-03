---
theme: deep-space
---

# AWS regions: price and availability

Compare regional S3 storage prices, EC2 compute prices, and service availability.
Start with a price difference, then check whether the region offers what your workload needs.

[← Explore more AWS pricing questions](./)

Prices are AWS list prices in USD, fetched at site build time. S3 covers the first storage tier of S3 Standard in GB-months; EC2 covers on-demand t3.micro compute in hours. These snapshots are not a complete workload estimate.

```js
const s3FirstGbPerRegionData = FileAttachment("data/s3FirstGbPerRegion.csv").csv({typed: true});
```

```js
const s3FirstGbPerRegionDataMedian = d3.median(s3FirstGbPerRegionData, d=>d.price);
```

# Regions and price
## S3 Standard — first storage tier
The calculated median value is **$${s3FirstGbPerRegionDataMedian}/GB-month**. You need to have a good reason to be above that value. For example, GovCloud is costlier but the added security credentials and legal requirements might make it the only possible option.

A price below $${s3FirstGbPerRegionDataMedian}/GB-month is good and should be the first choice.

<div class="card">

```js
Plot.plot({
  marginBottom: 78,
  x:{tickRotate: -45, label: null},
  y:{label: "S3 Standard storage (USD/GB-month)"},
  grid: true,
  width: width,
  color: {type: "diverging", pivot: s3FirstGbPerRegionDataMedian, scheme: "BuRd"},
  marks:[
    Plot.barY(
      s3FirstGbPerRegionData, {
        x: "regioncode",
        y: "price",
        fill: "price",
        sort: {x: "y", order: "ascending"},
    }),
    Plot.tip(
      s3FirstGbPerRegionData,
      Plot.pointerX({
        x: "regioncode",
        y: "price",
        title: (d) =>` Region: ${d["regioncode"]}\n Price: $${d.price}/GB-month`
      })
    ),
    //Plot.ruleY([s3FirstGbPerRegionDataMedian])
  ]
})
```

</div>

<div class="grid grid-cols-2">
<div class="card"><h2>Costliest regions for S3</h2>

```js
// https://observablehq.com/framework/inputs/table
Inputs.table(s3FirstGbPerRegionData,{
  columns: ["regioncode", "location", "price"],
  header: {
    "regioncode": "Region",
    "location": "Location",
    "price": "Price"
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
  sort: "price",
  reverse: true,
  rows: 5.5,
  maxWidth: 640,
  multiple: false,
  layout: "fixed"
})
```

</div>
<div class="card"><h2>Cheapest regions for S3</h2>

```js
// https://observablehq.com/framework/inputs/table
Inputs.table(s3FirstGbPerRegionData,{
  columns: ["regioncode", "location", "price"],
  header: {
    "regioncode": "Region",
    "location": "Location",
    "price": "Price"
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
  sort: "price",
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
Each little square is a service. It makes it easy to compare, no?

<div class="card">

```js
Plot.plot({
  width,
  x: {label: "Region", tickRotate: -45},
  y: { label: "Service" },
  marginBottom: 80,
  marks: [
    Plot.waffleY(
     region_to_service,
     {
      x: "regioncode",
      y: 1,
      fill: "service",
      sort: {x: "-y"},
      tip: {format: {y: null}},
     }),
  ]
})
```

</div>


## Instances and regions

```js
const regionInstanceData = FileAttachment("data/ec2_generation_to_regions.csv").csv({typed:true})
```

```js
const instances = [...new Set(regionInstanceData.map(d => d.generation))].sort()
const regions = [...new Set(regionInstanceData.map(d => d.region_code))].sort()
const families = [...new Set(regionInstanceData.map(d => d.family))].sort()
const groupedFamily = d3.sort(d3.groups(regionInstanceData, d => d.family))
const familyColour = Plot.scale({color: {domain: families}})
const regionColours = Plot.scale({color: {domain: regions}})
```

```js
Plot.legend({color: familyColour})
```

<div class="card">

```js
htl.html`${
groupedFamily.map(([groupFamily,groupData]) => 
Plot.plot({
  width,
  padding: 0,
  grid: true,
  marginTop: 80,
  marginLeft: 80,
  x: {axis: "top", label: null, tickRotate: -45},
  y: { label: null},
  color: familyColour,
  marks: [
    Plot.cell(groupData, {
      x: "region_code",
      y: "generation",
      fill: "family",
      inset: 0.5,
      tip: true,
    }),
  ]
}))
}`
```
</div>

## Regions and instances

<div class="tip">
  <p>
    Hover the graphs to see the tooltip with the details.
 </p>
</div>

```js
const groupedRegions = d3.sort(d3.groups(regionInstanceData, d => d.region_code))
```

<div class="card">

```js
htl.html`${groupedRegions.map(([groupRegions, groupData]) => {
  // https://observablehq.com/plot/marks/axis#axis-mark
  // display(groupData);
  return Plot.plot({
    width,
    padding: 0,
    grid: true,
    marginTop: 80,
    marginLeft: 80,
    x: { label: null },
    y: { label: null },
    color: familyColour,
    marks: [
      Plot.cell(groupData, {
        x: "generation",
        y: "region_code",
        fill: "family",
        inset: 0.5,
        tip: true,
      }),
      Plot.axisX(groupData, {
        x: (y) => y.family, tickFormat: y => y.family
      })
    ]
  })
})}`

```

</div>

## Service to region mapping

```js
const region_to_service = FileAttachment("data/region_to_service.csv").csv({typed:true})
```

```js
const serviceCount = [...new Set(region_to_service.map(d => d.service))].length
const serviceRowHeight = 20; // px per service
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


