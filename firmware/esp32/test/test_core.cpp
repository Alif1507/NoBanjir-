#include "telemetry_core.h"
#include "prototype_preview.h"
#include <limits>

using namespace nobanjir;

constexpr bool equalText(const char* a, const char* b) {
  for (size_t i = 0;; ++i) {
    if (a[i] != b[i]) return false;
    if (!a[i]) return true;
  }
}

constexpr bool containsText(const char* text, const char* needle) {
  if (!needle[0]) return true;
  for (size_t i = 0; text[i]; ++i) {
    size_t j = 0;
    while (needle[j] && text[i + j] && needle[j] == text[i + j]) ++j;
    if (!needle[j]) return true;
  }
  return false;
}

constexpr double pings[] = {38.0, 37.0, 400.0, 39.0, 0.0};
constexpr double failed[] = {0.0, -1.0, 24.9, 451.0, 38.0};
constexpr double even[] = {25.0, 30.0, 40.0, 450.0, 0.0};
static_assert(medianDistance(pings, 25, 450).valid, "valid majority accepted");
static_assert(medianDistance(pings, 25, 450).cm == 38.5, "median rejects spike");
static_assert(!medianDistance(failed, 25, 450).valid, "insufficient pings invalid");
static_assert(medianDistance(even, 25, 450).cm == 35, "even median averages middle");
static_assert(!medianDistance(pings, 450, 25).valid, "invalid range rejected");
constexpr double nonFinite[] = {std::numeric_limits<double>::quiet_NaN(),
  std::numeric_limits<double>::infinity(), 38.0, 39.0, 40.0};
static_assert(medianDistance(nonFinite, 25, 450).cm == 39.0,
              "NaN and infinity cannot contaminate a valid median");

constexpr bool debounceNoise() {
  DebouncedInput input(100);
  input.poll(false, 0);
  if (input.known()) return false;
  input.poll(false, 100);
  if (!input.known() || input.active()) return false;
  input.poll(true, 110);
  input.poll(false, 150);
  input.poll(true, 160);
  if (input.poll(true, 259) || input.active()) return false;
  return input.poll(true, 260) && input.active();
}
static_assert(debounceNoise(), "bounce cannot trigger an early transition");

constexpr bool debounceWrap() {
  DebouncedInput input(100);
  input.poll(true, UINT32_MAX - 49);
  return !input.poll(true, 49) && input.poll(true, 50) && input.active();
}
static_assert(debounceWrap(), "debounce survives millis rollover");

constexpr bool retryTiming() {
  RetrySchedule retry(1000, 60000);
  if (!retry.ready(0)) return false;
  retry.fail(0);
  if (retry.ready(999) || !retry.ready(1000)) return false;
  retry.fail(1000);
  if (retry.ready(2999) || !retry.ready(3000)) return false;
  for (unsigned i = 0; i < 10; ++i) retry.fail(3000);
  if (retry.waitMs() != 60000) return false;
  retry.defer(UINT32_MAX - 499, 1000);
  if (retry.ready(499) || !retry.ready(500)) return false;
  retry.fail(500);
  return retry.waitMs() == 1000;
}
static_assert(retryTiming(), "retry caps, resets, and survives rollover");

constexpr Reading good{{true, 38.04}, {true, false}, {false, false}};
constexpr Reading invalid{{false, 38.0}, {true, true}, {true, true}};
constexpr auto payload = buildPayload(good, "ESP32-NB-001", "2026-10-26T03:00:00Z");
static_assert(payload.ok, "valid payload fits");
static_assert(equalText(payload.text,
  "{\"device_code\":\"ESP32-NB-001\",\"distance_cm\":38.0,\"is_raining\":false,"
  "\"float_switch_critical\":null,\"measured_at\":\"2026-10-26T03:00:00Z\"}"),
  "payload follows API contract");
constexpr auto errorPayload = buildPayload(invalid, "device", nullptr);
static_assert(equalText(errorPayload.text,
  "{\"device_code\":\"device\",\"distance_cm\":null,\"is_raining\":true,"
  "\"float_switch_critical\":true}"), "failed distance never reuses old value");
constexpr auto escaped = buildPayload(good, "a\"b\\c\n", nullptr);
static_assert(containsText(escaped.text, "a\\\"b\\\\c\\u000a"), "escape JSON strings");
constexpr Reading unknown{{false, 0}, {false, false}, {false, false}};
static_assert(containsText(buildPayload(unknown, "d", nullptr).text,
  "\"is_raining\":null"), "unknown rain is not invented dry weather");
constexpr Reading huge{{true, 1e300}, {true, false}, {false, false}};
static_assert(containsText(buildPayload(huge, "d", nullptr).text,
  "\"distance_cm\":null"), "unrepresentable distance is null");
