const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const ProtocolPingCalculator = require(path.join(__dirname, 'utils', 'ProtocolPingCalculator'));

contextBridge.exposeInMainWorld('api', {
    getPing: (url) => ProtocolPingCalculator.getPing(url),
    quit: () => ipcRenderer.send('quit-app')
});
