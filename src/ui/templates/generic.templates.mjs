import {computedSignal, create, FjsObservable, ifjs, signal, signalMap} from 'https://fjs.targoninc.com/f.mjs';
import {testImage} from "../classes/defaults.mjs";

export class GenericTemplates {
    static input(type, name, value, placeholder, label, id, classes = [], onchange = () => {}, oninput = () => {}) {
        return create("label")
            .classes("flex-v", ...classes)
            .for(name)
            .children(
                create("input")
                    .type(type)
                    .classes("full-width")
                    .name(name)
                    .value(value)
                    .placeholder(placeholder)
                    .id(id)
                    .onchange(e => {
                        onchange(e.target.value);
                    })
                    .oninput(oninput)
                    .build()
            ).build();
    }

    static icon(icon, classes = [], tag = "span") {
        if (!icon) {
            icon = testImage;
        }

        if ((icon.constructor === String && (icon.includes(".") || icon.startsWith("data:image"))) || (icon.constructor === FjsObservable && icon.value &&
            (icon.value.includes(".") || icon.value.startsWith("data:image")))) {
            return create("img")
                .classes("icon", ...classes)
                .src(icon)
                .build();
        }

        return create(tag)
            .classes("material-symbols-outlined", ...classes)
            .text(icon)
            .build();
    }

    static buttonWithIcon(icon, text, onclick, classes = [], iconClasses = []) {
        return create("button")
            .classes("flex", ...classes)
            .onclick(onclick)
            .children(
                GenericTemplates.icon(icon, iconClasses),
                ifjs(text, create("span")
                    .text(text)
                    .build()),
            ).build();
    }

    static infoText(icon, text, classes = [], iconClasses = []) {
        return create("div")
            .classes("flex", ...classes)
            .children(
                ifjs(icon, GenericTemplates.icon(icon, iconClasses)),
                ifjs(text, create("span")
                    .text(text)
                    .build()),
            ).build();
    }

    static spinner(circleCount = 4, delay = 0.2) {
        return create("div")
            .classes("spinner")
            .children(
                ...Array.from({length: circleCount}, (_, i) => {
                    return create("div")
                        .classes("spinner-circle")
                        .styles("animation-delay", `-${i * delay}s`)
                        .build();
                })
            ).build();
    }

    /**
     * @param {string|null} label
     * @param {Array<{text: string, value: any}>} options
     * @param {any} value
     * @param {(value: any) => void} onchange
     */
    static select(label, options, value, onchange) {
        return create("div")
            .classes("flex", "align-center")
            .children(
                ifjs(label, create("span")
                    .text(label)
                    .build()),
                create("div")
                    .classes("select")
                    .children(
                        create("select")
                            .onchange((e) => {
                                onchange(e.target.value);
                            })
                            .children(
                                ...options.map(option => {
                                    const selected = computedSignal(value, value => option.value === value);

                                    return create("option")
                                        .text(option.text)
                                        .value(option.value)
                                        .selected(selected)
                                        .onclick(() => {
                                            onchange(option.value);
                                        })
                                        .build();
                                })
                            ).build()
                    ).build()
            ).build();
    }

    static bodyDisplay(json) {
        const content = computedSignal(json, json => json ? JSON.stringify(json, null, 4) : "");

        return create("div")
            .classes("flex-grow", "body-display")
            .children(
                create("pre")
                    .text(content)
                    .build()
            ).build();
    }

    static collapsible(text, content, classes = []) {
        const uniqueId = Math.random().toString(36).substring(7);
        const toggled = signal(false);
        const iconClass = computedSignal(toggled, on => on ? "rot90" : "rot0");
        let contentElement;

        contentElement = create("div")
            .classes("collapsible-content")
            .id(uniqueId)
            .children(content)
            .build()

        return create("details")
            .classes("collapsible", "flex-v", ...classes)
            .children(
                create("summary")
                    .classes("collapsible-header", "flex", "align-center")
                    .onclick(() => {
                        toggled.value = !toggled.value;
                    })
                    .children(
                        GenericTemplates.icon("expand_circle_right", [iconClass]),
                        create("span")
                            .classes("collapsible-title")
                            .text(text)
                            .build()
                    ).build(),
                contentElement
            ).build();
    }

    static headers(headers) {
        const useHeaders = computedSignal(headers, h => {
            return Object.keys(h).map(key => {
                return {name: key, value: h[key]};
            });
        });

        return create("div")
            .classes("flex-v")
            .children(
                GenericTemplates.buttonWithIcon("add", "Add Header", () => {
                    headers.value = {
                        ...headers.value,
                        ["Header-" + Math.random().toString(36).substring(7)]: "",
                    };
                }),
                signalMap(useHeaders, create("div").classes("flex-v"),
                    header => GenericTemplates.header(headers, header))
            ).build();
    }

    static header(headers, header) {
        return create("div")
            .classes("flex", "align-center")
            .children(
                create("span")
                    .text("Header: ")
                    .build(),
                GenericTemplates.input("text", "headername", header.name, "Header Name", "Header Name", "header-name", ["flex-grow"], (val) => {
                    const newHeaders = {
                        ...headers.value,
                        [val]: header.value,
                    };
                    delete newHeaders[header.name];
                    headers.value = newHeaders;
                }),
                GenericTemplates.input("text", "headervalue", header.value, "Header Value", "Header Value", "header-value", ["flex-grow"], (val) => {
                    headers.value = {
                        ...headers.value,
                        [header.name]: val,
                    };
                }),
            ).build();
    }
}