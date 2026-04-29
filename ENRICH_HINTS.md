# enrich_hints.mjs — sync Config.h comments into the configurator UI

A one-shot dev tool that reads upstream OnStepX / SmartHandController /
SmartWebServer `Config.h` files, extracts the inline `// OFF, ON Reverses ...`
style comment from each `#define` line, and injects it next to the matching
form-field hint in `index.html` of the configurator repo.

This script is **not** a runtime dependency of the build service — it lives here
because the build service is the natural workshop for tooling that touches both
upstream sources and the configurator HTML.

## What it produces

For every form input in the configurator whose `id="…"` matches a `#define`
name in upstream `Config.h` (with optional `SHC_` / `SWS_` prefix stripped),
it appends a sibling element next to the existing field-hint:

```html
<span class="field-hint">Reverse movement direction</span>
<span class="config-comment">// ON Reverses movement direction, or reverse wiring instead to correct.</span>
```

The `.config-comment` class (defined in `index.html`) renders the upstream text
in a green monospace italic underneath the regular hint.

## Inputs

Hard-coded paths inside the script:

| Source | Path | Purpose |
|---|---|---|
| OnStepX `Config.h` | `C:/Users/Bogdan/Desktop/OnStepX-github configurator/OnStepX/Config.h` | Drives Controller / Axis* / Mount / Rotator / Focuser / Auxiliary tabs |
| OnStepX `Extended.config.h` | same dir | Extra OnStepX defines |
| SWS `Config.h` | `C:/Users/Bogdan/AppData/Local/Temp/sws_ref/Config.h` | Drives SWS-prefixed fields |
| SWS `Extended.config.h` | same dir | Network credentials block (AP_*, STA_*, MAC, NV_WIPE, …) |
| SHC `Config.h` | `C:/Users/Bogdan/AppData/Local/Temp/sws_ref/SHC_Config.h` | Drives SHC-prefixed fields |
| SHC `Extended.config.h` | same dir | Extra SHC defines |
| Target HTML | `C:/Users/Bogdan/Desktop/OnStepX-github configurator/index.html` | Patched in place |

The Windows-style absolute paths are deliberate (this is christm45's local dev
setup). Adjust the constants at the top of the script for other machines.

## Refreshing the upstream copies

```bash
# OnStepX is checked into a long-lived clone next to the configurator
git -C "/c/Users/Bogdan/Desktop/OnStepX-github configurator/OnStepX" pull

# SWS + SHC live in a temp dir; refresh with curl
mkdir -p /tmp/sws_ref
curl -fsSL https://raw.githubusercontent.com/hjd1964/SmartWebServer/main/Config.h          -o /tmp/sws_ref/Config.h
curl -fsSL https://raw.githubusercontent.com/hjd1964/SmartWebServer/main/Extended.config.h -o /tmp/sws_ref/Extended.config.h
curl -fsSL https://raw.githubusercontent.com/hjd1964/SmartHandController/main/Config.h          -o /tmp/sws_ref/SHC_Config.h
curl -fsSL https://raw.githubusercontent.com/hjd1964/SmartHandController/main/Extended.config.h -o /tmp/sws_ref/SHC_Extended.config.h
```

(The MSYS `/tmp/...` path resolves to `C:/Users/Bogdan/AppData/Local/Temp/...`
which is what Node sees — that mismatch is why the script's path constants
use the Windows form, not `/tmp/...`.)

## Run

```bash
node enrich_hints.mjs
```

Expected output:

```
loaded: OnStepX=199, SWS=46, SHC=18
appended:           197
skipped (already):  0
skipped (no id):    36
unmatched IDs (no upstream comment):
  COMPILE_ENV
```

`COMPILE_ENV` is configurator-only (build-tab choice, not a `#define`) so it's
expected to be unmatched. The `36` skipped rows are field-row blocks that
contain no form input id (buttons, info rows, etc.) — also expected.

## When to re-run

- Upstream OnStepX / SWS / SHC `Config.h` adds, removes, or rewords a `#define`
  comment. (Watch the `hjd1964/OnStepX`, `hjd1964/SmartWebServer`,
  `hjd1964/SmartHandController` commit feeds.)
- A new form field is added to the configurator that mirrors an upstream
  `#define` and you want the inline comment to follow.

The script is **idempotent** — a row that already has a `.config-comment` is
skipped, so re-running after partial work is safe. It rewrites the comment if
upstream changed (because the previous comment is preserved verbatim and the
script only touches rows lacking the class).

> **Note on idempotency:** because the script only injects when no
> `.config-comment` exists, refreshing upstream and re-running will *not*
> overwrite stale comments. To force a refresh, first remove all
> `<span class="config-comment">…</span>` from `index.html`
> (`sed -i 's|<span class="config-comment">[^<]*</span>||g' index.html`),
> then re-run the script.

## Verifying

```bash
cd "/c/Users/Bogdan/Desktop/OnStepX-github configurator"
# count enriched rows (should track total #defines in upstream)
grep -c 'class="config-comment"' index.html
# parse-check both <script> blocks
awk 'NR>=3679 && NR<=4663' index.html > /tmp/c1.js && node --check /tmp/c1.js
awk 'NR>=4667 && NR<=6371' index.html > /tmp/c2.js && node --check /tmp/c2.js
# div-tag balance
grep -oE '<div|</div>' index.html | sort | uniq -c
```

(Line ranges drift as the file grows — re-locate `<script>` / `</script>` if
the parse-check splits across the boundary.)
