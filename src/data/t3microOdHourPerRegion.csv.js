// src/data/t3micro_od_price_per_region.js
import { PricingClient, GetProductsCommand } from "@aws-sdk/client-pricing";

/**
 * Extract the USD on-demand price from the Pricing API “PriceList” blob.
 * Returned as a Number (e.g. 0.0168).
 */
function extractPriceUSD(priceItem) {
  const terms = priceItem.terms?.OnDemand;
  if (!terms) return null;
  for (const term of Object.values(terms)) {
    for (const dim of Object.values(term.priceDimensions)) {
      const usd = dim.pricePerUnit?.USD;
      if (usd !== undefined) return Number(usd);
    }
  }
  return null;
}

async function main() {
  const client = new PricingClient({ region: "us-east-1" }); // Pricing lives here
  const rowsByRegion = new Map(); // regionCode -> { price, location }

  let nextToken;
  try {
    do {
      const resp = await client.send(
        new GetProductsCommand({
          ServiceCode: "AmazonEC2",
          FormatVersion: "aws_v1",
          NextToken: nextToken,
          MaxResults: 100,
          Filters: [
            { Type: "TERM_MATCH", Field: "instanceType",   Value: "t3.micro" },
            { Type: "TERM_MATCH", Field: "operatingSystem",Value: "Linux"     },
            { Type: "TERM_MATCH", Field: "preInstalledSw", Value: "NA"        },
            { Type: "TERM_MATCH", Field: "tenancy",        Value: "Shared"    },
            { Type: "TERM_MATCH", Field: "capacitystatus", Value: "Used"      },
            { Type: "TERM_MATCH", Field: "productFamily",  Value: "Compute Instance" }
          ]
        })
      );

      for (const blob of resp.PriceList) {
        const item = JSON.parse(blob);
        const attrs     = item.product.attributes;
        const region    = attrs.regionCode || attrs.location || null;
        const location  = attrs.location;
        if (!region || !location) continue;

        const price = extractPriceUSD(item);
        if (price == null) continue;

        // keep the lowest price we’ve seen for the region
        if (!rowsByRegion.has(region) || price < rowsByRegion.get(region).price)
          rowsByRegion.set(region, { price, location });
      }

      nextToken = resp.NextToken;
    } while (nextToken);

    if (rowsByRegion.size === 0) {
      console.error("No pricing data found.");
      process.exit(2);
    }

    // CSV output
    console.log("price,regioncode,location");
    for (const [region, { price, location }] of rowsByRegion) {
      console.log(`${price.toFixed(10)},${region},${location}`);
    }
    process.exit(0);
  } catch (err) {
    console.error("Error fetching prices:", err);
    process.exit(1);
  }
}

main();

