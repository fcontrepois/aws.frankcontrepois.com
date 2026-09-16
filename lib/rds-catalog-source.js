import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {csvParse} from "d3-dsv";

export const DEFAULT_RDS_CATALOG_URL = "https://s3.us-east-1.amazonaws.com/data.frankcontrepois.com/FinOpsGuyAwsPricingElaboratedData/rds-family-catalog.csv";

export function rdsCatalogSource() {
  return process.env.RDS_CATALOG_SOURCE || DEFAULT_RDS_CATALOG_URL;
}

export async function readRdsCatalogText() {
  const source = rdsCatalogSource();
  const text = /^https?:\/\//.test(source)
    ? await fetch(source).then((response) => {
        if (!response.ok) throw new Error(`RDS catalogue request failed: ${response.status} ${response.statusText}`);
        return response.text();
      })
    : await readFile(resolve(process.cwd(), source), "utf8");
  const rows = csvParse(text);
  if (!rows.length) throw new Error(`RDS catalogue source returned no rows: ${source}`);
  const required = [
    "as_of_month", "catalog_key", "instance_type", "family", "generation", "processor",
    "variant", "size", "price_usd_per_hour", "database_engine", "database_edition",
    "license_model", "deployment_option", "storage_mode", "operation"
  ];
  const missing = required.filter((name) => !rows.columns.includes(name));
  if (missing.length) throw new Error(`RDS catalogue is missing columns: ${missing.join(", ")}`);
  return {source, text, rows};
}
