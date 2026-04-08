# AGENTS.md — MeshCore Austria Flasher

This file documents the goals, constraints, and conventions for AI agents working in this repository.

## What This Repo Is

A fork of the upstream [meshcore-dev/flasher.meshcore.io](https://github.com/meshcore-dev/flasher.meshcore.io) static web flasher, customized for the Austrian MeshCore community and deployed at **https://meshcore-austria.at/flasher/**.

---

## Goals

1. **Keep in sync with upstream assets** — `css/beer.css`, `img/`, `lib/` (vue.min.js, beer.min.js, dfu.js, esp32.js, console.js, iframeResizer.contentWindow.min.js, zip.min.js) and `config.json` must always reflect the latest upstream versions. The Austria-specific app files (`index.html`, `flasher.js`, `css/flasher.css`) must NOT be overwritten wholesale; merge upstream changes carefully.

2. **All devices and firmware visible** — Upstream relies on a backend `/releases` endpoint. This fork now generates a same-origin static `releases` file and mirrors firmware assets into a local `firmware/` directory so the frontend can download binaries without browser CORS failures. All device roles (companion, repeater, room-server, etc.) must be available just as they are at https://meshcore.co.uk/flasher.html.

3. **Path-independent deployment** — The site is served from a subdirectory (`/flasher/`), not the root. All asset references must use relative `./` paths, never absolute `/` paths. This applies to: ES module imports, HTML `<link>`/`<script>` tags, `fetch()` calls for config/releases, and `config.json` `staticPath`. Firmware must resolve under `./firmware/` inside this repo.

4. **Austria-specific repeater provisioning** — After flashing a repeater, the flasher automatically applies a set of provisioning commands via USB serial (node name, admin password, TX power, GPS coordinates, and hardcoded MeshCore-Austria radio defaults). This flow is triggered by the "Repeater" role and must be preserved.

5. **Repeater config persistence** — The repeater setup form (name, password, TX power, lat/lon) is persisted in `localStorage` so the user doesn't have to re-enter it between flashes. Keep this behavior.

---

## Austria-Specific Customizations in flasher.js / index.html

- **Repeater setup form** (`article.repeater-setup`) shown before flashing when `isRepeaterRole()` is true.
- **`repeaterConfig` reactive object** with localStorage persistence watchers.
- **`provisioning` reactive object** — tracks the post-flash command sequence.
- **`hiddenRepeaterCommands`** — hardcoded AT commands applied after flash:
  - `set radio 869.618,62.5,8,8` (Austria LoRa frequency/SF/BW/CR)
  - `set radio.rxgain on`
  - `set af 9`
  - `set path.hash.mode 1`
  - `set flood.advert.interval 25`
  - `set advert.interval 240`
- **`isRepeaterRole()` / `repeaterConfigReady` / `repeaterConfigError`** — validation helpers.
- **`openSerialGUI()`** — post-flash button to open the serial config console.

---

## Constraints for AI Agents

- **Do not upload firmware to devices or use a serial monitor.** This project is build/deploy only; the user flashes manually.
- **Do not replace Austria-specific app files wholesale** when syncing upstream changes — always diff and merge.
- **Do not add docstrings, comments, or type annotations** to code you didn't change.
- **Do not over-engineer** — only make changes that are directly requested or clearly necessary.
- **Always use `./` relative paths** for everything (imports, fetch, HTML attributes). Never use absolute `/` paths.
- **Keep `releases` and `firmware/` in sync** — if release metadata is refreshed, the mirrored firmware files must be refreshed too.
- **Prefer the built-in sync workflow triggers** — scheduled sync keeps firmware current, and user-triggered web requests should use the GitHub Actions `repository_dispatch` event (`sync-firmware`) rather than adding ad-hoc browser-side sync logic.
- **commit and push after changes** are verified — the user deploys via GitHub Pages from the `main` branch.

---

## Deployment

- **Repo:** https://github.com/dabeani/flasher.meshcore-austria.at
- **Live URL:** https://meshcore-austria.at/flasher/
- **Branch:** `main`
- **Hosting:** Static files served from a subdirectory — no Node.js backend, no `/releases` server endpoint.
- **Firmware files** are mirrored into `firmware/` in this repo and served from the same origin as the flasher.

---

## Upstream References

| Resource | URL |
|---|---|
| Upstream flasher repo | https://github.com/meshcore-dev/flasher.meshcore.io |
| MeshCore GitHub releases API | https://api.github.com/repos/meshcore-dev/MeshCore/releases |
| Reference flasher | https://meshcore.co.uk/flasher.html |
