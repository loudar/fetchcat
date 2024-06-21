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