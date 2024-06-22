import fs from "fs";

export class StorageCache {
    static path = "./storage/cache/";

    static ensurePath() {
        if (!fs.existsSync(this.path)) {
            fs.mkdirSync(this.path, {recursive: true});
        }
    }

    static set(key, value) {
        console.log(`Cache file: ${this.path + key + ".cache"}`);
        if (value && (value.constructor === Object || value.constructor === Array)) {
            value = JSON.stringify(value);
        }
        fs.writeFileSync(this.path + key + ".cache", value ?? "");
    }

    static get(key) {
        if (!fs.existsSync(this.path + key + ".cache")) {
            return null;
        }

        const content = fs.readFileSync(this.path + key + ".cache").toString();
        try {
            return JSON.parse(content);
        } catch (e) {
            return content;
        }
    }
}