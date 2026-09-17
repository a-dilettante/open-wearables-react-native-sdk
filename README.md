# Open Wearables React Native SDK

The official React Native SDK for the [Open Wearables](https://github.com/the-momentum/open-wearables) project.

The SDK is built with the [Expo Module API](https://docs.expo.dev/modules/module-api/) enabling install the app in Expo Project as well as in React Native CLI projects.
It is a wrapper for the native iOS and Android SDKs to allow React Native apps to collect and sync health data.

## Platform support

| Platform | Status                                                                        |
| -------- | ----------------------------------------------------------------------------- |
| iOS      | Implemented (via `OpenWearablesHealthSDK` CocoaPod, requires iOS 15.1+)       |
| Android  | Implemented (via Maven Local dependency `com.openwearables.health:sdk:0.11.2`) |

## Migration to 0.2.0

`syncNow()` has been removed from the JS API, following its removal from the native iOS (`0.14.0`)
and Android (`0.11.2`) SDKs. **There is no replacement.** The native SDKs now resume sync
automatically when the app returns to the foreground, so a manual trigger is no longer needed —
delete any `await OpenWearablesHealthSDK.syncNow()` calls.

`resumeSync()` is *not* a drop-in replacement: it only does anything when a resumable sync session
exists, and is unrelated to triggering a fresh sync round.

`getSyncStatus()` is now typed as [`SyncStatus`](#getsyncstatus-syncstatus) instead of
`Record<string, any>`, and gained two fields: `initialExportDone` and `isSyncing`.

`getStoredCredentials()` is now typed as [`StoredCredentials`](#getstoredcredentials-storedcredentials)
instead of `Record<string, any>`, and returns the same eight keys on both platforms.

`resumeSync()` now resolves `false` uniformly when there is nothing to resume. It previously
rejected with `No resumable sync session` on Android while iOS resolved `false`.

## Platform differences

The JS API is identical on both platforms, but two calls cannot behave identically because the
underlying native SDKs differ:

| API | iOS | Android |
| --- | --- | --- |
| `setSyncInterval(minutes)` | **No-op.** The iOS SDK has no sync-interval API; the system schedules background delivery itself. | Honoured, but floored at 15 minutes by WorkManager. |
| `configure(host, customSyncURL)` | `customSyncURL` is **ignored** — the iOS SDK's `configure(host:)` accepts no such parameter, and `getStoredCredentials().customSyncUrl` is therefore always `null`. | Both arguments are honoured and reflected in `getStoredCredentials()`. |

`getAvailableProviders()` returns a single `apple` / "Apple Health" entry on iOS, and the installed
provider(s) (`google`, `samsung`) on Android. Accordingly `setProvider("apple")` resolves `true` on
iOS and any other id resolves `false`.

## Installation

Currently, the SDK is only available locally. You can install it using the following command from the project root folder:

```sh
npm install
```

When we publish the package to npm, we will use the following command (not available yet):

```sh
npm install open-wearables
```

Then, depending if you are using Expo or React Native CLI, follow the instructions below:

### Expo

Expo projects using the Expo Modules API automatically link native dependencies.

After installing the package, simply run your project.

```sh
npx expo run:ios
```

If your project does not yet contain native directories (ios/ and android/), Expo will automatically generate them.

You can also generate them manually using:

```sh
npx expo prebuild
```

### React Native CLI

For bare React Native projects, you must ensure that you have **[installed and configured the expo package](https://docs.expo.dev/bare/installing-expo-modules/)** before continuing.

After installing the package, install the iOS CocoaPods dependencies:

```sh
npx pod-install
```

or manually:

```sh
cd ios && pod install
```

The package declares the native `OpenWearablesHealthSDK` CocoaPod as a
transitive dependency. Applications should depend only on `open-wearables` and
must not add the native CocoaPod or a local iOS SDK checkout directly.

### Android (temporary setup)

The Android implementation currently relies on a local Maven dependency:

```
implementation("com.openwearables.health:sdk:0.11.2")
```

To test the Android integration using `mavenLocal`, please refer to the setup instructions in the example app:

👉 **[example/README.md](./example/README.md)**

## Config Plugin (optional)

You can customize the permission messages displayed to users by configuring the plugin in your app.json or app.config.js.

```json
{
  "expo": {
    "plugins": [
      [
        "open-wearables",
        {
          "healthShareUsage": "Allow $(PRODUCT_NAME) to read your health data.",
          "healthUpdateUsage": "Allow $(PRODUCT_NAME) to write health data."
        }
      ]
    ]
  }
}
```

| **Option**        | **Description**                                              |
| ----------------- | ------------------------------------------------------------ |
| healthShareUsage  | Sets the NSHealthShareUsageDescription value in Info.plist.  |
| healthUpdateUsage | Sets the NSHealthUpdateUsageDescription value in Info.plist. |

## Example app

A minimal Expo application demonstrating how to integrate the SDK.

See the example project:  
👉 **[example/README.md](./example/README.md)**

## Usage

```ts
import OpenWearables from "open-wearables";

// Configure the SDK with your backend host
OpenWearables.configure("https://your-api-host.com");

// Sign in (token-based)
OpenWearables.signIn(userId, accessToken, refreshToken, null);

// Or sign in (API key)
OpenWearables.signIn(userId, null, null, apiKey);

// Request HealthKit authorization
await OpenWearables.requestAuthorization([
  "steps",
  "heartRate",
  "sleep",
]);

// Start background sync
await OpenWearablesHealthSDK.startBackgroundSync();
```

### Optional native-module access

The default export remains the normal API for development and production
builds that include the native SDK. In environments where the native module may
not be linked, such as Expo Go, use the optional accessor before calling SDK
methods:

```ts
import { getOptionalOpenWearablesModule } from "open-wearables";

const openWearables = getOptionalOpenWearablesModule();
if (openWearables) {
  await openWearables.startBackgroundSync(90);
}
```

The accessor returns `null` when the native module is unavailable, so importing
the package alone does not fail in those environments.

## API

### Configuration

#### `configure(host: string): void`

Sets the backend host URL for the SDK.

---

### Auth

#### `signIn(userId, accessToken, refreshToken, apiKey): void`

Signs in a user. `accessToken`, `refreshToken`, and `apiKey` are optional.

#### `signOut(): void`

Signs out the current user.

#### `updateTokens(accessToken: string, refreshToken: string | null): void`

Updates the stored auth tokens.

#### `restoreSession(): string | null`

Attempts to restore a previously saved session. Synchronous — returns the restored user id, or
`null` when there is no session to restore.

#### `isSessionValid(): boolean`

Returns whether the current session is valid.

---

### HealthKit Authorization

#### `requestAuthorization(types: HealthDataType[]): Promise<boolean>`

Requests HealthKit read permissions for the given data types. Returns `true` if the authorization was granted.

See `[HealthDataType](#healthdatatype)` for the full list of supported types.

---

### Sync

#### `startBackgroundSync(syncDaysBack?: number): Promise<boolean>`

Starts background health data sync, optionally limiting how many days back to sync. Resolves `true`
if started successfully, and `false` when it could not start — most commonly because the SDK is not
configured or no user is signed in. It resolves `false` rather than rejecting on both platforms.

> **Widening the range needs `resetAnchors()` first.** Query anchors survive `stopBackgroundSync()`,
> and neither native SDK compares the new `syncDaysBack` against the previous one. After a first
> sync completes, a restart with a larger `syncDaysBack` (or `undefined`) takes the incremental
> path and **will not backfill the newly-included older days** — on iOS because the stored
> `HKQueryAnchor` is a position in HealthKit's global change log, on Android because the incremental
> cursor is `max(storedAnchor, newFloor)`. Narrowing the range needs no reset.
>
> Call [`resetAnchors()`](#resetanchors-void) **while sync is stopped**, then start:
>
> ```ts
> await OpenWearablesHealthSDK.stopBackgroundSync();
> OpenWearablesHealthSDK.resetAnchors();
> await OpenWearablesHealthSDK.startBackgroundSync(30);
> ```
>
> Resetting *after* `startBackgroundSync` also eventually works, but the immediate full export it
> tries to trigger is dropped by the SDKs' "sync already in progress" guard, so the backfill is
> deferred to the next background trigger — and clearing the session and outbox mid-flight can drop
> batches that were pending upload.

#### `stopBackgroundSync(): void`

Stops background sync.

#### `resumeSync(): Promise<boolean>`

Resumes an interrupted sync session, continuing from the records already sent. Resolves `false` when
there is no resumable session (on both platforms — see [Migration to 0.2.0](#migration-to-020)).

Both native SDKs already resume automatically when the app returns to the foreground, so this is a
manual retry rather than the primary mechanism — useful when a resume ran and died again while the
app stayed foregrounded.

Do **not** treat the resolved value as "a sync started": calling it while a round is already in
flight is safe but still resolves `true` having done nothing. Poll `getSyncStatus().isSyncing`
instead. On iOS the promise only settles once the whole round finishes, which can take minutes.

Gate any "resume" affordance on `!isSyncing && hasResumableSession` — `hasResumableSession` stays
`true` for the duration of an active round, so on its own it does not mean sync is stalled.

#### `isSyncActive(): boolean`

Returns whether background sync is currently active.

#### `getSyncStatus(): SyncStatus`

Returns the current sync status. Synchronous — no `await` needed.

| Field | Type | Description |
| --- | --- | --- |
| `hasResumableSession` | `boolean` | Whether an interrupted sync session can be resumed. |
| `sentCount` | `number` | Number of records sent in the current session. |
| `completedTypes` | `number` | How many health data types have finished exporting. |
| `isFullExport` | `boolean` | Whether the current session is a full historical export. |
| `initialExportDone` | `boolean` | `false` while the initial full historical export is still pending or in progress. |
| `isSyncing` | `boolean` | `true` while a sync round is currently in flight. |
| `createdAt` | `string \| null` | ISO8601 timestamp of the current sync session, or `null` when there is none. |

While `initialExportDone === false`, the historical backfill has not finished — prompt the user
to keep the app open so the export can complete.

#### `resetAnchors(): void`

Resets the query anchors, forcing a full re-sync on the next run. Synchronous — no `await` needed.

Two things to know before calling it:

- **The overlapping window is re-uploaded.** The next run re-fetches everything inside the current
  `syncDaysBack` range, including records already sent. There is no client-side dedup — the SDKs
  expect the backend to deduplicate.
- **Call it while sync is stopped.** If sync is still active, `resetAnchors()` immediately kicks off
  a full export using the *currently persisted* `syncDaysBack`, which is only updated inside
  `startBackgroundSync`.

See the note under [`startBackgroundSync`](#startbackgroundsyncsyncdaysback-number-promiseboolean)
for when a reset is required.

#### `getStoredCredentials(): StoredCredentials`

Returns the credentials currently stored by the SDK. Synchronous — no `await` needed.

| Field | Type | Description |
| --- | --- | --- |
| `userId` | `string \| null` | The signed-in user id. |
| `accessToken` | `string \| null` | Stored access token. |
| `refreshToken` | `string \| null` | Stored refresh token. |
| `apiKey` | `string \| null` | Stored API key. |
| `host` | `string \| null` | Backend host passed to `configure()`. |
| `customSyncUrl` | `string \| null` | Custom sync URL. **Always `null` on iOS** — see [Platform differences](#platform-differences). |
| `isSyncActive` | `boolean` | Whether background sync is currently active. |
| `provider` | `string \| null` | `"apple"` on iOS; `"google"` or `"samsung"` on Android; `null` when none is selected. |

---

### Events

Subscribe to native SDK events using the standard Expo module event emitter:

```ts
const subscription = OpenWearables.addListener(
  "onLog",
  ({ message }) => {
    console.log("SDK log:", message);
  }
);

const authSub = OpenWearables.addListener(
  "onAuthError",
  ({ statusCode, message }) => {
    console.error(`Auth error ${statusCode}:`, message);
  }
);

// Clean up
subscription.remove();
authSub.remove();
```

| Event         | Payload                                   | Description                            |
| ------------- | ----------------------------------------- | -------------------------------------- |
| `onLog`       | `{ message: string }`                     | Log messages emitted by the native SDK |
| `onAuthError` | `{ statusCode: number, message: string }` | Authentication errors                  |

---

### Workout-detail enrichment (iOS, native SDK >= 0.15.0)

Captures HealthKit routes, workout-associated samples, and native lap/segment
events on the device and uploads them against the OW workout. Only a
redaction-safe status crosses the bridge — routes, coordinates, and sample
values never reach JavaScript.

| Method                                    | Description                                                |
| ----------------------------------------- | ---------------------------------------------------------- |
| `setWorkoutDetailEnrichmentEnabled(bool)` | Turns enrichment on/off. Disabling deletes staged uploads.  |
| `requestWorkoutDetailAuthorization()`     | HealthKit sheet for workout, workout route, and heart rate. |
| `getWorkoutDetailEnrichmentStatus()`      | Counts, error classes, and progress. No identifiers.        |
| `startWorkoutDetailEnrichmentPass()`      | Runs one pass now. Passes also run automatically.           |

`requestWorkoutDetailAuthorization()` is deliberately separate from
`requestAuthorization(types)`: the core call replaces the SDK's persisted
tracked-type set, so routing an enrichment request through it would silently
reduce the host app's core sync to these three types. Resolving does not mean
access was granted — Apple makes read authorization opaque, so a denied read is
indistinguishable from absent data.

#### Availability — you must probe

These four methods require the native iOS SDK at **>= 0.15.0**, built with the
`OW_WORKOUT_DETAIL_ENRICHMENT` Swift flag. The shipped pod pins `0.13.0` with the
flag **off**, so they are absent from the native module today. They are declared
on the ambient `OpenWearablesModule` class, so TypeScript cannot warn you —
probe at runtime. Calling one unprobed against an older SDK throws.

```ts
import {
  getOptionalOpenWearablesModule,
  type WorkoutDetailEnrichmentStatus,
} from "open-wearables";

const openWearables = getOptionalOpenWearablesModule();

if (typeof openWearables?.getWorkoutDetailEnrichmentStatus === "function") {
  await openWearables.setWorkoutDetailEnrichmentEnabled(true);
  await openWearables.requestWorkoutDetailAuthorization();

  const status: WorkoutDetailEnrichmentStatus =
    await openWearables.getWorkoutDetailEnrichmentStatus();

  console.log(status.historicalProgressPercent, status.routePendingCount);
}
```

`WorkoutDetailEnrichmentStatus` fields: `enabled`, `authorizationRequested`,
`countsByState`, `routePendingCount`, `pendingTombstoneCount`, `errorClasses`,
`historicalProgressPercent`, `historicalComplete`, `stagedUploads`.

#### Consuming this fork

This package is the Circle fork of the upstream wrapper. Its podspec depends on
the Circle fork of the native SDK, `OpenWearablesHealthSDK 0.15.0-circle.2`,
which is not on CocoaPods trunk. A host app therefore pins both from git:

1. `package.json`: `"open-wearables": "git+https://github.com/a-dilettante/open-wearables-react-native-sdk.git#<commit>"`.
2. `ios/Podfile` (or an Expo config plugin that edits it):
   `pod 'OpenWearablesHealthSDK', :git => 'https://github.com/a-dilettante/open_wearables_ios_sdk.git', :tag => '0.15.0-circle.2'`.
3. `cd ios && pod install`, then rebuild the dev client.
4. Confirm the probe above now returns `true`.

---

### HealthDataType

The following health data type identifiers can be passed to `requestAuthorization`:

**Activity & Mobility**
`steps`, `distanceWalkingRunning`, `runningSpeed`, `runningPower`, `runningStrideLength`, `runningVerticalOscillation`, `runningGroundContactTime`, `distanceCycling`, `flightsClimbed`, `walkingSpeed`, `walkingStepLength`, `walkingAsymmetryPercentage`, `walkingDoubleSupportPercentage`, `sixMinuteWalkTestDistance`, `activeEnergy`, `basalEnergy`

**Heart & Cardiovascular**
`heartRate`, `restingHeartRate`, `heartRateVariabilitySDNN`, `vo2Max`, `oxygenSaturation`, `respiratoryRate`

**Body Measurements**
`bodyMass`, `height`, `bmi`, `bodyFatPercentage`, `leanBodyMass`, `waistCircumference`, `bodyTemperature`

**Blood & Metabolic**
`bloodGlucose`, `insulinDelivery`, `bloodPressureSystolic`, `bloodPressureDiastolic`, `bloodPressure`

**Sleep & Mindfulness**
`sleep`, `mindfulSession`

**Reproductive Health**
`menstrualFlow`, `cervicalMucusQuality`, `ovulationTestResult`, `sexualActivity`

**Nutrition**
`dietaryEnergyConsumed`, `dietaryCarbohydrates`, `dietaryProtein`, `dietaryFatTotal`, `dietaryWater`

**Workout**
`workout`

**Aliases**
`restingEnergy`, `bloodOxygen`
