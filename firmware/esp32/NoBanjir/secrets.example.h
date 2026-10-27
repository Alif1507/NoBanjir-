#pragma once

// Copy this file to secrets.h beside NoBanjir.ino, then fill every value.
// The real secrets.h is ignored by Git; never share or commit it.
namespace credentials {
constexpr bool kUploadEnabled = false;  // Set true only after configuring all fields.
constexpr const char* kWifiSsid = "";    // ESP32-WROOM-32 requires 2.4 GHz Wi-Fi.
constexpr const char* kWifiPassword = "";
constexpr const char* kDeviceCode = "YOUR-REGISTERED-DEVICE-CODE";
constexpr const char* kIngestUrl = "https://YOUR-DEPLOYED-DOMAIN/api/iot/readings";
constexpr const char* kDeviceToken = "YOUR_DEVICE_TOKEN";  // Per-device token, never a Supabase key.
// Paste the complete trusted ROOT CA PEM for the HTTPS certificate on your app domain.
// Get it from the certificate authority's official source. Never use setInsecure().
constexpr const char* kRootCa = R"PEM(
-----BEGIN CERTIFICATE-----
REPLACE_WITH_THE_COMPLETE_TRUSTED_ROOT_CA_PEM
-----END CERTIFICATE-----
)PEM";
}  // namespace credentials
