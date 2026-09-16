import {readRdsCatalogText} from "../../rds-catalog-source.js";

const contextDimensions = Object.freeze([
  {field: "database_engine", label: "Engine"},
  {field: "database_edition", label: "Edition"},
  {field: "license_model", label: "License"},
  {field: "deployment_option", label: "Deployment"},
  {field: "storage_mode", label: "Storage mode"},
  {field: "operation", label: "AWS pricing code"}
]);

export const rdsComparisonService = Object.freeze({
  id: "rds",
  name: "Amazon RDS",
  shortName: "RDS",
  noun: "DB instance",
  pluralNoun: "DB instances",
  familyLabel: "instance family",
  priceScope: "On-Demand DB instance list prices in USD",
  sourceNote: "Source: AWS public price-list snapshots transformed by the sibling FinOpsGuyCloudFormationRepository. Scope: us-east-1, database instances, On Demand, USD, and hourly usage. Engine, edition, licensing, deployment, storage mode, and the AWS pricing operation remain explicit dimensions.",
  comparisonNote: "These are public DB instance list prices, excluding storage, I/O, backups, data transfer, discounts, commitments, taxes, and other charges. A missing exact equivalent stays unavailable; the page never crosses database engine, edition, licence, deployment, storage mode, AWS pricing code, size, or region.",
  equivalenceScope: "processor, variant, size, database configuration, and region",
  comparisonPolicy: {
    fixedDimensions: contextDimensions.map(({field}) => field)
  },
  contextDimensions,
  contextDefaults: {
    database_engine: "PostgreSQL",
    database_edition: "Standard",
    license_model: "No license required",
    deployment_option: "Single-AZ",
    storage_mode: "Standard"
  },
  readCatalogText: readRdsCatalogText
});
