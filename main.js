// Electron shell: tiny frameless, transparent, always-on-top floating window.
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 252,
    height: 168,
    // Size the *content* area, not the outer frame: on Windows the OS
    // keeps invisible frame insets that used to clip the card.
    useContentSize: true,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Small floor only — the real size is driven by the renderer's
  // measured content height (see ft-size), so this must never block it.
  win.setMinimumSize(120, 40);

  // The Next.js static export lives in ./out after `npm run ui:build`.
  win.loadFile(path.join(__dirname, 'out', 'index.html'));

  ipcMain.on('ft-close', () => {
    if (win) win.close();
  });
  ipcMain.on('ft-open-external', (_event, url) => {
    // Only allow https links — opens in the user's default browser.
    if (typeof url === 'string' && /^https:\/\//.test(url)) shell.openExternal(url);
  });
  ipcMain.on('ft-size', (_event, w, h) => {
    if (!win || win.isDestroyed() || !Number.isFinite(w) || !Number.isFinite(h))
      return;
    w = Math.round(w);
    h = Math.round(h);
    const [cw, ch] = win.getContentSize();
    if (cw === w && ch === h) return;
    // Growing a non-resizable window can be swallowed on Windows, so
    // briefly unlock resizing around the programmatic resize.
    win.setResizable(true);
    win.setContentSize(w, h);
    win.setResizable(false);
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
