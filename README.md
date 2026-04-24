# OnStepX Online Build Service

This repository is the **build backend** for the OnStepX online configurator at
https://christm45.github.io/OnStepX-Configurator/ .

It's pushed on every dispatch: the browser generates a `Config.h`, a small
Cloudflare Worker triggers `build.yml` here with the config, the workflow
fetches the latest `hjd1964/OnStepX` source, compiles it with PlatformIO, and
uploads the firmware as a workflow artifact that the browser then downloads.

## Supported build environments

| PlatformIO env    | MCU           | Typical OnStepX pinmaps              |
| ----------------- | ------------- | ------------------------------------ |
| `esp32`           | ESP32         | MaxESP3, MaxESP4, FYSETC_E4          |
| `teensy32`        | Teensy 3.2    | MiniPCB, MiniPCB13, MiniPCB2         |
| `teensy40`        | Teensy 4.0    | MaxPCB (4.0 variants), CNC3          |
| `teensy41`        | Teensy 4.1    | **MaxPCB4**, MaxPCB3                 |
| `blackpill_f411`  | STM32F411CE   | **MaxSTM3**                          |
| `skr_pro_f407`    | STM32F407ZGT6 | **BTT_SKR_PRO** (V1.2)               |

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

- `config_h` — base64-encoded `Config.h` (≤ 64KB after base64)
- `environment` — one of `esp32`, `teensy40`, `teensy41`, `blackpill_f411`
- `request_id` — UUID set by the caller so results can be correlated

The run is named `onstepx-build req=<uuid> env=<env>` so callers can find their
run in `/repos/{owner}/{repo}/actions/runs?event=workflow_dispatch`.

## Do not edit `OnStepX/` by hand

The workflow wipes `OnStepX/` and re-clones `hjd1964/OnStepX` on every build.
