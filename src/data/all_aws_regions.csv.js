// src/data/fetch_all_aws_regions_with_longname.js

import { EC2Client, DescribeRegionsCommand } from "@aws-sdk/client-ec2";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

// Helper to get the long name for a region from SSM
async function getRegionLongName(ssm, regionCode) {
  try {
    const paramName = `/aws/service/global-infrastructure/regions/${regionCode}/longName`;
    const resp = await ssm.send(new GetParameterCommand({ Name: paramName }));
    return resp.Parameter?.Value || "";
  } catch (err) {
    // If not found, just return empty string
    return "";
  }
}

async function fetchAndPrintAwsRegionsCSV() {
  const ec2 = new EC2Client({ region: "us-east-1" });
  const ssm = new SSMClient({ region: "us-east-1" });

  try {
    const command = new DescribeRegionsCommand({ AllRegions: true });
    const response = await ec2.send(command);

    if (!response.Regions || response.Regions.length === 0) {
      console.error("No regions found.");
      process.exit(2);
    }

    // Get all possible keys from the Regions array
    const allKeys = Array.from(
      new Set(response.Regions.flatMap(region => Object.keys(region)))
    );

    // Remove OptInStatus if present, so we can add it last
    const optInIndex = allKeys.indexOf("OptInStatus");
    if (optInIndex !== -1) allKeys.splice(optInIndex, 1);

    // Add LongName just before OptInStatus, then OptInStatus last
    allKeys.push("LongName", "OptInStatus");

    // Output CSV header
    console.log(allKeys.join(","));

    // For each region, fetch the long name and print the row
    for (const region of response.Regions) {
      const regionCode = region.RegionName;
      const longName = await getRegionLongName(ssm, regionCode);

      const row = allKeys.map(key => {
        if (key === "LongName") return longName;
        if (key === "OptInStatus") return region.OptInStatus ?? "";
        let value = region[key];
        if (typeof value === "object" && value !== null) value = JSON.stringify(value);
        if (typeof value === "string" && value.includes(",")) value = `"${value}"`;
        return value ?? "";
      });
      console.log(row.join(","));
    }
    process.exit(0);
  } catch (err) {
    console.error("Error fetching AWS regions:", err);
    process.exit(1);
  }
}

fetchAndPrintAwsRegionsCSV();

