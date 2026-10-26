"""Compile the sketch against an installed Arduino ESP32 3.x SDK (no upload).

Use --link to compile Arduino and the required built-in libraries and link an ELF.
This does not generate an upload package or run the Arduino IDE preprocessor.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packages", type=Path, default=Path(
        os.environ.get("LOCALAPPDATA", "")) / "Arduino15/packages/esp32")
    parser.add_argument("--link", action="store_true", help="Compile libraries/core and link firmware ELF")
    parser.add_argument("--network-config-check", action="store_true",
                        help="Use public dummy credentials to retain the network task in the link")
    args = parser.parse_args()
    packages = args.packages
    compilers = sorted(packages.glob("tools/esp-x32/*/bin/xtensa-esp32-elf-g++.exe"))
    cores = sorted(packages.glob("hardware/esp32/3.*"))
    sdks = sorted(packages.glob("tools/esp32-libs/3.*"))
    if not compilers or not cores or not sdks:
        raise SystemExit("Installed Arduino ESP32 3.x core, SDK, and compiler not found.")
    core, sdk = cores[-1], sdks[-1]
    output = ROOT / ".pio/arduino-check"
    output.mkdir(parents=True, exist_ok=True)
    includes = [ROOT / "NoBanjir", core / "cores/esp32", core / "variants/esp32"]
    if args.network_config_check:
        if (ROOT / "NoBanjir/secrets.h").exists():
            raise SystemExit("Network check refuses to override an existing private secrets.h.")
        dummy_config = output / "public-test-config"
        dummy_config.mkdir(exist_ok=True)
        (dummy_config / "secrets.h").write_text('''#pragma once
namespace credentials {
constexpr bool kUploadEnabled = true;
constexpr const char* kWifiSsid = "compile-check-only";
constexpr const char* kWifiPassword = "public-dummy-password";
constexpr const char* kDeviceCode = "ESP32-NB-TEST";
constexpr const char* kIngestUrl = "https://example.invalid/api/iot/readings";
constexpr const char* kDeviceToken = "public-dummy-token-not-for-use";
constexpr const char* kRootCa = "-----BEGIN CERTIFICATE-----\\nPUBLIC-DUMMY-NOT-A-VALID-CA\\n-----END CERTIFICATE-----";
}
''', encoding="utf-8")
        includes.insert(0, dummy_config)
    includes.extend(path for path in (core / "libraries").glob("*/src") if path.is_dir())
    flags = [str(compilers[-1]), "-c", "@" + str(sdk / "flags/cpp_flags"),
             "@" + str(sdk / "flags/defines"), "-iprefix", str(sdk / "include") + "/",
             "@" + str(sdk / "flags/includes"), "-I", str(sdk / "dio_qspi/include"),
             "-Os", "-Wall", "-Wextra", "-Werror=return-type", "-DF_CPU=240000000L",
             "-DARDUINO=10607", "-DARDUINO_ARCH_ESP32", "-DARDUINO_ESP32_DEV",
             '-DARDUINO_BOARD="ESP32_DEV"', '-DARDUINO_VARIANT="esp32"',
             "-DARDUINO_USB_CDC_ON_BOOT=0", "-DCORE_DEBUG_LEVEL=0", "-DESP32=ESP32"]
    for path in includes:
        flags.extend(["-I", str(path)])
    print("Checking adapter against Arduino ESP32", core.name, flush=True)
    objects = []
    for source, name in [(ROOT / "NoBanjir/firmware.cpp", "firmware.o"),
                         (ROOT / "NoBanjir/NoBanjir.ino", "sketch.o")]:
        destination = output / name
        objects.append(destination)
        result = subprocess.run(flags + ["-x", "c++", str(source), "-o", str(destination)],
                                check=False)
        if result.returncode:
            return result.returncode
    if args.link:
        sources = []
        for folder in [core / "cores/esp32"] + [core / "libraries" / name / "src" for name in
                                               ("WiFi", "Network", "NetworkClientSecure", "HTTPClient")]:
            sources.extend(path for path in folder.rglob("*") if path.suffix in (".cpp", ".c", ".S"))

        def compile_source(source):
            destination = output / ("_".join(source.relative_to(core).parts) + ".o")
            source_flags = flags.copy()
            if source.suffix != ".cpp":
                source_flags[0] = str(Path(compilers[-1]).with_name("xtensa-esp32-elf-gcc.exe"))
                response = "c_flags" if source.suffix == ".c" else "S_flags"
                source_flags[2] = "@" + str(sdk / "flags" / response)
            result = subprocess.run(source_flags + [str(source), "-o", str(destination)],
                                    check=False, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                    text=True, errors="replace")
            return destination, result

        print("Compiling Arduino core and network libraries for link check...", flush=True)
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(compile_source, sources))
        for destination, result in results:
            if result.returncode:
                print(result.stdout)
                return result.returncode
            objects.append(destination)
        command = [str(compilers[-1]), "-L" + str(sdk / "lib"), "-L" + str(sdk / "ld"),
                   "-L" + str(sdk / "dio_qspi"), "@" + str(sdk / "flags/ld_flags"),
                   "-Wl,-Map=" + str(output / "NoBanjir.map"),
                   "@" + str(sdk / "flags/ld_scripts"), "-Wl,--wrap=esp_panic_handler",
                   "-Wl,--wrap=esp_bt_mem_release", "-Wl,--wrap=esp_bt_controller_mem_release",
                   "-Wl,--start-group"]
        command.extend(str(path) for path in objects)
        command.extend(["@" + str(sdk / "flags/ld_libs"), "-Wl,--end-group", "-Wl,-EL",
                        "-o", str(output / "NoBanjir.elf")])
        # A response file avoids Windows command line limits. Paths come from the
        # filesystem and are passed to the compiler directly, without a shell.
        response_file = output / "link.rsp"
        response_file.write_text("\n".join('"' + arg.replace('\\', '/') + '"' for arg in command[1:]),
                                 encoding="utf-8")
        with (output / "link.log").open("w", encoding="utf-8") as log:
            result = subprocess.run([command[0], "@" + str(response_file)], check=False,
                                    stdout=log, stderr=subprocess.STDOUT)
        if result.returncode:
            print((output / "link.log").read_text(encoding="utf-8", errors="replace")[-12000:])
            return result.returncode
        print("PASS: complete firmware ELF linked against Arduino ESP32 " + core.name + ".")
        return 0
    print("PASS: Arduino ESP32 sketch and adapter compiled (no link or upload).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
