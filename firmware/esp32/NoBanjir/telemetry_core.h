#pragma once

#include <stddef.h>
#include <stdint.h>

namespace nobanjir {

struct Distance { bool valid; double cm; };
struct OptionalBool { bool known; bool value; };
struct Reading {
  Distance distance;
  OptionalBool rain;
  OptionalBool critical;
};

struct Snapshot {
  Reading reading{};
  uint32_t sampledMs = 0;
  int64_t measuredEpoch = 0;
  uint32_t criticalSequence = 0;
  bool available = false;
};

// One current reading and one short-lived critical event. Callers synchronize
// access across tasks. A normal sample or old HTTP response cannot erase a newer
// critical observation; expired events never become a persistent offline queue.
class SnapshotMailbox {
 public:
  constexpr void publish(Reading reading, uint32_t now, int64_t epoch, bool criticalEvent) {
    if (criticalEvent) {
      ++sequence_;
      if (!sequence_) ++sequence_;
    }
    latest_ = {reading, now, epoch, sequence_, true};
    if (criticalEvent) pending_ = latest_;
  }
  constexpr Snapshot next(uint32_t now, uint32_t maxAgeMs) const {
    if (pending_.available && uint32_t(now - pending_.sampledMs) <= maxAgeMs) return pending_;
    if (latest_.available && uint32_t(now - latest_.sampledMs) <= maxAgeMs) return latest_;
    return {};
  }
  constexpr void acknowledge(uint32_t sequence) {
    if (pending_.available && pending_.criticalSequence == sequence) pending_.available = false;
  }

 private:
  Snapshot latest_{};
  Snapshot pending_{};
  uint32_t sequence_ = 0;
};

// Invalid pings never enter the median. A result requires a valid majority.
template <size_t N>
constexpr Distance medianDistance(const double (&pings)[N], double minCm, double maxCm) {
  double sorted[N] = {};
  size_t count = 0;
  if (!(minCm > 0 && maxCm >= minCm)) return {false, 0};
  for (size_t i = 0; i < N; ++i) {
    if (!(pings[i] >= minCm && pings[i] <= maxCm)) continue;
    size_t position = count;
    while (position > 0 && sorted[position - 1] > pings[i]) {
      sorted[position] = sorted[position - 1];
      --position;
    }
    sorted[position] = pings[i];
    ++count;
  }
  if (count < N / 2 + 1) return {false, 0};
  return {true, count % 2 ? sorted[count / 2]
                         : (sorted[count / 2 - 1] + sorted[count / 2]) / 2};
}

class DebouncedInput {
 public:
  constexpr explicit DebouncedInput(uint32_t durationMs) : duration_(durationMs) {}
  // Returns true when a stable value first becomes known or changes.
  constexpr bool poll(bool raw, uint32_t now) {
    if (!started_ || raw != candidate_) {
      candidate_ = raw;
      since_ = now;
      started_ = true;
    }
    if (uint32_t(now - since_) >= duration_ && (!known_ || value_ != candidate_)) {
      value_ = candidate_;
      known_ = true;
      return true;
    }
    return false;
  }
  constexpr bool known() const { return known_; }
  constexpr bool active() const { return known_ && value_; }

 private:
  uint32_t duration_;
  uint32_t since_ = 0;
  bool started_ = false;
  bool candidate_ = false;
  bool known_ = false;
  bool value_ = false;
};

class RetrySchedule {
 public:
  constexpr RetrySchedule(uint32_t baseMs, uint32_t maxMs)
      : base_(baseMs), max_(maxMs) {}
  constexpr bool ready(uint32_t now) const {
    return !scheduled_ || uint32_t(now - since_) >= wait_;
  }
  constexpr void fail(uint32_t now) {
    backoff_ = backoff_ == 0 ? base_ : (backoff_ >= max_ / 2 ? max_ : backoff_ * 2);
    wait_ = backoff_;
    since_ = now;
    scheduled_ = true;
  }
  constexpr void defer(uint32_t now, uint32_t delayMs) {
    backoff_ = 0;
    wait_ = delayMs;
    since_ = now;
    scheduled_ = true;
  }
  constexpr uint32_t waitMs() const { return wait_; }

 private:
  uint32_t base_, max_;
  uint32_t since_ = 0, wait_ = 0, backoff_ = 0;
  bool scheduled_ = false;
};

struct Payload {
  char text[768] = {};
  size_t length = 0;
  bool ok = true;

  constexpr void character(char c) {
    if (length + 1 >= sizeof(text)) { ok = false; return; }
    text[length++] = c;
    text[length] = '\0';
  }
  constexpr void append(const char* value) {
    if (!value) { ok = false; return; }
    for (size_t i = 0; value[i] && ok; ++i) character(value[i]);
  }
  constexpr void quoted(const char* value, size_t limit) {
    if (!value) { ok = false; return; }
    character('"');
    size_t i = 0;
    for (; value[i] && i < limit && ok; ++i) {
      const unsigned char c = static_cast<unsigned char>(value[i]);
      if (c == '"' || c == '\\') { character('\\'); character(char(c)); }
      else if (c < 32) {
        append("\\u00");
        character("0123456789abcdef"[c >> 4]);
        character("0123456789abcdef"[c & 15]);
      } else character(char(c));
    }
    if (value[i]) ok = false;
    character('"');
  }
  constexpr void boolean(OptionalBool value) {
    append(!value.known ? "null" : (value.value ? "true" : "false"));
  }
  constexpr void distance(Distance value) {
    // Comparisons also reject NaN and infinity before converting to an integer.
    if (!value.valid || !(value.cm >= 0 && value.cm <= 1000000)) {
      append("null");
      return;
    }
    const uint32_t tenths = static_cast<uint32_t>(value.cm * 10 + 0.5);
    uint32_t whole = tenths / 10;
    char digits[10] = {};
    size_t count = 0;
    do { digits[count++] = char('0' + whole % 10); whole /= 10; } while (whole);
    while (count) character(digits[--count]);
    character('.');
    character(char('0' + tenths % 10));
  }
};

constexpr Payload buildPayload(const Reading& reading, const char* deviceCode,
                               const char* measuredAt) {
  Payload result;
  if (!deviceCode || !deviceCode[0]) { result.ok = false; return result; }
  result.append("{\"device_code\":");
  result.quoted(deviceCode, 64);
  result.append(",\"distance_cm\":");
  result.distance(reading.distance);
  result.append(",\"is_raining\":");
  result.boolean(reading.rain);
  result.append(",\"float_switch_critical\":");
  result.boolean(reading.critical);
  if (measuredAt) {
    result.append(",\"measured_at\":");
    result.quoted(measuredAt, 20);
  }
  result.character('}');
  return result;
}

}  // namespace nobanjir
