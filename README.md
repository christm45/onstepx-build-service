# OnStepX Online Build Service

This repository is the **build backend** for the OnStepX online configurator at
https://christm45.github.io/OnStepX-Configurator/ .

It's pushed on every dispatch: the browser generates a `Config.h`, a small
Cloudflare Worker triggers `build.yml` here with the config, the workflow
fetches the latest `hjd1964/OnStepX` (or SmartHandController / SmartWebServer)
source, compiles it with PlatformIO, and
uploads the firmware as a workflow artifact that the browser then downloads.

## Supported build environments

| PlatformIO env    | MCU           | Typical pinmaps / project            |
| ----------------- | ------------- | ------------------------------------ |
| `esp32`           | ESP32         | MaxESP3, MaxESP4, FYSETC_E4, CNC3 (WeMos D1 R32 — deprecated) |
| `teensy32`        | Teensy 3.2    | MiniPCB (v1), MiniPCB2 (v2)          |
| `teensy40`        | Teensy 4.0    | MiniPCB (v1) / MiniPCB2 (v2) on Teensy 4.0 |
| `teensy41`        | Teensy 4.1    | **MaxPCB4**, MaxPCB3                 |
| `blackpill_f411`  | STM32F411CE   | **MaxSTM3**, MaxSTM3I                |
| `f446_fysetc_s6`  | STM32F446VE   | **FYSETC_S6** (V1.2 + V2.0)          |
| `skr_pro_f407`    | STM32F407ZGT6 | **BTT_SKR_PRO** (V1.2)               |
| `shc_esp32`       | ESP32         | SmartHandController                  |
| `shc_teensy40`    | Teensy 4.0    | SmartHandController                  |
| `sws_esp32`       | ESP32         | SmartWebServer                       |
| `sws_esp8266`     | ESP8266       | SmartWebServer                       |

The pinmap is chosen inside `Config.h` by the user — it only needs to be
compatible with the PlatformIO env the workflow is dispatched against.

## Manual test run

```bash
pip install platformio
cp some-config.h OnStepX/Config.h    # or let the workflow inject it
pio run -e esp32
```

## Workflow inputs

`workflow_dispatch` accepts:

- `project` — `onstepx` (default), `shc` or `sws`: clones `hjd1964/OnStepX`,
  `hjd1964/SmartHandController` or `hjd1964/SmartWebServer`
- `config_h` — base64-encoded `Config.h` (≤ 64KB after base64)
- `environment` — a PlatformIO env from `platformio.ini`: `esp32`, `teensy32`,
  `teensy40`, `teensy41`, `blackpill_f411`, `f446_fysetc_s6`, `skr_pro_f407`
  (onstepx); `shc_esp32`, `shc_teensy40` (shc); `sws_esp32`,
  `sws_esp8266` (sws)
- `request_id` — UUID set by the caller so results can be correlated
- `onstepx_ref` — branch / tag / SHA of the chosen upstream repo (default `main`)
- `plugins` — comma-separated OnStepX plugins from `hjd1964/OnStepX-Plugins`
  (`website`, `elegantota`, `metrics`, `serialBluetoothConfig`,
  `guideRateRheostat`, `usb`); ignored for shc/sws

The run is named `onstepx-build req=<uuid> env=<env> project=<project>` so
callers can find their run in
`/repos/{owner}/{repo}/actions/runs?event=workflow_dispatch` (both `name` and
`display_title` carry it). The artifact is `firmware-<uuid>` and must contain
`firmware.bin`, `firmware.hex` or `merged-firmware.bin` — the collect step
fails the run otherwise.

The workflow runs with `permissions: contents: read`, checks out with
`persist-credentials: false`, passes every input to scripts via `env:` (never
`${{ }}` inside `run:`), and does not print `Config.h` contents (run logs are
public and Config.h carries WiFi credentials).

## Do not edit `OnStepX/` by hand

The workflow wipes `OnStepX/` and re-clones `hjd1964/OnStepX` on every build.
