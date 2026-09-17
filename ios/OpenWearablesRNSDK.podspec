require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'OpenWearablesRNSDK'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '15.1',
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/the-momentum/open-wearables-react-native-sdk' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'OpenWearablesHealthSDK', '0.15.0-circle.2'

  # Swift/Objective-C compatibility. OTHER_SWIFT_FLAGS compiles the enrichment
  # bridges in ios/OpenWearablesModule.swift (`#if OW_WORKOUT_DETAIL_ENRICHMENT`);
  # the Circle-fork native dependency above (0.15.0-circle.2, published only as a
  # git tag on a-dilettante/open_wearables_ios_sdk — host apps pin it with a
  # `pod 'OpenWearablesHealthSDK', :git => ..., :tag => ...` Podfile entry) and
  # this flag must move together — either one alone is a broken build. Verify
  # from JS after `pod install`: the probe
  # `typeof m.getWorkoutDetailEnrichmentStatus === 'function'` must flip to true.
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'OTHER_SWIFT_FLAGS' => '$(inherited) -DOW_WORKOUT_DETAIL_ENRICHMENT',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
