import fs from "fs";

export class RequestStorage {
    static folder() {
        if (!fs.existsSync("storage/requests")) {
            fs.mkdirSync("storage/requests");
        }
    }

    static path(id) {
        RequestStorage.folder();
        return `storage/requests/${id}.request.json`;
    }

    static async newRequest(request) {
        const path = RequestStorage.path(request.id);
        if (fs.existsSync(path)) {
            return {
                error: "Request with same ID already exists",
            };
        } else {
            fs.writeFileSync(path, JSON.stringify(request));
            return {
                success: true,
            };
        }
    }

    static async updateRequest(request) {
        const path = RequestStorage.path(request.id);
        if (fs.existsSync(path)) {
            fs.writeFileSync(path, JSON.stringify(request));
            return {
                success: true,
            };
        } else {
            return {
                error: "Request not found",
            };
        }
    }

    static async getSavedRequests() {
        RequestStorage.folder();
        return fs.readdirSync("storage/requests").map(file => {
            const content = fs.readFileSync(`storage/requests/${file}`);
            return JSON.parse(content.toString());
        });
    }

    static async getSavedRequest(id) {
        const path = RequestStorage.path(id);
        if (fs.existsSync(path)) {
            const content = fs.readFileSync(path);
            return JSON.parse(content.toString());
        } else {
            return {
                error: "Request not found",
            };
        }
    }

    static async deleteRequest(id) {
        const path = RequestStorage.path(id);
        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
            return {
                success: true,
            };
        } else {
            return {
                error: "Request not found",
            };
        }
    }
}