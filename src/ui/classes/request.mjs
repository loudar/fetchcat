import {signal} from "https://fjs.targoninc.com/f.mjs";
import {ApiCache} from "./apicache.mjs";

export class Request {
    apiUrl = "http://localhost:8080/send-request";
    cache = ApiCache;

    constructor({url, method, headers, body}) {
        this.url = url;
        this.method = method;
        this.headers = headers;
        this.body = body;
    }

    static from(request) {
        return new Request({
            url: request.url,
            method: request.method,
            headers: request.headers,
            body: request.body,
        });
    }

    toPayload() {
        return JSON.stringify({
            url: this.url ?? "",
            method: this.method ?? "GET",
            headers: this.headers ?? {},
            body: this.body ?? null,
        });
    }

    updateUrl(url) {
        this.url = url;
        this.cacheLocally().then();
    }

    updateMethod(method) {
        this.method = method;
        this.cacheLocally().then();
    }

    updateHeaders(headers) {
        this.headers = headers;
        this.cacheLocally().then();
    }

    updateBody(body) {
        this.body = body;
        this.cacheLocally().then();
    }

    async cacheLocally() {
        await this.cache.set("unsavedRequest", JSON.parse(JSON.stringify(this)));
    }

    async send(sending = signal(false)) {
        sending.value = true;
        const res = await fetch(this.apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: this.toPayload(),
        });
        sending.value = false;
        return res;
    }

    async fillFromLocalCache() {
        const unsavedRequest = await this.cache.get("unsavedRequest");
        if (unsavedRequest) {
            this.url = unsavedRequest.url;
            this.method = unsavedRequest.method;
            this.headers = unsavedRequest.headers;
            this.body = unsavedRequest.body;
        }
    }
}