import {ApiCache} from "./apicache.mjs";
import {signal} from "https://fjs.targoninc.com/f.mjs";

export class Response {
    cache = ApiCache;

    constructor({json, body, status, statusText, headers, time}) {
        this.json = json;
        this.body = body;
        this.status = status;
        this.statusText = statusText;
        this.headers = headers;
        this.time = time;
        this.signal = signal({
            json: this.json,
            body: this.body,
            status: this.status,
            statusText: this.statusText,
            headers: this.headers,
            time: this.time,
        });
    }

    static from(response) {
        return new Response({
            json: response.json,
            body: response.body,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            time: response.time,
        });
    }

    updateJson(json) {
        this.json = json;
        this.cacheLocally().then();
    }

    updateBody(body) {
        this.body = body;
        this.cacheLocally().then();
    }

    updateStatus(status) {
        this.status = status;
        this.cacheLocally().then();
    }

    updateStatusText(statusText) {
        this.statusText = statusText;
        this.cacheLocally().then();
    }

    updateHeaders(headers) {
        this.headers = headers;
        this.cacheLocally().then();
    }

    updateTime(time) {
        this.time = time;
        this.cacheLocally().then();
    }

    async cacheLocally() {
        await this.cache.set("lastResponse", JSON.parse(JSON.stringify(this)));
    }

    async fillFromLocalCache() {
        const lastResponse = await this.cache.get("lastResponse");
        if (lastResponse) {
            this.json = lastResponse.json;
            this.body = lastResponse.body;
            this.status = lastResponse.status;
            this.statusText = lastResponse.statusText;
            this.headers = lastResponse.headers;
            this.time = lastResponse.time;
            this.signal.value = lastResponse;
        } else {
            this.json = null;
            this.body = null;
            this.status = null;
            this.statusText = null;
            this.headers = null;
            this.time = null;
            this.signal.value = null;
        }
    }

    async fromResponse(res) {
        const body = await res.json();
        this.json = body.json;
        this.body = body.body;
        this.status = body.status;
        this.statusText = body.statusText;
        this.headers = body.headers;
        this.time = body.time;
        this.signal.value = body;
    }
}