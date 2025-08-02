// src/data/ec2_generation_to_regions.js

import { PricingClient, GetProductsCommand } from "@aws-sdk/client-pricing";

/**
 * Fetches EC2 instance generations and the regions where they are available.
 * Outputs CSV to standard output: generation,region
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
        { Type: "TERM_MATCH", Field: "productFamily", Value: "Compute Instance" }
      ]
    });

    const response = await client.send(command);

    for (const priceItem of response.PriceList) {
      const product = JSON.parse(priceItem).product;
      const instanceType = product.attributes.instanceType;
      const region = product.attributes.location;

      if (!instanceType || !region) continue;

      // Extract generation (e.g., "m5.large" => "m5")
      const generation = instanceType.split(".")[0];

      if (!generationToRegions[generation]) {
        generationToRegions[generation] = new Set();
      }
      generationToRegions[generation].add(region);
    }

    nextToken = response.NextToken;
  } while (nextToken);

  // Output CSV header
  console.log("generation,region");

  // Output each (generation, region) pair
  for (const [generation, regions] of Object.entries(generationToRegions)) {
    for (const region of regions) {
      // Escape commas if needed (not needed here, but good practice)
      console.log(`${generation},${region}`);
    }
  }
}

fetchAndPrintEc2GenerationToRegionsCSV().catch(err => {
  console.error("Error fetching EC2 generation to regions:", err);
  process.exit(1);
});

