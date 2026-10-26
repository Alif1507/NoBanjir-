#pragma once

#include <stdint.h>

namespace config {
constexpr uint8_t kTrigPin = 18;
constexpr uint8_t kEchoPin = 19;
constexpr uint8_t kRainPin = 27;
constexpr bool kRainActiveLow = true;  // Verify with a wet/dry plate.
constexpr bool kFloatEnabled = false;
constexpr uint8_t kFloatPin = 26;
constexpr bool kFloatActiveLow = true;

// Starting values only: check the installed JSN revision and mounting geometry.
constexpr double kMinDistanceCm = 25.0;
constexpr double kMaxDistanceCm = 450.0;
constexpr uint32_t kEchoTimeoutUs = 30000;
constexpr uint32_t kPingSpacingMs = 75;
constexpr uint32_t kSampleIntervalMs = 5000;
constexpr uint32_t kUploadIntervalMs = 15000;
constexpr uint32_t kMaxSampleAgeMs = 10000;
constexpr uint32_t kRainDebounceMs = 150;
constexpr uint32_t kFloatDebounceMs = 100;
constexpr uint32_t kWifiConnectTimeoutMs = 10000;
constexpr uint32_t kRetryBaseMs = 1000;
constexpr uint32_t kRetryMaxMs = 60000;
constexpr uint32_t kHttpTimeoutMs = 4000;
constexpr uint32_t kTlsHandshakeTimeoutSeconds = 5;
constexpr const char* kNtpServer1 = "pool.ntp.org";
constexpr const char* kNtpServer2 = "time.google.com";
}  // namespace config

// Copy secrets.example.h to secrets.h in this sketch folder to enable uploads.
#if __has_include("secrets.h")
#include "secrets.h"
#else
namespace credentials {
constexpr bool kUploadEnabled = false;
constexpr const char* kWifiSsid = "";
constexpr const char* kWifiPassword = "";
constexpr const char* kDeviceCode = "ESP32-NB-001";
constexpr const char* kIngestUrl = "";
constexpr const char* kDeviceToken = "";
constexpr const char* kRootCa = "";
}  // namespace credentials
#endif
