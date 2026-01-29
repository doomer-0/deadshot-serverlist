const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

ipcMain.on('quit-app', () => {
    app.quit();
});

function createWindow() {
    const win = new BrowserWindow({
        width: 700,
        height: 700,
        frame: false,
        title: 'Deadshot Server List',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('src/index.html');
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    app.quit();
});
