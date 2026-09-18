import {createCatalogReader} from "../catalog-reader.js";

const contextDimensions = Object.freeze([
  {field: "cache_engine", label: "Engine"}
]);

export const elasticacheComparisonService = Object.freeze({
  id: "elasticache",
  name: "Amazon ElastiCache",
  shortName: "ElastiCache",
  noun: "cache node",
  pluralNoun: "cache nodes",
  familyLabel: "node family",
  priceScope: "On-Demand cache node list prices in USD",
  sourceNote: "Source: AWS public price-list snapshots. Scope: us-east-1, standard cache node-hours, On Demand, USD. Redis, Valkey, and Memcached remain separate pricing contexts; Extended Support, Outpost, durability add-ons, and Serverless are excluded.",
  comparisonNote: "These are public cache node list prices, excluding data transfer, backups, Extended Support, Outpost, durability add-ons, Serverless, discounts, commitments, and taxes. A missing exact equivalent stays unavailable; the page never crosses engine, processor, variant, size, or region.",
  equivalenceScope: "engine, processor, variant, size, and region",
  comparisonPolicy: {fixedDimensions: ["cache_engine"]},
  contextDimensions,
  contextDefaults: {cache_engine: "Valkey"},
  readCatalogText: createCatalogReader({id: "elasticache", label: "ElastiCache", required: ["cache_engine"]})
});
