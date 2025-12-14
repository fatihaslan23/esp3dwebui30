/* electron/main.js */
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // 1. Tarayıcı Penceresini Oluştur
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "RootClay Controller",
    webPreferences: {
      nodeIntegration: false, // Güvenlik için kapalı
      contextIsolation: true, // Güvenlik için açık
      preload: path.join(__dirname, 'preload.js') // Köprü dosyamız
    }
  });

  // 2. Arayüzü Yükle
  // Geliştirme aşamasında localhost'tan, bitince dosyadan yükleyeceğiz.
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Geliştirici araçlarını aç (İsterseniz yorum satırı yapabilirsiniz)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});