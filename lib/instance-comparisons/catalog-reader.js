import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {csvParse} from "d3-dsv";

const commonRequired = [
  "as_of_month", "catalog_key", "instance_type", "family", "generation", "processor",
  "variant", "size", "price_usd_per_hour"
];

export function createCatalogReader({id, label, required = []}) {
  const defaultUrl = `https://s3.us-east-1.amazonaws.com/data.frankcontrepois.com/FinOpsGuyAwsPricingElaboratedData/${id}-family-catalog.csv`;
  const environmentVariable = `${id.toUpperCase()}_CATALOG_SOURCE`;
  return async function readCatalogText() {
    const source = process.env[environmentVariable] || defaultUrl;
    const text = /^https?:\/\//.test(source)
      ? await fetch(source).then((response) => {
          if (!response.ok) throw new Error(`${label} catalogue request failed: ${response.status} ${response.statusText}`);
          return response.text();
        })
      : await readFile(resolve(process.cwd(), source), "utf8");
    const rows = csvParse(text);
    if (!rows.length) throw new Error(`${label} catalogue source returned no rows: ${source}`);
    const missing = [...commonRequired, ...required].filter((name) => !rows.columns.includes(name));
    if (missing.length) throw new Error(`${label} catalogue is missing columns: ${missing.join(", ")}`);
    return {source, text, rows};
  };
}
