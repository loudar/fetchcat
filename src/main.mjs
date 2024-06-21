import {app, BrowserWindow} from 'electron';
import express from 'express';
import {StorageCache} from "./api/storagecache.mjs";

app.setAppUserModelId('fetchcat');

function startServer() {
    const app = express();
    app.use(express.json());
    app.post('/send-request', async (req, res) => {
        const resBody = req.body;
        const url = resBody.url;
        if (!url) {
            res.status(400).send({
                error: "URL is required",
            });
            return;
        }

        const start = Date.now();
        const response = await fetch(url, {
            method: resBody.method,
            headers: resBody.headers,
            body: resBody.body,
        });
        const end = Date.now();
        const body = await response.text();
        let json;
        try {
            json = JSON.parse(body);
        } catch (e) {
            json = null;
        }
        if (json) {
            res.status(200).send({
                json,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                time: end - start,
            });
        } else {
            res.status(200).send({
                body,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                time: end - start,
            });
        }
    });
    StorageCache.ensurePath();
    app.get('/cache', async (req, res) => {
        const key = req.query.key;
        console.log(`GET Cache ${key}`);
        const value = StorageCache.get(key);
        console.log(`Value: ${value}`);
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
    app.listen(8080, () => {
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