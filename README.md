# Lockin

A tiny, premium always-on-top floating countdown timer for Windows and macOS. Set days, hours, minutes and seconds, hit Start, and it floats above everything else while you lock in.

## Screenshots

| Setup | Running |
| :---: | :-----: |
| ![Setup screen](screenshots/setup-snap.png) | ![Running timer](screenshots/running-snap.png) |

## Features

- **Frameless floating window** — transparent with rounded corners, no black box
- **Always on top** and draggable anywhere on screen
- **Arbitrary durations** — days, hours, minutes, seconds (scroll a number to adjust)
- **Large glanceable timer** with a slim progress bar
- **Icon-only controls** — pause/resume and reset
- **Soft chime** when time's up
- Desktop and Start Menu shortcuts via the Windows installer

## Download

Get **Lockin 1.0** from the [Releases](https://github.com/AvinashT1625/lockin-github-repo/releases/tag/v1.0) page.

**Windows** (Windows 10/11, 64-bit)
1. Download `Lockin-1.0.exe`, run the installer, and follow the prompts
2. Launch Lockin from the Start menu

**macOS** (macOS 11+, 64-bit)
1. Download `Lockin-1.0-mac.zip`, unzip it, and drag `Lockin.app` into Applications
2. On first launch, right-click the app → **Open** → **Open**

> The Mac app isn't signed yet, so Gatekeeper blocks a normal double-click on first launch — right-click → Open bypasses it once, then it opens normally.

Windows installers are code-signed free of charge by the [SignPath Foundation](https://signpath.org) — see [docs/CODE-SIGNING-POLICY.md](docs/CODE-SIGNING-POLICY.md). (The signed binaries show "SignPath Foundation" as the publisher.)

## Building from source

Prerequisites: Node.js 20+ and npm.

```bash
npm ci
npm run ui:build      # build the Next.js static UI into ./out
npx electron-builder --win nsis --publish never   # Windows installer
npx electron-builder --mac --publish never        # macOS app (zip)
```

Notes:
- On native Windows, set `build.win.signAndEditExecutable` to `true` (the CI
  workflow does this) so electron-builder stamps the exe icon and version
  metadata itself.
- On Linux, the build uses Wine + a bundled `rcedit` via `build/afterPack.js`
  (see [BUILD-NOTES.md](BUILD-NOTES.md)); the macOS `dmg` target needs
  macOS-only `hdiutil`, so Linux builds use the `zip` target instead.

## Tech

Electron + Next.js (statically exported) + React. The UI lives in `app/`,
the Electron shell in `main.js` / `preload.js`.

## License

MIT — © 2026 Avinash T. See [LICENSE](LICENSE).

## Author

Developed by [Avinash T](https://www.linkedin.com/in/avinasht1625/)
