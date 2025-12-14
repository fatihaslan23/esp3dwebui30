/* src/adapters/index.js */
import HttpAdapter from './httpAdapter';
import SerialAdapter from './serialAdapter';

// Varsayılan olarak HttpAdapter (Wi-Fi) ile başla
let currentAdapter = new HttpAdapter();
let adapterType = 'wifi';

export const getAdapter = () => {
    return currentAdapter;
};

// Adaptörü değiştirmek için bu fonksiyonu çağıracağız
export const setAdapter = (type, params) => {
    if (type === 'usb') {
        adapterType = 'usb';
        currentAdapter = new SerialAdapter();
    } else {
        adapterType = 'wifi';
        currentAdapter = new HttpAdapter();
    }
    return currentAdapter;
};

// Hangi moddayız?
export const getAdapterType = () => adapterType;