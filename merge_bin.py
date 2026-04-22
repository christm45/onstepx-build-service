"""
Post-build script for the ESP32 env: merges bootloader + partitions + app
into a single flashable image at offset 0x0.

Simplifies the browser flash step from "3 files at 3 addresses" to
"1 file at 0x0".

Inspired by rchadgray/OnStepX_Platformio (GPL-3.0).
"""
import os

Import("env")  # noqa: F821 — provided by PlatformIO

# Locate PlatformIO's bundled esptool.py. We deliberately do NOT rely on:
#   - `esptool.py` being on PATH with an exec bit (fails on GHA Ubuntu)
#   - `$PYTHONEXE -m esptool` (host Python may not have esptool installed)
# Instead run PlatformIO's own esptool.py script file through the Python
# interpreter it's guaranteed to work with.
platform = env.PioPlatform()  # noqa: F821
esptool_dir = platform.get_package_dir("tool-esptoolpy")
esptool_script = os.path.join(esptool_dir, "esptool.py").replace("\\", "/")

env.AddPostAction("$BUILD_DIR/${PROGNAME}.bin", [
    " ".join([
        "$PYTHONEXE",
        '"' + esptool_script + '"',
        "--chip esp32 merge_bin",
        "-o $BUILD_DIR/merged-firmware.bin",
        "--flash_mode dio --flash_freq 40m --flash_size 4MB",
        "0x1000 $BUILD_DIR/bootloader.bin",
        "0x8000 $BUILD_DIR/partitions.bin",
        "0xe000 $BUILD_DIR/boot_app0.bin",
        "0x10000 $BUILD_DIR/${PROGNAME}.bin",
    ])
])
