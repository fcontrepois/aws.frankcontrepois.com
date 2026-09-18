import {createCatalogReader} from "../catalog-reader.js";

export const opensearchComparisonService = Object.freeze({
  id: "opensearch",
  name: "Amazon OpenSearch Service",
  shortName: "OpenSearch",
  noun: "search instance",
  pluralNoun: "search instances",
  familyLabel: "instance family",
  priceScope: "On-Demand managed instance list prices in USD",
  sourceNote: "Source: AWS public price-list snapshots. Scope: us-east-1, Amazon OpenSearch Service managed domain instances, On Demand, USD, and hourly usage. Serverless, ingestion, and volume charges are excluded.",
  comparisonNote: "These are public managed domain instance list prices, excluding storage, provisioned IOPS, data transfer, Serverless, ingestion, discounts, commitments, and taxes. A missing exact equivalent stays unavailable; the page never substitutes a different processor, variant, size, or region.",
  equivalenceScope: "processor, variant, size, and region",
  comparisonPolicy: {fixedDimensions: []},
  contextDimensions: [],
  contextDefaults: {},
  readCatalogText: createCatalogReader({id: "opensearch", label: "OpenSearch"})
});