constexpr Reading notFinite{{true, std::numeric_limits<double>::quiet_NaN()},
                           {true, false}, {false, false}};
static_assert(containsText(buildPayload(notFinite, "d", nullptr).text,
  "\"distance_cm\":null"), "NaN is never serialized as a JSON number");
static_assert(!buildPayload(good, "", nullptr).ok, "empty identity rejected");
static_assert(!buildPayload(good,
  "12345678901234567890123456789012345678901234567890123456789012345", nullptr).ok,
  "identity is bounded to 64 bytes");

constexpr bool criticalDuringUpload() {
  SnapshotMailbox mailbox;
  mailbox.publish(good, 0, 1000, false);
  const auto inFlight = mailbox.next(0, 10000);
  mailbox.publish(invalid, 100, 1001, true);
  mailbox.publish(good, 200, 1002, false);
  mailbox.acknowledge(inFlight.criticalSequence);
  const auto pending = mailbox.next(200, 10000);
  if (!pending.reading.critical.value || pending.measuredEpoch != 1001) return false;
  if (!containsText(buildPayload(pending.reading, "d", nullptr).text,
                    "\"float_switch_critical\":true")) return false;
  mailbox.acknowledge(pending.criticalSequence);
  return !mailbox.next(200, 10000).reading.critical.known;
}
static_assert(criticalDuringUpload(), "in-flight ordinary upload cannot erase critical event");

constexpr bool criticalExpiry() {
  SnapshotMailbox mailbox;
  mailbox.publish(invalid, UINT32_MAX - 99, 1001, true);
  mailbox.publish(good, 9800, 1002, false);
  if (!mailbox.next(9900, 10000).reading.critical.value) return false;
  const auto fresh = mailbox.next(9901, 10000);
  return !mailbox.next(10000, 10000).reading.critical.known &&
         !mailbox.next(20000, 10000).available && fresh.available;
}
static_assert(criticalExpiry(), "critical mailbox expires without replaying stale events");

constexpr bool newerCriticalSurvivesAck() {
  SnapshotMailbox mailbox;
  mailbox.publish(invalid, 100, 1001, true);
  const auto first = mailbox.next(100, 10000);
  mailbox.publish(invalid, 200, 1002, true);
  mailbox.acknowledge(first.criticalSequence);
  return mailbox.next(200, 10000).measuredEpoch == 1002;
}
static_assert(newerCriticalSurvivesAck(), "old HTTP acknowledgement cannot clear newer event");

constexpr PrototypeCalibration container{50.0, 20.0, 5.0, 10.0, 15.0};
static_assert(previewPrototypeWater({true, 50.0}, container).waterHeightCm == 0,
              "empty container has zero water height");
static_assert(previewPrototypeWater({true, 45.1}, container).level == PrototypeLevel::Normal,
              "water just below 5 cm stays Normal");
static_assert(previewPrototypeWater({true, 45.0}, container).level == PrototypeLevel::Waspada,
              "5 cm starts Waspada");
static_assert(previewPrototypeWater({true, 40.1}, container).level == PrototypeLevel::Waspada,
              "water just below 10 cm stays Waspada");
static_assert(previewPrototypeWater({true, 40.0}, container).level == PrototypeLevel::Siaga,
              "10 cm starts Siaga");
static_assert(previewPrototypeWater({true, 35.1}, container).level == PrototypeLevel::Siaga,
              "water just below 15 cm stays Siaga");
static_assert(previewPrototypeWater({true, 35.0}, container).level == PrototypeLevel::Bahaya,
              "15 cm starts Bahaya");
static_assert(previewPrototypeWater({true, 30.0}, container).waterHeightCm == 20 &&
              previewPrototypeWater({true, 30.0}, container).level == PrototypeLevel::Bahaya,
              "full container is 20 cm and Bahaya");
static_assert(!previewPrototypeWater({true, 50.1}, container).valid,
              "a reading below the container bottom is not clamped to Normal");
static_assert(!previewPrototypeWater({true, 29.9}, container).valid,
              "a reading above the container rim is outside calibration");
static_assert(previewPrototypeWater({false, 40.0}, container).level == PrototypeLevel::Unknown,
              "invalid distance never becomes a known level");
static_assert(!previewPrototypeWater({true, std::numeric_limits<double>::quiet_NaN()}, container).valid &&
              !previewPrototypeWater({true, std::numeric_limits<double>::infinity()}, container).valid,
              "nonfinite sensor readings are rejected");
static_assert(!previewPrototypeWater({true, 40.0}, {50, 20, 15, 10, 5}).valid,
              "unordered thresholds are rejected");
static_assert(equalText(prototypeLevelName(PrototypeLevel::Unknown), "UNKNOWN"),
              "unknown preview has an explicit label");

int main() { return 0; }
