# ESP32 Firmware Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Deliver ESP32 sensor firmware and an Indonesian wiring/upload guide.

**Architecture:** Hardware-independent C++ logic handles distance validity, median
filtering, debounce, JSON serialization, and retry timing. Arduino adapters sample
GPIO and send current observations through authenticated, certificate-verified
HTTPS. Configuration is local and optional; the default is Serial-only bench mode.

**Tech Stack:** Arduino IDE with Arduino ESP32, C++14, optional PlatformIO
espressif32 6.12.0, built-in WiFi,
WiFiClientSecure and HTTPClient. No third-party runtime library is required.

**Spec:** `docs/superpowers/specs/2026-10-26-esp32-firmware-design.md`, approved by
the user on 2026-10-26.

## Global Constraints

- Target ESP32-WROOM-32, GPIO18 TRIG, GPIO19 ECHO, GPIO27 rain DO.
- Optional float switch GPIO26 disabled by default; send null when absent.
- Read approximately every 5 seconds, upload approximately every 15 seconds.
- Five pings, at least three valid for a median; configurable 25–450 cm bounds.
- Never convert a failed distance to zero or reuse an old distance as a new sample.
- HTTPS only; device token only; no service role key, insecure TLS, or secret logs.
- No backend or web UI changes. No persistent offline queue.

## Review Focus

- Invalid readings after a valid sample must serialize as null, not the old value.
- Rain and optional float transitions must survive noise and millis rollover.
- Reconnect and upload retries must be bounded and wrap-safe.
- Missing clock/credentials must keep HTTPS disabled while local sampling works.
- JSON strings must escape device IDs; non-finite distance values must be null.

### Task 1: Testable sensor and telemetry core

**Files:** `firmware/esp32/NoBanjir/telemetry_core.h`,
`firmware/esp32/test/test_core.cpp`, `firmware/esp32/tools/test_core.py`.

**Interfaces:** `medianDistance`, `DebouncedInput`, `RetrySchedule`, `Reading`,
and `buildPayload` live in namespace `nobanjir`, independent of Arduino.

- [x] Write tests for valid median/outlier rejection, insufficient/invalid pings,
  null sensor states, JSON escaping, debounce and rollover, and capped backoff.
- [x] Run the tests and record the expected missing implementation failure.
- [x] Implement the core and run the same tests to green.

### Task 2: Device adapters and build configuration

**Files:** `firmware/esp32/NoBanjir/{NoBanjir.ino,firmware.cpp,firmware.h,
device_config.h,secrets.example.h}`, optional `platformio.ini`/`src/main.cpp`,
and `.gitignore`.

**Interfaces:** Main consumes Task 1's `Reading` and helpers; sends only the API
contract's fields using `buildPayload` and reads per-installation settings from
`device_config.h` and ignored `secrets.h`.

- [x] Configure `esp32dev`, fixed platform version and 115200 Serial.
- [x] Implement bounded ultrasonic pings and independently debounced digital
  inputs, latest-only telemetry, UTC clock sync, Wi-Fi and HTTP retry backoff.
- [x] Verify Serial-only default, partial/missing network config, TLS validation,
  no credential output, upload errors, and early critical float upload by review.
- [x] Build the default ESP32 image and configured network image if a permitted
  toolchain is available; otherwise record the actual limitation.

### Task 3: Wiring, setup and review

**Files:** `firmware/esp32/README.md`, root `README.md`.

- [x] Document GPIO labels, five-resistor Echo divider, module voltage
  uncertainty, blind zone, polarity calibration, optional float wiring, local
  configuration, build/upload/monitor commands, API contract, and bench checks.
- [x] Run all available core tests and firmware builds; inspect deliverables
  against the approved design and request one independent read-only review.
- [x] Address important review findings and record verification and limitations.

## Execution record

- User clarified Arduino IDE as the upload application. Canonical sources now
  live in `firmware/esp32/NoBanjir/`, with a small `.ino` entry and separate C++
  adapters to avoid Arduino auto-prototype issues. PlatformIO is optional only.

- User approved implementation of this firmware design; execute directly in this
  session. This folder has no Git repository, so worktree and commit steps do not
  apply. Do not initialize Git or move the user's context files.
- Network installation of PlatformIO is currently blocked by the environment;
  check for a local C++ compiler before choosing verification commands.
- Core tests first failed on missing implementation and then passed. Compiler
  evaluates C++14 static assertions on the real production helpers, including
  NaN/infinity rejection, not a separate Python model of the algorithms.
- Adapter compilation initially found HTTPClient's mutable POST buffer contract;
  corrected the buffer type and compilation passed.
- Independent review found a critical float event could be overwritten while
  HTTP was busy. Regression assertions first failed on the missing mailbox;
  the one-slot expiring mailbox now passes overwrite, expiry/rollover, and old
  acknowledgement tests. Float remains disabled by default for the user's kit.
- Freshness is selected before connection work; README now states the added
  transport delay explicitly. Backend must use original timestamps.
- Default Serial-only firmware successfully linked as an ELF with locally
  installed Arduino ESP32 3.3.11; no board was uploaded or exercised.
- Network-enabled ELF also linked successfully with public dummy configuration.
  Final `python firmware/esp32/tools/test_core.py` passed all 21 static assertions.
  Local build uses the installed SDK directly; Arduino IDE's own Verify/upload
  and physical sensor checks remain for the actual board. Optional PlatformIO
  build could not run because package installation was network-blocked.
- No unresolved important review findings. The freshness transport-delay caveat
  is documented; no extra connection/reselection mechanism was added.
