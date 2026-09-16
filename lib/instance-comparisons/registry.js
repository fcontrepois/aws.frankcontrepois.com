import {ec2ComparisonService} from "./services/ec2.js";
import {rdsComparisonService} from "./services/rds.js";

export const instanceComparisonServices = Object.freeze([
  ec2ComparisonService,
  rdsComparisonService
]);

export function instanceComparisonService(id) {
  const service = instanceComparisonServices.find((candidate) => candidate.id === String(id).toLowerCase());
  if (!service) throw new Error(`Unknown instance comparison service: ${id}`);
  return service;
}
