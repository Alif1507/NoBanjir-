#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <time.h>
#include <string.h>

#include "device_config.h"
#include "firmware.h"
#include "telemetry_core.h"
#include "prototype_preview.h"

using namespace nobanjir;

namespace {
SnapshotMailbox mailbox;
portMUX_TYPE snapshotMux = portMUX_INITIALIZER_UNLOCKED;
DebouncedInput rain(config::kRainDebounceMs);
DebouncedInput critical(config::kFloatDebounceMs);
uint32_t lastCycleMs = 0;
uint32_t lastPingMs = 0;
double pings[5] = {};
size_t pingCount = 0;
bool measuring = false;
constexpr PrototypeCalibration prototypeCalibration{
  config::kPrototypeSensorToZeroCm, config::kPrototypeMaxWaterHeightCm,
  config::kPrototypeWaspadaMinCm, config::kPrototypeSiagaMinCm, config::kPrototypeBahayaMinCm
};

bool clockValid(time_t epoch) {
  // A broad sanity range, not a substitute for SNTP or certificate validation.
  return epoch >= 1767225600LL && epoch < 4102444800LL;
}

void publish(Distance distance, bool criticalEvent) {
  const uint32_t now = millis();
  const time_t epoch = time(nullptr);
  const Reading reading{distance, {rain.known(), rain.active()},
                        {config::kFloatEnabled && critical.known(), critical.active()}};
  portENTER_CRITICAL(&snapshotMux);
  mailbox.publish(reading, now, clockValid(epoch) ? epoch : 0, criticalEvent);
  portEXIT_CRITICAL(&snapshotMux);

  char timestamp[21] = {};
  struct tm utc{};
  const char* measuredAt = nullptr;
  if (clockValid(epoch) && gmtime_r(&epoch, &utc) &&
      strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &utc)) {
    measuredAt = timestamp;
  }
  const auto payload = buildPayload(reading, credentials::kDeviceCode, measuredAt);
  if (config::kRainDebugEnabled) {
    const int rawRain = digitalRead(config::kRainPin);
    Serial.printf("[rain] gpio=%u raw=%s active_low=%s debounced=%s\n",
                  static_cast<unsigned>(config::kRainPin), rawRain == LOW ? "LOW" : "HIGH",
                  config::kRainActiveLow ? "true" : "false",
                  !reading.rain.known ? "UNKNOWN" : reading.rain.value ? "WET" : "DRY");
  }
  // This is an actual local sensor observation; it does not imply backend receipt.
  if (payload.ok) Serial.printf("[sensor] %s\n", payload.text);
  else Serial.println("[sensor] invalid device identity; payload not generated");
  if (config::kPrototypeSerialPreviewEnabled) {
    const auto preview = previewPrototypeWater(distance, prototypeCalibration);
    if (preview.valid) {
      Serial.printf("[prototype] source=LOCAL_PREVIEW distance_cm=%.1f water_height_cm=%.1f level=%s\n",
                    distance.cm, preview.waterHeightCm, prototypeLevelName(preview.level));
    } else {
      Serial.println("[prototype] source=LOCAL_PREVIEW water_height_cm=null level=UNKNOWN reason=INVALID_OR_OUTSIDE_CONTAINER");
    }
  }
}

Snapshot copySnapshot(uint32_t now) {
  portENTER_CRITICAL(&snapshotMux);
  const Snapshot result = mailbox.next(now, config::kMaxSampleAgeMs);
  portEXIT_CRITICAL(&snapshotMux);
  return result;
}

