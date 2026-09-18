import {ec2ComparisonService} from "./services/ec2.js";
import {elasticacheComparisonService} from "./services/elasticache.js";
import {opensearchComparisonService} from "./services/opensearch.js";
import {rdsComparisonService} from "./services/rds.js";

export const instanceComparisonServices = Object.freeze([
  ec2ComparisonService,
  rdsComparisonService,
  elasticacheComparisonService,
  opensearchComparisonService
]);

export function instanceComparisonService(id) {
  const service = instanceComparisonServices.find((candidate) => candidate.id === String(id).toLowerCase());
  if (!service) throw new Error(`Unknown instance comparison service: ${id}`);
  return service;
}
