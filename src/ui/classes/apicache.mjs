export class ApiCache {
    static apiUrl = "http://localhost:8080/cache";

    static async set(key, value) {
        await fetch(this.apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                key,
                value,
            }),
        });
    }

    static async get(key) {
        const res = await fetch(this.apiUrl + "?key=" + key, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });
        const body = await res.json();
        return body.cache;
    }
}