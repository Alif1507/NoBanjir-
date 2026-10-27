#pragma once

#include "telemetry_core.h"

namespace nobanjir {

// Local demonstration only. Uploaded flood levels are calculated by the server.
struct PrototypeCalibration {
  double sensorToZeroCm;
  double maxWaterHeightCm;
  double waspadaMinCm;
  double siagaMinCm;
  double bahayaMinCm;
};

enum class PrototypeLevel { Unknown, Normal, Waspada, Siaga, Bahaya };
struct PrototypePreview {
  bool valid;
  double waterHeightCm;
  PrototypeLevel level;
};

constexpr PrototypePreview previewPrototypeWater(Distance distance,
                                                 const PrototypeCalibration& calibration) {
  if (!distance.valid || !(distance.cm >= 0 && distance.cm <= 1000000) ||
      !(calibration.sensorToZeroCm > 0 && calibration.sensorToZeroCm <= 1000000 &&
        calibration.maxWaterHeightCm > 0 &&
        calibration.maxWaterHeightCm <= calibration.sensorToZeroCm &&
        calibration.waspadaMinCm >= 0 &&
        calibration.waspadaMinCm < calibration.siagaMinCm &&
        calibration.siagaMinCm < calibration.bahayaMinCm &&
        calibration.bahayaMinCm <= calibration.maxWaterHeightCm)) {
    return {false, 0, PrototypeLevel::Unknown};
  }
  const double height = calibration.sensorToZeroCm - distance.cm;
  // A reading outside the container is an installation/measurement error.
  if (!(height >= 0 && height <= calibration.maxWaterHeightCm)) {
    return {false, 0, PrototypeLevel::Unknown};
  }
  return {true, height, height >= calibration.bahayaMinCm ? PrototypeLevel::Bahaya :
    height >= calibration.siagaMinCm ? PrototypeLevel::Siaga :
    height >= calibration.waspadaMinCm ? PrototypeLevel::Waspada : PrototypeLevel::Normal};
}

constexpr const char* prototypeLevelName(PrototypeLevel level) {
  switch (level) {
    case PrototypeLevel::Normal: return "NORMAL";
    case PrototypeLevel::Waspada: return "WASPADA";
    case PrototypeLevel::Siaga: return "SIAGA";
    case PrototypeLevel::Bahaya: return "BAHAYA";
    default: return "UNKNOWN";
  }
}

}  // namespace nobanjir
