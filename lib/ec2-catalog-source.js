import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {csvParse} from "d3-dsv";

export const DEFAULT_CATALOG_URL = "https://s3.us-east-1.amazonaws.com/data.frankcontrepois.com/FinOpsGuyAwsPricingElaboratedData/ec2-family-catalog.csv";

export function catalogSource() {
  return process.env.EC2_CATALOG_SOURCE || DEFAULT_CATALOG_URL;
}

export async function readCatalogText() {
  const source = catalogSource();
  const text = /^https?:\/\//.test(source)
    ? await fetch(source).then((response) => {
        if (!response.ok) throw new Error(`EC2 catalogue request failed: ${response.status} ${response.statusText}`);
        return response.text();
      })
    : await readFile(resolve(process.cwd(), source), "utf8");
  const rows = csvParse(text);
  if (!rows.length) throw new Error(`EC2 catalogue source returned no rows: ${source}`);
  const required = ["as_of_month", "instance_type", "family", "generation", "processor", "variant", "size", "price_usd_per_hour"];
  const missing = required.filter((name) => !rows.columns.includes(name));
  if (missing.length) throw new Error(`EC2 catalogue is missing columns: ${missing.join(", ")}`);
  return {source, text, rows};
}
