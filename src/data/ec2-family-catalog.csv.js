import {readCatalogText} from "../../lib/ec2-catalog-source.js";

const {source, text, rows} = await readCatalogText();
console.error(`Loaded ${rows.length} EC2 family catalogue rows from ${source}`);
process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
