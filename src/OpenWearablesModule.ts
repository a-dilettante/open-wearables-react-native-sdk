import { NativeModule, requireOptionalNativeModule } from "expo-modules-core";
import {
  HealthDataType,
  OpenWearablesModuleEvents,
  HealthDataProvider,
  OWLogLevel,
  WorkoutDetailEnrichmentStatus,
} from "./OpenWearables.types";

export declare class OpenWearablesModule extends NativeModule<OpenWearablesModuleEvents> {
  // MARK: - Configure
  configure(host: string, customSyncURL?: string): void;

  // MARK: - Auth
  signIn(
    userId: string,
    accessToken: string | null,
    refreshToken: string | null,
    apiKey: string | null
  ): Promise<void>;
  signOut(): Promise<void>;
  updateTokens(accessToken: string, refreshToken: string): void;
  restoreSession(): string;
  isSessionValid(): boolean;

  // MARK: - HealthKit Authorization
  requestAuthorization(types: HealthDataType[]): Promise<boolean>;

  // MARK: - Sync
  setSyncInterval(minutes: number): void;
  startBackgroundSync(syncDaysBack: number | null): Promise<boolean>;
  stopBackgroundSync(): Promise<void>;
  syncNow(): Promise<void>;
  isSyncActive(): boolean;
  getSyncStatus(): Record<string, any>;
  resumeSync(): Promise<boolean>;
  resetAnchors(): void;
  getStoredCredentials(): Record<string, any | null>;

  // MARK: - Providers
  getAvailableProviders(): HealthDataProvider[];
  setProvider(providerId: string): boolean;

  // MARK: - Logs
  setLogLevel(logLevel: OWLogLevel): void;
  getLogLevel(): OWLogLevel;

  // MARK: - Workout-detail enrichment (iOS)
  //
  // These four methods exist ONLY when the linked native iOS SDK is >= 0.15.0
  // and the pod was built with the `OW_WORKOUT_DETAIL_ENRICHMENT` Swift flag.
  // They are absent on every currently released build. Because this is an
  // ambient `declare class`, TypeScript cannot tell you they are missing —
  // callers MUST probe at runtime before calling, e.g.
  //
  //   const m = getOptionalOpenWearablesModule();
  //   if (typeof m?.getWorkoutDetailEnrichmentStatus === "function") { ... }
  //
  // Calling one unprobed against an older native SDK throws.

  /**
   * Turn workout-detail enrichment on or off for the signed-in user.
   *
   * Enabling requests nothing by itself — call
   * {@link requestWorkoutDetailAuthorization} when the app is ready to show the
   * HealthKit sheet. Disabling stops all passes and deletes staged upload files.
   * The checkpoint is kept, so re-enabling resumes rather than re-uploading.
   *
   * Requires native SDK >= 0.15.0; probe for availability before calling.
   */
  setWorkoutDetailEnrichmentEnabled(enabled: boolean): Promise<void>;

  /**
   * Request HealthKit read access for workout, workout route, and heart rate.
   *
   * Separate from {@link requestAuthorization}: routing an enrichment request
   * through the core call would replace the SDK's persisted tracked-type set and
   * silently reduce the host app's core sync to these three types.
   *
   * Resolving does not mean access was granted. Apple makes read authorization
   * opaque, so a denied read is indistinguishable from absent data.
   *
   * Requires native SDK >= 0.15.0; probe for availability before calling.
   */
  requestWorkoutDetailAuthorization(): Promise<void>;

  /**
   * Read the redaction-safe enrichment status: counts, error classes, progress.
   *
   * Contains no workout identifier, coordinate, sample value, or file name, so
   * it is safe to log or display. Raw route and sample data never cross this
   * bridge.
   *
   * Requires native SDK >= 0.15.0; probe for availability before calling.
   */
  getWorkoutDetailEnrichmentStatus(): Promise<WorkoutDetailEnrichmentStatus>;

  /**
   * Run one enrichment pass now, if one is not already running and core sync is
   * idle. Automatic passes also run after each sync round, on foreground, and on
   * workout observer wakes, so calling this is an optimisation, not a
   * requirement.
   *
   * Requires native SDK >= 0.15.0; probe for availability before calling.
   */
  startWorkoutDetailEnrichmentPass(): Promise<void>;
}

const optionalOpenWearablesModule =
  requireOptionalNativeModule<OpenWearablesModule>(
    "OpenWearablesHealthSDK"
  );

/**
 * Returns the linked Open Wearables native module, or `null` when it is not
 * available (for example, in Expo Go).
 */
export function getOptionalOpenWearablesModule(): OpenWearablesModule | null {
  return optionalOpenWearablesModule;
}

// Preserve the package's existing default-export contract for native builds.
// Call getOptionalOpenWearablesModule() when the native module may be absent.
export default optionalOpenWearablesModule as OpenWearablesModule;
