import {app, BrowserWindow} from 'electron';
import express from 'express';
import {StorageCache} from "./api/storagecache.mjs";
import {deleteRequest, getSavedRequest, getSavedRequests, saveRequest, sendRequest} from "./api/endpoints.mjs";

app.setAppUserModelId('fetchcat');

import {updateElectronApp} from 'update-electron-app';
updateElectronApp();

const port = 48676;

async function startServer() {
    try {
        const test = await fetch(`http://localhost:${port}`);
        if (test.status === 200) {
            console.log('Server already running on a different instance');
            return;
        }
    } catch (e) {
        console.log('Server not running, starting...');
    }

    const app = express();
    app.use(express.json());
    app.get('/', (req, res) => {
        res.send('Hello World');
    });
    app.post('/send-request', sendRequest());
    app.post('/save-request', saveRequest());
    app.get('/get-saved-request', getSavedRequest());
    app.post('/delete-request', deleteRequest());
    app.get('/get-saved-requests', getSavedRequests());
    StorageCache.ensurePath();
    app.get('/cache', async (req, res) => {
        const key = req.query.key;
        console.log(`GET Cache ${key}`);
        const value = StorageCache.get(key);
        if (!value) {
            res.status(204).send({
                cache: null
            });
            return;
        }
        res.status(200).send({
            cache: value,
        });
    });
    app.post('/cache', async (req, res) => {
        const key = req.body.key;
        const value = req.body.value;
        console.log(`SET Cache ${key}: ${value}`);
        StorageCache.set(key, value);
        res.status(200).send();
    });
    app.listen(port, () => {
        console.log("Server started");
    });
}

function createWindow () {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        center: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
        }
    });

    win.loadFile('src/ui/index.html').then(r => {
        console.log('loaded');
    });

    startServer();
}

app.whenReady().then(createWindow)