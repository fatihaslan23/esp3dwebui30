/* electron/preload.js */
const { contextBridge, ipcRenderer } = require('electron');

// Web Arayüzüne (React/Preact) güvenli bir API sunuyoruz
contextBridge.exposeInMainWorld('electronAPI', {
  // USB Bağlantısı mı yoksa Wifi mı olduğunu anlamak için bir bayrak
  isElectron: true,
  
  // İleride buraya 'connectUsb', 'sendCommand' gibi fonksiyonlar ekleyeceğiz
  checkConnection: () => console.log("Electron Bridge Çalışıyor!")
});