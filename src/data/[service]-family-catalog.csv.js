import {parseArgs} from "node:util";
import {instanceComparisonService} from "../../lib/instance-comparisons/registry.js";

const {values: {service: serviceId}} = parseArgs({
  options: {service: {type: "string"}}
});
const service = instanceComparisonService(serviceId);
const {source, text, rows} = await service.readCatalogText();
console.error(`Loaded ${rows.length} ${service.shortName} family catalogue rows from ${source}`);
process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
