# AWS pricing graphs

This is the site where I take AWS pricing data and I create nice graphs from them.
The project is built using [Observable Framework](https://observablehq.com/framework)

```js
const s3FirstGbPerRegionData = FileAttachment("data/s3FirstGbPerRegion.csv").csv({typed: true});
```

```js
//display(s3FirstGbPerRegionData);
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
  color: {type: "diverging", pivot: 0.03, scheme: "BuRd"},
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
