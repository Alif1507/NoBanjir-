# ESP32 firmware and wiring design

**Approved:** 2026-10-26. **Updated user constraint:** Arduino IDE is the primary
editor/uploader. Deliver a normal `NoBanjir/NoBanjir.ino` sketch folder with its
supporting .cpp/.h files. PlatformIO remains an optional wrapper over that source.

## Purpose and scope

Build the NO BANJIR! device firmware and an Indonesian wiring/setup guide using
`context/NO_BANJIR_WEB_APP_SPEC.md`, sections 8 and 11. The user has an
ESP32-WROOM-32 development board with 30 pins and USB Type-C, a JSN-SR04T
probe/module, a rain plate/module, and 1 kΩ ¼ W resistors. The JSN revision,
rain module revision, and resistor quantity are unknown. No float switch was
listed; support it as an optional input disabled by default.

The deliverable is firmware ready for bench testing, not a claim of hardware
validation. The Next.js app and Supabase backend will be built separately.

## Approaches

- Arduino IDE sketch: selected after the user clarified their upload tool.
  Target ESP32 Dev Module and keep all supporting sources in the sketch folder.
- PlatformIO with Arduino framework: retained as an optional reproducible build
  wrapper, using the classic ESP32 `esp32dev` board profile.

Verify flash capacity and upload settings against the actual board. Arduino IDE
is the primary documented workflow; no additional runtime libraries are needed.

## Proposed wiring

Use GPIO labels printed on the board, never physical header position numbers.

| Module connection | ESP32 connection |
| --- | --- |
| JSN VCC | Verified regulated 5 V rail |
| JSN GND | GND |
| JSN TRIG | GPIO18; confirm the module accepts 3.3 V triggering |
| JSN ECHO | GPIO19 through the divider below |
| Rain VCC | 3V3, only if the actual module supports 3.3 V operation |
| Rain GND | GND |
| Rain DO | GPIO27; verify output voltage and polarity |
| Rain AO | Unconnected |
| Optional float switch | GPIO26 to GND, INPUT_PULLUP, disabled by default |

Proposed Echo divider using only the listed resistor value:

```text
JSN ECHO -- 1k -- 1k --+-- GPIO19
                       |
                      1k
                       |
                      1k
                       |
                      1k
                       |
                      GND
```

This requires **five** 1 kΩ resistors, not one. With 5 V at Echo, the nominal
GPIO voltage is 5 × 3/(2+3) = 3 V. One resistor in series does not provide a
defined voltage reduction. Confirm the signal voltage before connection.
If the rain module requires 5 V, its output also needs suitable level conversion;
the default guide must not connect a 5 V DO directly to the ESP32.

The board's Type-C connector does not establish its 5 V header pinout or power
protection. Confirm the board label and voltage with a meter. Use a common ground
and avoid feeding competing power supplies into the board.

## Firmware behavior

- Keep pin assignments, polarity, sensor distance range, and timing configurable.
- Read five ultrasonic pings per measurement cycle with spacing and bounded Echo
  timeouts; accept the median only when at least three pings are valid.
- Start with conservative 25–450 cm acceptance bounds as a builder choice; the
  actual JSN revision and installation must determine the calibrated range.
- Sample about every 5 seconds and transmit the latest measurement about every
  15 seconds. Never reuse an old valid distance as a new sample after failure.
- Debounce rain DO. Treat rain as a boolean, not measured rainfall intensity.
- Optional float switch input is debounced independently; a confirmed critical
  transition requests an early upload without waiting for the regular interval.
- Serialize exactly the spec fields: `device_code`, `distance_cm`, `is_raining`,
  `float_switch_critical`, and optional `measured_at` in UTC after clock sync.
- Use JSON null for failed ultrasonic measurements and absent float switch.
  Document that the future ingestion endpoint must accept failed distance values
  to preserve independent rain/float observations and record sensor errors.
- The backend owns height calibration and warning levels. Firmware sends distance.
- Default to local Serial measurements until Wi-Fi, device token, HTTPS URL, and
  a trusted root CA are configured. Keep private configuration out of source
  control and never print credentials.
- Verify HTTPS certificates; do not provide an insecure TLS fallback. Sync time
  before HTTPS. Bound connection/request timeouts and reconnect with backoff.
- Send current observations after reconnection. Persistent offline queues remain
  outside this MVP, consistent with the spec's later-phase scope.
- Preserve one pending float critical transition in RAM with its original
  timestamp until acknowledged or expired after 10 seconds. This prevents an
  in-flight ordinary request from erasing a short critical observation. Freshness
  is checked when selecting a request; connection phases may add transport delay.

## Files and verification

Create `firmware/esp32/NoBanjir/` containing an Arduino IDE sketch, modular sensor
and payload code, and a private configuration example. Include an optional
PlatformIO wrapper and an Indonesian README covering
wiring, voltage checks, configuration, upload, Serial output, calibration,
troubleshooting, and a bench checklist.

Verify filtering and invalid readings, payload null handling, input debounce,
and reconnect scheduling where practical. Compile for the ESP32 if the toolchain
can be installed in the permitted workspace. Clearly report any unavailable
toolchain or hardware verification. Test the actual device with known distances,
wet/dry rain plate, disconnected Echo, and Wi-Fi interruptions before installation.

## Source

ESP32 electrical characteristics:
https://documentation.espressif.com/esp32-wroom-32_datasheet_en.html

Exact JSN and rain module variants must be checked from their own markings and
datasheets before treating their electrical characteristics as confirmed.
