"""Compile real C++14 constexpr assertions; no board or emulator required."""
import argparse
import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def find_compiler():
    if os.environ.get("CXX"):
        return os.environ["CXX"]
    for name in ("g++", "clang++"):
        if shutil.which(name):
            return shutil.which(name)
    packages = Path(os.environ.get("LOCALAPPDATA", "")) / "Arduino15/packages/esp32/tools"
    matches = sorted(packages.glob("esp-x32/*/bin/xtensa-esp32-elf-g++.exe"))
    if matches:
        return str(matches[-1])
    raise SystemExit("No C++ compiler found. Set CXX to g++ or clang++ (ESP32 cross compiler also works).")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--compiler", default=None)
    args = parser.parse_args()
    output = ROOT / ".pio/core-tests"
    output.mkdir(parents=True, exist_ok=True)
    command = [args.compiler or find_compiler(), "-std=c++14", "-Wall", "-Wextra",
               "-Werror", "-I", str(ROOT / "NoBanjir"), "-c",
               str(ROOT / "test/test_core.cpp"), "-o", str(output / "test_core.o")]
    result = subprocess.run(command, check=False)
    if result.returncode == 0:
        print("PASS: all C++ core static assertions evaluated by the compiler.")
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
