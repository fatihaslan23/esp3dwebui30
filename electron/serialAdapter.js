/* electron/serialAdapter.js */
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

let port = null;
let parser = null;

module.exports = {
  // 1. Bilgisayardaki USB cihazlarını listele
  listPorts: async () => {
    try {
      const ports = await SerialPort.list();
      return ports;
    } catch (err) {
      console.error("Portlar listelenemedi:", err);
      return [];
    }
  },

  // 2. Yazıcıya Bağlan
  connect: (path, baudRate = 115200, onDataReceived) => {
    if (port && port.isOpen) {
      port.close();
    }

    try {
      port = new SerialPort({ path, baudRate, autoOpen: false });
      
      parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
      
      // Yazıcıdan gelen veriyi arayüze gönder
      parser.on('data', (data) => {
        if (onDataReceived) onDataReceived(data);
      });

      return new Promise((resolve, reject) => {
        port.open((err) => {
          if (err) {
            console.error('Bağlantı hatası:', err);
            reject(err.message);
          } else {
            console.log('USB Bağlantısı Başarılı:', path);
            resolve(true);
          }
        });
      });
    } catch (error) {
      return Promise.reject(error);
    }
  },

  // 3. Yazıcıya Komut Gönder (G-Code)
  send: (data) => {
    if (port && port.isOpen) {
      port.write(data + '\n');
      console.log('Gönderildi:', data);
    } else {
      console.error('Port kapalı, gönderilemedi:', data);
    }
  },

  // 4. Bağlantıyı Kes
  disconnect: () => {
    if (port && port.isOpen) {
      port.close();
    }
  }
};