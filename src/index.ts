export {
  default,
  getOptionalOpenWearablesModule,
  type OpenWearablesModule,
} from "./OpenWearablesModule";
export * from "./OpenWearables.types";
export * from "./OpenWearables.helpers";

// Workout-detail enrichment contract (iOS, native SDK >= 0.15.0). Re-exported
// explicitly so the enrichment surface is discoverable at the package boundary
// even though the star export above already carries it.
export type {
  WorkoutDetailEnrichmentStatus,
  WorkoutDetailEnrichmentJobState,
} from "./OpenWearables.types";
