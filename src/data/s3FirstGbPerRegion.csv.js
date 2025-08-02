// src/data/s3_first_gb_per_region.js

import { PricingClient, GetProductsCommand } from "@aws-sdk/client-pricing";

// Extract the USD price for the first GB (beginRange === "0")
function extractFirstGbPriceUSD(priceItem) {
  const terms = priceItem.terms?.OnDemand;
  if (!terms) return null;
  for (const term of Object.values(terms)) {
    for (const dim of Object.values(term.priceDimensions)) {
      if (
        (dim.unit === "GB-Mo" || dim.unit === "GB-Month") &&
        dim.beginRange === "0"
      ) {
        const usd = dim.pricePerUnit?.USD;
        if (usd !== undefined) return Number(usd);
      }
    }
  }
  return null;
}

async function main() {
  const client = new PricingClient({ region: "us-east-1" });
  const rowsByRegion = new Map();

  let nextToken;
  try {
    do {
      const resp = await client.send(
        new GetProductsCommand({
          ServiceCode: "AmazonS3",
          FormatVersion: "aws_v1",
          NextToken: nextToken,
          MaxResults: 100,
          Filters: [
            { Type: "TERM_MATCH", Field: "volumeType", Value: "Standard" },
          ]
        })
      );

      for (const blob of resp.PriceList) {
        const item = JSON.parse(blob);
        const attrs = item.product.attributes;
        const regioncode = attrs.regionCode || null;
        const location = attrs.location || null;
        if (!regioncode || !location) continue;

        const price = extractFirstGbPriceUSD(item);
        if (price == null) continue;

        // keep the lowest price for the region (should only be one, but just in case)
        if (!rowsByRegion.has(regioncode) || price < rowsByRegion.get(regioncode).price)
          rowsByRegion.set(regioncode, { price, location });
      }

      nextToken = resp.NextToken;
    } while (nextToken);

    if (rowsByRegion.size === 0) {
      console.error("No S3 pricing data found.");
      process.exit(2);
    }

    // CSV output
    console.log("price,location,regioncode");
    for (const [regioncode, { price, location }] of rowsByRegion) {
      console.log(`${price.toFixed(10)},${location},${regioncode}`);
    }
    process.exit(0);
  } catch (err) {
    console.error("Error fetching S3 prices:", err);
    process.exit(1);
  }
}

main();

