import {signal} from "https://fjs.targoninc.com/f.mjs";
import {ApiCache} from "./apicache.mjs";
import {newId} from "./ui.mjs";

export class Request {
    static apiUrl = "http://localhost:8080/";
    cache = ApiCache;

    constructor({url, method, headers, body, name, id, saved}) {
        this.signal = signal({});
        this.new({url, method, headers, body, name, id, saved});
    }

    static from(request) {
        return new Request({
            url: request.url ?? "",
            method: request.method,
            headers: request.headers,
            body: request.body,
            name: request.name ?? "",
            saved: request.saved ?? false
        });
    }

    new({url, method, headers, body, name, id, saved}) {
        this.url = url;
        this.method = method;
        this.headers = headers;
        this.body = body;
        this.name = name;
        this.saved = saved;
        this.id = id ?? newId();
        this.signal.value = this.asObject();
    }

    toPayload() {
        return JSON.stringify(this.asObject());
    }

    asObject() {
        return {
            url: this.url ?? "",
            method: this.method ?? "GET",
            headers: this.headers ?? {},
            body: this.body ?? null,
            name: this.name ?? "",
            id: this.id,
            saved: this.saved ?? false
        }
    }

    updateUrl(url) {
        this.url = url;
        this.saved = false;
        this.cacheLocally().then();
    }

    updateMethod(method) {
        this.method = method;
        this.saved = false;
        this.cacheLocally().then();
    }

    updateHeaders(headers) {
        this.headers = headers;
        this.saved = false;
        this.cacheLocally().then();
    }

    updateBody(body) {
        this.body = body;
        this.saved = false;
        this.cacheLocally().then();
    }

    updateName(name) {
        this.name = name;
        this.saved = false;
        this.cacheLocally().then();
    }

    async cacheLocally() {
        await this.cache.set("currentRequest", JSON.parse(JSON.stringify(this)));
        this.signal.value = this.asObject();
    }

    async persist(saving) {
        const res = await fetch(`${Request.apiUrl}save-request`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: this.toPayload(),
        });
        saving.value = false;
        this.saved = true;
        await this.cacheLocally();
        return res;
    }

    async send(sending = signal(false)) {
        sending.value = true;
        const res = await fetch(`${Request.apiUrl}send-request`, {
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

    static async getSaved() {
        const res = await fetch(`${Request.apiUrl}get-saved-requests`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        });
        return await res.json();
    }

    static async delete(id) {
        await fetch(`${Request.apiUrl}delete-request`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({id}),
        });
    }

    async fillFromLocalCache() {
        const currentRequest = await this.cache.get("currentRequest");
        if (currentRequest) {
            this.url = currentRequest.url ?? "";
            this.method = currentRequest.method;
            this.headers = currentRequest.headers;
            this.body = currentRequest.body;
            this.name = currentRequest.name ?? "";
            this.id = currentRequest.id ?? newId();
            this.saved = currentRequest.saved ?? false;
            this.signal.value = this.asObject();
        }
    }

    async overwrite(request) {
        this.url = request.url;
        this.method = request.method;
        this.headers = request.headers;
        this.body = request.body;
        this.name = request.name;
        this.id = request.id;
        this.saved = request.saved;
        await this.cacheLocally()
    }
}