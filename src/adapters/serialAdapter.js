/* src/adapters/serialAdapter.js */

// Bu adaptör, Web Arayüzü ile Electron'daki USB kodları arasında tercümanlık yapar.
export default class SerialAdapter {
    constructor() {
        this.path = null;
        this.baudRate = 115200;
        this.listeners = [];
        
        // Electron'dan gelen veriyi dinle ve sisteme dağıt
        if (window.electronAPI) {
            window.electronAPI.onData((line) => {
                // Gelen veriyi (line) dinleyen fonksiyonlara gönder
                this.listeners.forEach(callback => callback(line));
            });
        }
    }

    // 1. Bağlan (path = COM3 gibi port ismi)
    async connect(path, baudRate = 115200) {
        this.path = path;
        this.baudRate = baudRate;
        
        if (window.electronAPI) {
            try {
                await window.electronAPI.connect(path, baudRate);
                return "connected";
            } catch (error) {
                console.error("USB Bağlantı Hatası:", error);
                throw error;
            }
        }
        return "error";
    }

    // 2. Veri Gönder (G-Code)
    async send(command) {
        if (window.electronAPI) {
            window.electronAPI.send(command);
        }
    }

    // 3. Gelen Veriyi Dinle (WebSocket mantığıyla aynı)
    onMessage(callback) {
        this.listeners.push(callback);
    }

    // 4. Bağlantı Durumu (Basitçe her zaman bağlı varsayıyoruz şimdilik)
    get state() {
        return WebSocket.OPEN; 
    }
    
    close() {
        // Gerekirse portu kapatma kodu eklenebilir
    }
}