// src/data/ec2_generation_to_regions.js

import { PricingClient, GetProductsCommand } from "@aws-sdk/client-pricing";

/**
 * Fetches EC2 instance generations and the regions where they are available.
 * Outputs CSV to standard output: generation,region_code,location
 */
async function fetchAndPrintEc2GenerationToRegionsCSV() {
  const client = new PricingClient({ region: "us-east-1" }); // Pricing API is only in us-east-1

  let nextToken = undefined;
  const generationToRegions = {};

  do {
    const command = new GetProductsCommand({
      ServiceCode: "AmazonEC2",
      FormatVersion: "aws_v1",
      NextToken: nextToken,
      MaxResults: 100,
      Filters: [
        { Type: "TERM_MATCH", Field: "operatingSystem", Value: "Linux" },
        { Type: "TERM_MATCH", Field: "preInstalledSw", Value: "NA" },
        { Type: "TERM_MATCH", Field: "tenancy", Value: "Shared" },
        { Type: "TERM_MATCH", Field: "capacitystatus", Value: "Used" },
        { Type: "TERM_MATCH", Field: "locationType", Value: "AWS Region" },
        { Type: "TERM_MATCH", Field: "productFamily", Value: "Compute Instance" }
      ]
    });

    const response = await client.send(command);

    for (const priceItem of response.PriceList) {
      const product = JSON.parse(priceItem).product;
      const instanceType = product.attributes.instanceType;
      const location = product.attributes.location;
      const region = product.attributes.regionCode;

      if (!instanceType || !region || !location) continue;

      // Extract generation (e.g., "m5.large" => "m5")
      const generation = instanceType.split(".")[0];

      if (!generationToRegions[generation]) {
        generationToRegions[generation] = new Set();
      }
      // Use JSON.stringify to ensure uniqueness in the Set
      generationToRegions[generation].add(JSON.stringify({ region, location }));
    }

    nextToken = response.NextToken;
  } while (nextToken);

  // Output CSV header
  console.log("generation,region_code,location");

  // Output each (generation, region_code, location) triple
  for (const [generation, regionLocSet] of Object.entries(generationToRegions)) {
    for (const regionLocStr of regionLocSet) {
      const { region, location } = JSON.parse(regionLocStr);
      // Escape commas in location if needed
      const safeLocation = `"${location.replace(/"/g, '""')}"`;
      console.log(`${generation},${region},${safeLocation}`);
    }
  }
}

fetchAndPrintEc2GenerationToRegionsCSV().catch(err => {
  console.error("Error fetching EC2 generation to regions:", err);
  process.exit(1);
});