double pingDistance() {
  digitalWrite(config::kTrigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(config::kTrigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(config::kTrigPin, LOW);
  const unsigned long duration = pulseIn(config::kEchoPin, HIGH, config::kEchoTimeoutUs);
  return duration ? duration * 0.0343 / 2.0 : -1.0;
}

bool networkConfigured() {
  if (!credentials::kUploadEnabled) return false;
  const size_t identityLength = strlen(credentials::kDeviceCode);
  if (!credentials::kWifiSsid[0] || !credentials::kDeviceToken[0] ||
      identityLength == 0 || identityLength > 64 ||
      strncmp(credentials::kIngestUrl, "https://", 8) != 0 ||
      strlen(credentials::kIngestUrl) <= 8 ||
      !strstr(credentials::kRootCa, "-----BEGIN CERTIFICATE-----") ||
      strstr(credentials::kRootCa, "REPLACE_")) return false;
  for (const char* p = credentials::kDeviceToken; *p; ++p) {
    if (static_cast<unsigned char>(*p) <= 32 || static_cast<unsigned char>(*p) >= 127)
      return false;
  }
  for (const char* p = credentials::kIngestUrl; *p; ++p) {
    if (static_cast<unsigned char>(*p) <= 32 || *p == '@' || *p == '#') return false;
  }
  return true;
}

// This task alone owns the Wi-Fi and TLS objects. Sensor acquisition continues
// on the Arduino loop task while connection/handshake/read operations block here.
void networkTask(void*) {
  WiFi.mode(WIFI_STA);
  WiFi.persistent(false);
  WiFi.setAutoReconnect(false);
  RetrySchedule wifiRetry(config::kRetryBaseMs, config::kRetryMaxMs);
  RetrySchedule uploadRetry(config::kRetryBaseMs, config::kRetryMaxMs);
  bool connecting = false;
  bool wasConnected = false;
  bool retryingUpload = false;
  bool ntpStarted = false;
  uint32_t connectionStartedMs = 0;
  uint32_t lastCriticalAttempt = 0;
  uint32_t lastClockLogMs = 0;

  for (;;) {
    vTaskDelay(pdMS_TO_TICKS(50));
    const uint32_t now = millis();
    if (WiFi.status() != WL_CONNECTED) {
      if (wasConnected) {
        Serial.println("[wifi] disconnected; sampling continues");
        wasConnected = false;
        connecting = false;
        wifiRetry.fail(now);
      }
      if (connecting && uint32_t(now - connectionStartedMs) >= config::kWifiConnectTimeoutMs) {
        WiFi.disconnect(false, false);
        connecting = false;
        wifiRetry.fail(now);
        Serial.printf("[wifi] connection timeout; retry in %lu ms\n",
                      static_cast<unsigned long>(wifiRetry.waitMs()));
      }
      if (!connecting && wifiRetry.ready(now)) {
        WiFi.begin(credentials::kWifiSsid, credentials::kWifiPassword);
        connecting = true;
        connectionStartedMs = now;
      }
      continue;
    }
    if (!wasConnected) {
      wasConnected = true;
      connecting = false;
      wifiRetry.defer(now, 0);
      Serial.println("[wifi] connected");
    }
    if (!ntpStarted) {
      configTime(0, 0, config::kNtpServer1, config::kNtpServer2);
      ntpStarted = true;
    }
    if (!clockValid(time(nullptr))) {
      if (uint32_t(now - lastClockLogMs) >= 30000) {
        Serial.println("[https] waiting for UTC clock synchronization");
        lastClockLogMs = now;
      }
      continue;
    }
    const Snapshot snapshot = copySnapshot(now);
    if (!snapshot.available || uint32_t(now - snapshot.sampledMs) > config::kMaxSampleAgeMs)
      continue;
    const bool newCritical = snapshot.criticalSequence != lastCriticalAttempt;
    if (!uploadRetry.ready(now) && !(newCritical && !retryingUpload)) continue;

    char timestamp[21] = {};
    struct tm utc{};
    const char* measuredAt = nullptr;
    const time_t measuredEpoch = static_cast<time_t>(snapshot.measuredEpoch);
    if (measuredEpoch && gmtime_r(&measuredEpoch, &utc) &&
        strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &utc)) {
      measuredAt = timestamp;
    }
    auto payload = buildPayload(snapshot.reading, credentials::kDeviceCode, measuredAt);
    if (!payload.ok) {
      Serial.println("[https] invalid payload; network task stopped");
      break;
    }

    WiFiClientSecure client;
    client.setCACert(credentials::kRootCa);
    client.setHandshakeTimeout(config::kTlsHandshakeTimeoutSeconds);
    HTTPClient http;
    http.setConnectTimeout(config::kHttpTimeoutMs);
    http.setTimeout(config::kHttpTimeoutMs);
    http.setFollowRedirects(HTTPC_DISABLE_FOLLOW_REDIRECTS);
    if (!http.begin(client, credentials::kIngestUrl)) {
      uploadRetry.fail(millis());
      retryingUpload = true;
      Serial.println("[https] request initialization failed");
      continue;
    }
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + credentials::kDeviceToken);
    const char* trackedHeaders[] = {"Retry-After"};
    http.collectHeaders(trackedHeaders, 1);
    lastCriticalAttempt = snapshot.criticalSequence;
    const int status = http.POST(reinterpret_cast<uint8_t*>(payload.text), payload.length);
    const String retryAfter = http.header("Retry-After");
    if (status < 0) {
      char tlsError[160] = {};
      const int tlsCode = client.lastError(tlsError, sizeof(tlsError));
      Serial.printf("[https] transport_error=%s tls_code=%d tls_detail=%s wifi_rssi=%d free_heap=%lu\n",
                    HTTPClient::errorToString(status).c_str(), tlsCode, tlsError,
                    WiFi.RSSI(), static_cast<unsigned long>(ESP.getFreeHeap()));
    }
    http.end();
    client.stop();
    // No response bodies, URLs, SSIDs, tokens or TLS secrets are logged.
    Serial.printf("[https] result=%d\n", status);
    if (status >= 200 && status < 300) {
      portENTER_CRITICAL(&snapshotMux);
      mailbox.acknowledge(snapshot.criticalSequence);
      portEXIT_CRITICAL(&snapshotMux);
      uploadRetry.defer(millis(), config::kUploadIntervalMs);
      retryingUpload = false;
    } else if (status == 401 || status == 403) {
      Serial.println("[https] device authorization rejected; fix credentials then restart");
      break;
    } else {
      uploadRetry.fail(millis());
      retryingUpload = true;
      if (status == 429) {
        // Numeric Retry-After only; HTTP-date values use the normal backoff.
        const long seconds = retryAfter.toInt();
        if (seconds > 0) uploadRetry.defer(millis(), uint32_t(seconds > 300 ? 300 : seconds) * 1000);
      }
    }
  }
  WiFi.disconnect(true, false);
  vTaskDelete(nullptr);
}
}  // namespace

