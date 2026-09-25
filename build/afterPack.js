// electron-builder afterPack hook: stamp the Windows app exe with our icon
// and version metadata using rcedit under Wine.
//
// Why: win.signAndEditExecutable is false (letting electron-builder run
// rcedit itself risks the Wine exec hang mid-build), so without this hook
// the packaged exe would keep the stock Electron icon and version info.
// This runs after files land in win-unpacked but before the NSIS installer
// is built, so the installer always picks up the stamped exe.
//
// On native Windows builds this hook is a no-op: set signAndEditExecutable
// to true there instead and remove afterPack from package.json.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WINE_BIN = '/home/hatch/wine-build/wine-11.18-amd64-wow64/bin';

exports.default = async function stampExe(context) {
  if (process.platform !== 'linux') {
    console.log('afterPack: skipping exe stamp (not linux)');
    return;
  }
  const wine = path.join(WINE_BIN, 'wine');
  if (!fs.existsSync(wine)) {
    console.log('afterPack: wine not found, skipping exe stamp');
    return;
  }
  const exe = path.join(context.appOutDir, 'Lockin.exe');
  if (!fs.existsSync(exe)) {
    console.log(`afterPack: ${exe} not found, skipping exe stamp`);
    return;
  }
  const rcedit = path.join(__dirname, 'rcedit-x64.exe');
  const icon = path.join(__dirname, 'icon.ico');
  const versionStrings = {
    ProductName: 'Lockin',
    CompanyName: 'Avinash T',
    LegalCopyright: 'Copyright © 2026 Avinash T',
    FileDescription: 'Lockin focus timer',
    InternalName: 'Lockin',
    OriginalFilename: 'Lockin.exe',
  };
  const args = [rcedit, exe, '--set-icon', icon];
  for (const [k, v] of Object.entries(versionStrings)) {
    args.push('--set-version-string', k, v);
  }
  console.log(`afterPack: stamping ${exe}`);
  execFileSync(wine, args, {
    timeout: 120000,
    stdio: 'inherit',
    env: { ...process.env, PATH: `${WINE_BIN}:${process.env.PATH}` },
  });
  console.log('afterPack: exe stamp done');
};
