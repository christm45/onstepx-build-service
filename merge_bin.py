"""
Post-build script for the ESP32 env: merges bootloader + partitions +
boot_app0 + app into a single flashable image at offset 0x0.

Simplifies the browser flash step from "4 files at 4 addresses" to
"1 file at 0x0".

Inspired by rchadgray/OnStepX_Platformio (GPL-3.0).
"""
import os

Import("env")  # noqa: F821 — provided by PlatformIO

platform = env.PioPlatform()  # noqa: F821

# PlatformIO's bundled esptool.py — avoids PATH/exec-bit issues and
# "python -m esptool" failing when the host Python has no esptool.
esptool_dir = platform.get_package_dir("tool-esptoolpy")
esptool_script = os.path.join(esptool_dir, "esptool.py").replace("\\", "/")

# boot_app0.bin ships with the Arduino-ESP32 framework; it must be written
# at 0xe000 for the OTA slot tracker (otadata partition). PlatformIO's
# build output directory doesn't contain it, so use its framework path
# directly.
framework_dir = platform.get_package_dir("framework-arduinoespressif32")
boot_app0 = os.path.join(
    framework_dir, "tools", "partitions", "boot_app0.bin"
).replace("\\", "/")

env.AddPostAction("$BUILD_DIR/${PROGNAME}.bin", [
    " ".join([
        "$PYTHONEXE",
        '"' + esptool_script + '"',
        "--chip esp32 merge_bin",
        "-o $BUILD_DIR/merged-firmware.bin",
        "--flash_mode dio --flash_freq 40m --flash_size 4MB",
        "0x1000 $BUILD_DIR/bootloader.bin",
        "0x8000 $BUILD_DIR/partitions.bin",
        '0xe000 "' + boot_app0 + '"',
        "0x10000 $BUILD_DIR/${PROGNAME}.bin",
    ])
])
