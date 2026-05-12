const { app, BrowserWindow, ipcMain, screen } = require('electron');
const { uIOhook } = require('uiohook-napi');
const path = require('path');

let overlayWindow = null;
let settingsWindow = null;
let isActive = true;
let currentDisplayId = null;

function createOverlayWindow(displayId = null) {
  if (overlayWindow) {
    overlayWindow.close();
    overlayWindow = null;
  }

  const displays = screen.getAllDisplays();
  // Find display by ID (loose equality since displayId might be string from IPC)
  let targetDisplay = displays.find(d => d.id == displayId) || screen.getPrimaryDisplay();
  currentDisplayId = targetDisplay.id;

  const workArea = targetDisplay.workArea;
  const winHeight = Math.floor(workArea.height * 0.4);

  overlayWindow = new BrowserWindow({
    width: workArea.width,
    height: winHeight,
    x: workArea.x,
    y: workArea.y + workArea.height - winHeight,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.loadFile('overlay.html');

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 450,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: 'Typing Garden Settings',
    autoHideMenuBar: true,
  });

  settingsWindow.loadFile('index.html');

  settingsWindow.webContents.on('did-finish-load', () => {
    const displays = screen.getAllDisplays().map(d => ({
      id: d.id,
      bounds: d.bounds,
      isPrimary: d.id === screen.getPrimaryDisplay().id
    }));
    settingsWindow.webContents.send('displays-info', displays, currentDisplayId);
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
    app.quit();
  });
}

app.whenReady().then(() => {
  createOverlayWindow();
  createSettingsWindow();

  uIOhook.on('keydown', (e) => {
    if (isActive && overlayWindow) {
      overlayWindow.webContents.send('key-pressed');
    }
  });
  
  uIOhook.start();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createOverlayWindow();
      createSettingsWindow();
    }
  });
});

app.on('window-all-closed', () => {
  uIOhook.stop();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('update-settings', (event, settings) => {
  isActive = settings.isActive;
  
  if (settings.displayId && settings.displayId != currentDisplayId) {
    createOverlayWindow(settings.displayId);
  }

  if (overlayWindow) {
    overlayWindow.webContents.send('settings-changed', settings);
  }
});
