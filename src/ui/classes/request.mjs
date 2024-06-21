import {signal} from "https://fjs.targoninc.com/f.mjs";

export class Request {
    apiUrl = "http://localhost:8080/send-request";
    storageImplementation = sessionStorage;

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
        this.cacheLocally();
    }

    updateMethod(method) {
        this.method = method;
        this.cacheLocally();
    }

    updateHeaders(headers) {
        this.headers = headers;
        this.cacheLocally();
    }

    updateBody(body) {
        this.body = body;
        this.cacheLocally();
    }

    cacheLocally() {
        this.storageImplementation.setItem(this.url, JSON.stringify(this));
        this.storageImplementation.setItem("lastUrl", this.url);
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

    fillFromLocalCache() {
        const lastUrl = this.storageImplementation.getItem("lastUrl");
        if (lastUrl) {
            const lastRequest = JSON.parse(this.storageImplementation.getItem(lastUrl));
            if (lastRequest) {
                this.url = lastRequest.url;
                this.method = lastRequest.method;
                this.headers = lastRequest.headers;
                this.body = lastRequest.body;
            }
        }
    }
}