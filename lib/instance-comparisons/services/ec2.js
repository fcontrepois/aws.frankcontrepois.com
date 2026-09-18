import {readCatalogText} from "../../ec2-catalog-source.js";

export const ec2ComparisonService = Object.freeze({
  id: "ec2",
  name: "Amazon EC2",
  shortName: "EC2",
  noun: "instance",
  pluralNoun: "instances",
  familyLabel: "family",
  priceScope: "Linux On-Demand list prices in USD",
  sourceNote: "Source: AWS public price-list snapshots. Scope: us-east-1, Linux, Shared tenancy, On Demand, no pre-installed software, USD, hourly usage.",
  comparisonNote: "These are public list prices, excluding discounts, commitments, Spot, taxes, and software. A missing exact equivalent stays unavailable; the page never substitutes a different processor, variant, size, or region. Price per vCPU or GiB is not a performance benchmark.",
  equivalenceScope: "processor, variant, size, and region",
  comparisonPolicy: {
    fixedDimensions: []
  },
  contextDimensions: [],
  contextDefaults: {},
  readCatalogText
});
