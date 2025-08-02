// src/data/region_to_service.js

import { SSMClient, GetParametersByPathCommand } from "@aws-sdk/client-ssm";

// Helper to get all region codes from SSM
async function getAllRegionCodes(ssm) {
  const regionCodes = [];
  let nextToken;
  do {
    const resp = await ssm.send(new GetParametersByPathCommand({
      Path: "/aws/service/global-infrastructure/regions",
      Recursive: false,
      WithDecryption: false,
      NextToken: nextToken,
      MaxResults: 10
    }));
    for (const param of resp.Parameters) {
      const match = param.Name.match(/\/regions\/([^/]+)$/);
      if (match) regionCodes.push(match[1]);
    }
    nextToken = resp.NextToken;
  } while (nextToken);
  return regionCodes;
}

// Helper to get all services for a region from SSM
async function getServicesForRegion(ssm, regionCode) {
  const services = [];
  let nextToken;
  do {
    const resp = await ssm.send(new GetParametersByPathCommand({
      Path: `/aws/service/global-infrastructure/regions/${regionCode}/services`,
      Recursive: false,
      WithDecryption: false,
      NextToken: nextToken,
      MaxResults: 10
    }));
    for (const param of resp.Parameters) {
      const match = param.Name.match(/\/services\/([^/]+)$/);
      if (match) services.push(match[1]);
    }
    nextToken = resp.NextToken;
  } while (nextToken);
  return services;
}

async function main() {
  const ssm = new SSMClient({ region: "us-east-1" });

  try {
    const regionCodes = await getAllRegionCodes(ssm);

    if (!regionCodes.length) {
      console.error("No regions found.");
      process.exit(2);
    }

    // Print CSV header
    console.log("regioncode,service");

    for (const regionCode of regionCodes) {
      const services = await getServicesForRegion(ssm, regionCode);
      for (const service of services) {
        console.log(`${regionCode},${service}`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();

