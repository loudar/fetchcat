import {app, BrowserWindow} from 'electron';
import express from 'express';

app.setAppUserModelId('fetchcat');

function startServer() {
    const app = express();
    app.use(express.json());
    app.post('/send-request', async (req, res) => {
        const resBody = req.body;

        const start = Date.now();
        const response = await fetch(resBody.url, {
            method: resBody.method,
            headers: resBody.headers,
            body: resBody.body,
        });
        const end = Date.now();
        const body = await response.text();
        await new Promise(resolve => setTimeout(resolve, 10000));
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