void nobanjirDeviceSetup() {
  Serial.begin(115200);
  pinMode(config::kTrigPin, OUTPUT);
  digitalWrite(config::kTrigPin, LOW);
  pinMode(config::kEchoPin, INPUT);
  pinMode(config::kRainPin, INPUT_PULLUP);
  if (config::kFloatEnabled) pinMode(config::kFloatPin, INPUT_PULLUP);
  lastCycleMs = millis();
  Serial.println("NO BANJIR! / local sensor measurements / not a flood-level decision");
  Serial.printf("[ultrasonic] HC-SR04 trig=%u echo=%u range_cm=%.1f..%.1f\n",
                static_cast<unsigned>(config::kTrigPin), static_cast<unsigned>(config::kEchoPin),
                config::kMinDistanceCm, config::kMaxDistanceCm);
  if (config::kRainDebugEnabled) {
    Serial.printf("[rain] connect module DO to GPIO%u; %s means wet after debounce\n",
                  static_cast<unsigned>(config::kRainPin), config::kRainActiveLow ? "LOW" : "HIGH");
  }
  if (config::kPrototypeSerialPreviewEnabled) {
    Serial.printf("[prototype] LOCAL DEMO: sensor_to_zero_cm=%.1f container_height_cm=%.1f thresholds_cm=%.1f/%.1f/%.1f\n",
                  config::kPrototypeSensorToZeroCm, config::kPrototypeMaxWaterHeightCm,
                  config::kPrototypeWaspadaMinCm, config::kPrototypeSiagaMinCm,
                  config::kPrototypeBahayaMinCm);
  }
  if (networkConfigured()) {
    // ESP32-WROOM-32 has two cores. Task stack size is in bytes on ESP-IDF.
    if (xTaskCreatePinnedToCore(networkTask, "telemetry", 12288, nullptr, 1, nullptr, 0) != pdPASS)
      Serial.println("[https] task allocation failed; local sampling remains active");
  } else {
    Serial.println("[https] disabled or incomplete config; Serial-only bench mode");
  }
}

void nobanjirDeviceLoop() {
  uint32_t now = millis();
  rain.poll(digitalRead(config::kRainPin) == (config::kRainActiveLow ? LOW : HIGH), now);
  if (config::kFloatEnabled &&
      critical.poll(digitalRead(config::kFloatPin) == (config::kFloatActiveLow ? LOW : HIGH), now) &&
      critical.active()) {
    // Publish an independent critical observation immediately, without claiming
    // that a previous distance was measured at this new timestamp.
    publish({false, 0}, true);
  }
  if (!measuring && uint32_t(now - lastCycleMs) >= config::kSampleIntervalMs) {
    lastCycleMs = now;
    measuring = true;
    pingCount = 0;
    lastPingMs = now - config::kPingSpacingMs;
  }
  if (measuring && uint32_t(now - lastPingMs) >= config::kPingSpacingMs) {
    lastPingMs = now;
    pings[pingCount++] = pingDistance();
    if (pingCount == 5) {
      publish(medianDistance(pings, config::kMinDistanceCm, config::kMaxDistanceCm), false);
      measuring = false;
    }
  }
  delay(5);
}
