// Safe bridge between the Next.js UI and the Electron shell.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  close: () => ipcRenderer.send('ft-close'),
  setSize: (w, h) => ipcRenderer.send('ft-size', w, h),
  openExternal: (url) => ipcRenderer.send('ft-open-external', url),
});
