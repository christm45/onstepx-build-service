"""
Post-build script for the ESP32 env: merges bootloader + partitions + app
into a single flashable image at offset 0x0.

Inspired by rchadgray/OnStepX_Platformio (GPL-3.0).

Simplifies the browser flash step from "3 files at 3 addresses" to
"1 file at 0x0".
"""
Import("env")  # noqa: F821 — provided by PlatformIO

env.AddPostAction("$BUILD_DIR/${PROGNAME}.bin", [
    " ".join([
        "esptool.py --chip esp32 merge_bin",
        "-o $BUILD_DIR/merged-firmware.bin",
        "--flash_mode dio --flash_freq 40m --flash_size 4MB",
        "0x1000 $BUILD_DIR/bootloader.bin",
        "0x8000 $BUILD_DIR/partitions.bin",
        "0xe000 $BUILD_DIR/boot_app0.bin",
        "0x10000 $BUILD_DIR/${PROGNAME}.bin",
    ])
])
