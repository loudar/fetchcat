import {create} from "https://fjs.targoninc.com/f.mjs";

export const container = document.body;

export function initialize() {
    container.appendChild(create("div").id("toasts").build());
}

export function toasts() {
    const toastsDoc = document.getElementById("toasts");
    if (!toastsDoc) {
        initialize();
        return toasts();
    } else {
        return toastsDoc;
    }
}

/**
 *
 * @param message {string}
 * @param coordinates {null | {x: number, y: number}}
 * @param type {"info" | "positive" | "sensitive" | "negative"}
 * @param timeout {number} seconds
 */
export function toast(message, coordinates = null, type = "info", timeout = 5) {
    const toast = create("div")
        .classes("toast", type)
        .children(
            create("span")
                .text(message)
                .build()
        ).build();
    if (coordinates) {
        if (coordinates.x > window.innerWidth - 200) {
            coordinates.x = window.innerWidth - 200;
        } else if (coordinates.x < 0) {
            coordinates.x = 0;
        }
        if (coordinates.y > window.innerHeight - 100) {
            coordinates.y = window.innerHeight - 100;
        } else if (coordinates.y < 0) {
            coordinates.y = 0;
        }
        toast.style.left = `${coordinates.x}px`;
        toast.style.top = `${coordinates.y}px`;
        toast.style.position = "absolute";
        document.body.appendChild(toast);
    } else {
        toasts().appendChild(toast);
    }

    setTimeout(() => {
        toast.remove();
    }, timeout * 1000);
}

export function guessType(value) {
    if (value === "true" || value === "false") {
        return "boolean";
    }
    if (value === "null") {
        return "null";
    }
    if (!isNaN(value)) {
        return "number";
    }
    return "string";
}

export function newId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}