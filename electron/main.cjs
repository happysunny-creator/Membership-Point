const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

const isDev = process.env.ELECTRON_START_URL ? true : false;
const startUrl = process.env.ELECTRON_START_URL
  || pathToFileURL(path.join(__dirname, '..', 'dist', 'index.html')).toString();

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: '남산 리더십센터 / 스마일즈 멤버십 포인트 관리 Dashboard',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);
  win.loadURL(startUrl);

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
