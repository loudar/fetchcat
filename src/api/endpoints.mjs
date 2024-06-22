import {StorageCache} from "./storagecache.mjs";
import {RequestStorage} from "./requestStorage.mjs";

export function sendRequest() {
    return async (req, res) => {
        const resBody = req.body;
        const url = resBody.url;
        if (!url) {
            res.status(400).send({
                error: "URL is required",
            });
            return;
        }
        const reqHeaders = {};
        if (resBody.headers) {
            for (const key in resBody.headers) {
                if (key && resBody.headers[key]) {
                    reqHeaders[key] = resBody.headers[key];
                }
            }
        }
        let reqBody;
        if (resBody.body && resBody.method !== "GET" && resBody.method !== "HEAD") {
            reqBody = resBody.body;
        }

        const start = Date.now();
        let response;
        try {
            response = await fetch(url, {
                method: resBody.method,
                headers: reqHeaders,
                body: reqBody,
            });
        } catch (e) {
            res.status(200).send({
                error: e.message,
            });
            return;
        }
        const end = Date.now();
        const body = await response.text();
        let json;
        try {
            json = JSON.parse(body);
        } catch (e) {
            json = null;
        }
        let resHeaders = {};
        response.headers.forEach((value, key) => {
            resHeaders[key] = value;
        });
        let out;
        if (json) {
            out = {
                json,
                status: response.status,
                statusText: response.statusText,
                headers: resHeaders,
                time: end - start,
            };
        } else {
            out = {
                body,
                status: response.status,
                statusText: response.statusText,
                headers: resHeaders,
                time: end - start,
            };
        }
        StorageCache.set("lastResponse", out);
        res.status(200).send(out);
    };
}

export function getSavedRequests() {
    return async (req, res) => {
        const requests = await RequestStorage.getSavedRequests();
        res.status(200).send(requests);
    };
}

export function getSavedRequest() {
    return async (req, res) => {
        const id = req.query.id;
        const request = await RequestStorage.getSavedRequest(id);
        if (request.error) {
            res.status(500).send(request);
            return;
        }
        res.status(200).send(request);
    };
}

export function deleteRequest() {
    return async (req, res) => {
        const id = req.body.id;
        const del = await RequestStorage.deleteRequest(id);
        if (del.error) {
            res.status(500).send(del);
            return;
        }
        res.status(200).send();
    };
}

export function saveRequest() {
    return async (req, res) => {
        let body = req.body;
        body.saved = true;
        const newRes = await RequestStorage.newRequest(body);
        if (newRes.error === "Request with same ID already exists") {
            const updateRes = await RequestStorage.updateRequest(body);
            if (updateRes.error) {
                res.status(500).send(updateRes);
                return;
            }
        }
        res.status(200).send();
    };
}