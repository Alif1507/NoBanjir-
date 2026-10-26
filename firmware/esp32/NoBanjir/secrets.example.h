#pragma once

// LOCAL FILE: copy to secrets.h beside NoBanjir.ino. Never commit secrets.h.
namespace credentials {
constexpr bool kUploadEnabled = false;  // Set true only after configuring all fields.
constexpr const char* kWifiSsid = "";    // ESP32-WROOM-32 requires 2.4 GHz Wi-Fi.
constexpr const char* kWifiPassword = "";
constexpr const char* kDeviceCode = "ESP32-NB-001";
constexpr const char* kIngestUrl = "https://YOUR-HOST/api/iot/readings";
constexpr const char* kDeviceToken = "";  // Per-device token, never a Supabase key.
// Obtain the root CA PEM from the trusted certificate authority for YOUR host.
// Do not paste a random certificate or disable certificate verification.
constexpr const char* kRootCa = R"PEM(
-----BEGIN CERTIFICATE-----
REPLACE_WITH_THE_COMPLETE_TRUSTED_ROOT_CA_PEM
-----END CERTIFICATE-----
)PEM";
}  // namespace credentials
