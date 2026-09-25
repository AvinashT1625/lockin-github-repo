# Build notes — Lockin Windows installer

## What was built
- NSIS installer `Lockin-Setup-v10.exe` (180,220,318 bytes), built 2026-09-25
  with electron-builder 25.1.8 on Linux.
- SHA-256: `b7531c132ccc5fcefcb434c1bdfbf055916e3bcbba88ecb8289bed5016de7159`
- Config (package.json `build`): appId `com.charlie.focustimer`, productName
  `Lockin`, NSIS assisted (`oneClick: false`), per-user
  (`perMachine: false`), Desktop + Start Menu shortcuts named `Lockin`.
- Icon: minimal arc design (dark rounded square, blue progress arc, white
  center dot) drawn programmatically at `build/icon.png` (1600x1600) +
  multi-size `build/icon.ico`.
- Running view (redesigned 2026-09-25 from user's screenshot feedback):
  timer is the hero, FOCUSING status label removed, Pause/Reset are quiet
  text buttons; timer first set to 48/40/33px (too big per user), then
  dialed back to 36/30/25px with run window 240x110, then 28/24/20px with
  run window 200x84 (setup stays 252x168). Setup view given a premium
  redesign the same day: gradient card with inset top highlight, 16px
  radius, refined unit cards with focus glow, iOS-style Start button
  with depth shadow. 2026-09-25 clipping fix: the renderer now measures
  the real rendered card height (ResizeObserver) and the shell applies it
  with useContentSize + setContentSize, so Windows frame insets and
  font/DPI differences can no longer cut the card. 2026-09-25: run view
  timer enlarged to 38/32/26px, Pause/Reset became icon-only SVG buttons
  (pause/play toggle + reset arrow), modal kept at the same small size.
  2026-09-25 follow-up: growing the window back (run→setup) was still
  clipped on Windows — the per-view observer missed the transition and the
  non-resizable shell swallowed the grow. Now a single persistent
  ResizeObserver on document.body re-reports on any layout change, and the
  shell briefly unlocks resizability around setContentSize (with an
  equality skip to avoid loops). 2026-09-25 v9 follow-up: the persistent
  observer watched document.body, which never changes size (pinned to the
  viewport), so run→setup sent no resize at all. Fixed with a
  MutationObserver that re-attaches the ResizeObserver to the remounted
  card on every view switch, plus rAF/delayed re-reports.
- Unsigned build — Windows SmartScreen may show "Windows protected your PC"
  on first run. Click "More info" → "Run anyway".
- Uninstall the old "Focus Timer" product before installing Lockin (same
  appId but renamed product installs to a new folder/Start Menu entry).

## Linux rebuild workaround (Wine can't run NSIS here)
`electron-builder` on Linux runs the NSIS BUILD_UNINSTALLER stub under Wine
to generate `__uninstaller-*.exe`. Under Kron4ek Wine 11.18 (wow64) the NSIS
stub spins at ~100% CPU forever and never writes the uninstaller (both the
stub and the full installer do this — a Wine/NSIS incompatibility, not an
installer defect).

Workaround: patched
`node_modules/app-builder-lib/out/targets/nsis/NsisTarget.js`
(`computeScriptAndSignUninstaller`) so that on `process.platform === "linux"`
it calls `UninstallerReader.exec(installerPath, uninstallerPath)` — the same
extraction electron-builder already uses as its macOS Catalina fallback —
instead of `execWine(...)`. All other platforms keep stock behavior.

The patch lives in `node_modules` and will NOT survive `npm install`. To
rebuild on Linux after a fresh install, re-apply the patch first, then:

```bash
npx electron-builder --win nsis --publish never
```

No Wine/Xvfb needed at all with the patch. Native `makensis` (from the
electron-builder nsis cache) handles both compiles.

## Icon + version-info stamping (automatic via afterPack hook)
`win.signAndEditExecutable` is `false` in package.json, so electron-builder
skips rcedit — the packaged exe would otherwise keep the stock Electron icon
and version info. This is now handled automatically by
`build/afterPack.js` (wired via `"afterPack": "build/afterPack.js"` in
package.json). After packing, the hook runs the bundled
`build/rcedit-x64.exe` under Wine (~5 s) and stamps
`release/win-unpacked/Lockin.exe` with `build/icon.ico` plus version
strings: ProductName `Lockin`, CompanyName `Avinash T`,
LegalCopyright `Copyright © 2026 Avinash T`, FileDescription
`Lockin focus timer`, InternalName `Lockin`, OriginalFilename
`Lockin.exe`. Verified in v2: the 256px PNG blob from `build/icon.ico`
is present in the exe, and UTF-16 `Avinash T` / `Lockin` strings are in
the version resource. The NSIS target then packages the stamped exe, so no
manual step or second installer build is needed.

rcedit-x64.exe (v2.0.0) is committed at `build/rcedit-x64.exe` so it
survives `npm install`; unlike NSIS binaries, rcedit runs fine under
Kron4ek Wine 11.18. Keep `signAndEditExecutable: false`: letting
electron-builder run rcedit itself risks hitting the Wine exec hang
mid-build. The manual-stamping command below is kept as a fallback only.

```bash
export PATH=/home/hatch/wine-build/wine-11.18-amd64-wow64/bin:$PATH
wine /tmp/rcedit/rcedit-x64.exe release/win-unpacked/Lockin.exe \
  --set-icon build/icon.ico \
  --set-version-string ProductName "Lockin" \
  --set-version-string CompanyName "Avinash T" \
  --set-version-string LegalCopyright "Copyright © 2026 Avinash T" \
  --set-version-string FileDescription "Lockin focus timer" \
  --set-version-string InternalName "Lockin" \
  --set-version-string OriginalFilename "Lockin.exe"
```

rcedit-x64.exe (v2.0.0, from github.com/electron/rcedit releases) is cached at
`/tmp/rcedit/` — re-download if missing. Unlike NSIS binaries, rcedit runs
fine under this Wine build (~5 s). THEN rebuild the NSIS installer so the
package picks up the stamped exe. Keep `signAndEditExecutable: false`:
letting electron-builder run rcedit itself risks hitting the Wine exec hang
mid-build.

## On Windows
No patch needed — `npm install` then the same command works natively.

## macOS dmg builds on Linux (2026-09-25)
- electron-builder's `dmg-builder` requires the `dmg-license` module at load time,
  but that package is darwin-only and npm refuses to install it on Linux.
- Fix: local stub at `node_modules/dmg-license/` (package.json + index.js exporting
  a never-called `dmgLicenseFromJSON`). It is only *called* when the dmg has license
  files configured — we ship none (`addLicenseToDmg` returns early), so the stub is
  never invoked. Re-create after `npm install`.
- `build/icon.icns` is generated from `build/icon.png` (1600x1600) with an embedded
  Python/Pillow script (PNG-compressed entries for 16..1024 px); electron-builder
  cannot convert png->icns on Linux by itself.
- DMG cannot be built on Linux: dmg-builder shells out to macOS-only `hdiutil`.
  Use the `zip` target for mac instead (Lockin.app zipped — standard mac distribution).
