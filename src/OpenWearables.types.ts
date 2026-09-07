export type OpenWearablesModuleEvents = {
  onLog: (params: LogEventPayload) => void;
  onAuthError: (params: AuthErrorEventPayload) => void;
};

export type LogEventPayload = {
  message: string;
};

export type AuthErrorEventPayload = {
  statusCode: number;
  message: string;
};

export enum OWLogLevel {
  None = 0,
  Always = 1,
  Debug = 2,
}

export enum HealthDataType {
  // Activity & Mobility
  Steps = "steps",
  DistanceWalkingRunning = "distanceWalkingRunning",
  RunningSpeed = "runningSpeed",
  RunningPower = "runningPower",
  RunningStrideLength = "runningStrideLength",
  RunningVerticalOscillation = "runningVerticalOscillation",
  RunningGroundContactTime = "runningGroundContactTime",
  DistanceCycling = "distanceCycling",
  FlightsClimbed = "flightsClimbed",
  WalkingSpeed = "walkingSpeed",
  WalkingStepLength = "walkingStepLength",
  WalkingAsymmetryPercentage = "walkingAsymmetryPercentage",
  WalkingDoubleSupportPercentage = "walkingDoubleSupportPercentage",
  SixMinuteWalkTestDistance = "sixMinuteWalkTestDistance",
  ActiveEnergy = "activeEnergy",
  BasalEnergy = "basalEnergy",

  // Heart & Cardiovascular
  HeartRate = "heartRate",
  RestingHeartRate = "restingHeartRate",
  HeartRateVariabilitySDNN = "heartRateVariabilitySDNN",
  Vo2Max = "vo2Max",
  OxygenSaturation = "oxygenSaturation",
  RespiratoryRate = "respiratoryRate",

  // Body Measurements
  BodyMass = "bodyMass",
  Height = "height",
  Bmi = "bmi",
  BodyFatPercentage = "bodyFatPercentage",
  LeanBodyMass = "leanBodyMass",
  WaistCircumference = "waistCircumference",
  BodyTemperature = "bodyTemperature",

  // Blood & Metabolic
  BloodGlucose = "bloodGlucose",
  InsulinDelivery = "insulinDelivery",
  BloodPressureSystolic = "bloodPressureSystolic",
  BloodPressureDiastolic = "bloodPressureDiastolic",
  BloodPressure = "bloodPressure",

  // Sleep & Mindfulness
  Sleep = "sleep",
  MindfulSession = "mindfulSession",

  // Reproductive Health
  MenstrualFlow = "menstrualFlow",
  CervicalMucusQuality = "cervicalMucusQuality",
  OvulationTestResult = "ovulationTestResult",
  SexualActivity = "sexualActivity",

  // Nutrition
  DietaryEnergyConsumed = "dietaryEnergyConsumed",
  DietaryCarbohydrates = "dietaryCarbohydrates",
  DietaryProtein = "dietaryProtein",
  DietaryFatTotal = "dietaryFatTotal",
  DietaryWater = "dietaryWater",

  // Workout
  Workout = "workout",

  // Aliases
  RestingEnergy = "restingEnergy",
  BloodOxygen = "bloodOxygen",
}

export type HealthDataProvider = {
  id: string;
  displayName: string;
  isAvailable: boolean;
};

export type StoredCredentials = {
  userId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  apiKey: string | null;
  host: string | null;
  /** Always null on iOS — the native SDK exposes no accessor for it yet. */
  customSyncUrl: string | null;
  isSyncActive: boolean;
  /** `"apple"` on iOS; `"google"` or `"samsung"` on Android; null when none is selected. */
  provider: string | null;
};

export type SyncStatus = {
  hasResumableSession: boolean;
  sentCount: number;
  completedTypes: number;
  isFullExport: boolean;
  /** False while the initial full historical export is still pending or in progress. */
  initialExportDone: boolean;
  /** True while a sync round is currently in flight. */
  isSyncing: boolean;
  /** ISO8601 timestamp of the current sync session, or null when there is none. */
  createdAt: string | null;
};

// ---------------------------------------------------------------------------
// Workout-detail enrichment (iOS, native SDK >= 0.15.0)
// ---------------------------------------------------------------------------

/**
 * Where one workout sits in the native enrichment pipeline.
 *
 * These are the raw values of the native `EnrichmentJobState` enum and are the
 * only keys that can appear in {@link WorkoutDetailEnrichmentStatus.countsByState}.
 *
 * `published` and `noop` are reachable only from a terminal publication receipt —
 * HTTP acceptance of an upload never advances a job to a terminal state.
 */
export type WorkoutDetailEnrichmentJobState =
  | "pending"
  | "collecting"
  | "uploading"
  | "awaiting_receipt"
  | "published"
  | "noop"
  | "failed_permanent"
  | "deferred";

/**
 * Redaction-safe status of the native workout-detail enrichment pipeline.
 *
 * Mirrors the dictionary returned by the native
 * `getWorkoutDetailEnrichmentStatus()`. It carries counts, error classes, and
 * progress only — no workout identifier, no coordinate, no sample value, and no
 * file name — so it is safe to log, display, or forward to JavaScript. Raw route
 * and sample data never cross this bridge.
 *
 * Only available when the linked native iOS SDK is >= 0.15.0.
 */
export interface WorkoutDetailEnrichmentStatus {
  /** Whether enrichment is switched on for the signed-in user. */
  enabled: boolean;
  /** Whether the HealthKit enrichment authorization sheet has been requested. */
  authorizationRequested: boolean;
  /** Number of jobs per pipeline state. States with no jobs are absent. */
  countsByState: Partial<Record<WorkoutDetailEnrichmentJobState, number>>;
  /** Published workouts whose route has still not arrived (reconciliation queue). */
  routePendingCount: number;
  /** Locally recorded deletions not yet acknowledged upstream. */
  pendingTombstoneCount: number;
  /** Distinct low-cardinality error classes currently recorded, sorted. */
  errorClasses: string[];
  /** Historical backfill progress, 0-100. */
  historicalProgressPercent: number;
  /** Whether the historical backfill reached its earliest boundary. */
  historicalComplete: boolean;
  /** Chunk files currently staged in the native enrichment outbox. */
  stagedUploads: number;
}
