# Force-include Arduino.h for C++ only (PROGMEM must be defined before
# Ephemeris.hpp expands CONST). A plain `-include Arduino.h` in build_flags
# also reaches the C sources of the Teensy 3 core, where Arduino.h's
# `void setup(void)` clashes with usb_dev.c's `setup` variable.
Import("env")
env.Append(CXXFLAGS=["-include", "Arduino.h"])
