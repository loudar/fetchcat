import {computedSignal, create, FjsObservable, ifjs, signal, signalMap} from 'https://fjs.targoninc.com/f.mjs';
import {testImage} from "../classes/defaults.mjs";
import {guessType, newId, toast} from "../classes/ui.mjs";

export class GenericTemplates {
    static input(type, name, value, placeholder, label, id, classes = [], onchange = () => {}, oninput = () => {}, required = false) {
        const validate = () => {
            const el = document.getElementById(id);
            if (el.required) {
                if (!el.value || el.value === "") {
                    el.classList.add("invalid");
                    el.title = `${label} is required`;
                } else {
                    el.classList.remove("invalid");
                    el.title = label;
                }
            }
        }

        const input = create("input")
            .type(type)
            .classes("full-width")
            .name(name)
            .value(value)
            .placeholder(placeholder)
            .id(id)
            .onchange(e => {
                onchange(e.target.value);
            })
            .oninput(e => {
                validate();
                oninput(e);
            });

        if (required) {
            input.required("true");
            setTimeout(validate, 100);
        }

        return create("label")
            .classes("flex-v", ...classes)
            .for(name)
            .children(
                input.build()
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
            .classes("flex", "info-pill", ...classes)
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

    static bodyDisplay(body, contentType) {
        const isJson = computedSignal(contentType, type => type && type.includes("application/json"));
        const isText = computedSignal(contentType, type => type && type.includes("text/plain"));
        const isHtml = computedSignal(contentType, type => type && type.includes("text/html"));

        return create("div")
            .classes("flex-grow", "flex-v", "body-display")
            .children(
                create("div")
                    .classes("flex")
                    .children(
                        GenericTemplates.buttonWithIcon("content_copy", "Copy", () => {
                            let text = body.value;
                            if (isJson.value) {
                                text = JSON.stringify(body.value, null, 2);
                            }
                            navigator.clipboard.writeText(text);
                            toast("Copied to clipboard", null, "positive", 2);
                        }),
                        GenericTemplates.buttonWithIcon("download", "Download", () => {
                            let downloadBody = body.value;
                            try {
                                downloadBody = JSON.stringify(downloadBody, null, 2);
                            } catch (e) {}
                            const blob = new Blob([downloadBody], {type: contentType.value});
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "response.txt";
                            a.click();
                            URL.revokeObjectURL(url);
                        }),
                    ).build(),
                ifjs(isJson, create("div")
                    .classes("json-display")
                    .children(
                        GenericTemplates.jsonDisplay(body)
                    ).build()),
                ifjs(isText, create("div")
                    .classes("text-display")
                    .text(body)
                    .build()),
                ifjs(isHtml, create("iframe")
                    .src("data:text/html;charset=utf-8," + encodeURIComponent(body.value))
                    .build()),
            ).build();
    }

    static jsonDisplay(json) {
        let template = signal(null);
        const update = (value) => {
            template.value = GenericTemplates.jsonValue("root", value);
        };
        if (!json || json.constructor !== FjsObservable) {
            return GenericTemplates.jsonValue("root", json);
        }

        json.subscribe(update);
        update(json.value);
        return template;
    }

    static jsonValue(key, json) {
        try {
            json = JSON.parse(json);
        } catch (e) {}

        if (json === null || json === undefined) {
            return GenericTemplates.jsonPrimitive(key, "null", "null");
        }

        if (json.constructor === Object) {
            return GenericTemplates.jsonObject(key, json);
        } else if (json.constructor === Array) {
            return GenericTemplates.jsonArray(key, json);
        } else {
            return GenericTemplates.jsonPrimitive(key, json);
        }
    }

    static jsonPrimitive(key, value, overrideType = null) {
        const type = overrideType ?? value.constructor.name.toLowerCase();
        const id = newId();

        return create("div")
            .classes("json-primitive", type)
            .children(
                create("span")
                    .classes("json-key", type)
                    .text(`${key}:`)
                    .build(),
                create("div")
                    .classes("value", type)
                    .children(
                        create("span")
                            .text(value)
                            .build(),
                    ).id(id)
                    .onclick(e => {
                        navigator.clipboard.writeText(value);
                        const element = document.getElementById(id);
                        toast("Copied to clipboard", {
                            x: element.getBoundingClientRect().right + 10,
                            y: element.getBoundingClientRect().top,
                        }, "positive", 2);
                    })
                    .build()
            ).build();
    }

    static jsonObject(key, json) {
        if (Object.keys(json).length === 0) {
            return create("span")
                .text(`${key}: {}`)
                .build();
        }

        return create("details")
            .classes("json-object")
            .open("true")
            .children(
                create("summary")
                    .classes("json-object-header")
                    .text(`${key}: {`)
                    .build(),
                create("div")
                    .classes("json-object-content")
                    .children(
                        ...Object.keys(json).map(key => {
                            const value = json[key];
                            return GenericTemplates.jsonValue(key, value);
                        }),
                    ).build(),
                create("div")
                    .classes("json-object-footer")
                    .text("}")
                    .build()
            ).build();
    }

    static jsonArray(key, json) {
        let i = 0;

        return create("details")
            .classes("json-array")
            .open("true")
            .children(
                create("summary")
                    .classes("json-array-header")
                    .text(`${key}: [`)
                    .build(),
                create("div")
                    .classes("json-array-content")
                    .children(
                        ...json.map(value => {
                            i++;
                            return GenericTemplates.jsonValue(i, value);
                        }),
                    ).build(),
                create("div")
                    .classes("json-array-footer")
                    .text("]")
                    .build()
            ).build();
    }

    static collapsible(text, content, classes = [], open = false) {
        const uniqueId = newId();
        const toggled = signal(open);
        const iconClass = computedSignal(toggled, on => on ? "rot90" : "rot0");
        let contentElement;

        contentElement = create("div")
            .classes("collapsible-content")
            .id(uniqueId)
            .children(content)
            .build();

        const details = create("details")
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
        if (open) {
            details.open = "true";
        }
        return details;
    }

    static headers(request, headers, onlyDisplay = false) {
        const useHeaders = computedSignal(headers, h => {
            if (!h) {
                return [];
            }
            return Object.keys(h).map(key => {
                return {name: key, value: h[key]};
            });
        });

        return create("div")
            .classes("flex-v")
            .children(
                ifjs(onlyDisplay, GenericTemplates.buttonWithIcon("add", "Add Header", () => {
                    const newHeaders = {
                        ...headers.value,
                        ["Header-" + newId()]: "",
                    };
                    request.updateHeaders(newHeaders);
                }), true),
                create("table")
                    .children(
                        create("thead")
                            .children(
                                create("tr")
                                    .children(
                                        create("th")
                                            .text("Header Name")
                                            .build(),
                                        create("th")
                                            .text("Header Value")
                                            .build(),
                                    ).build()
                            ).build(),
                        signalMap(useHeaders, create("tbody"),
                            header => GenericTemplates.header(request, headers, header, onlyDisplay))
                    ).build(),
            ).build();
    }

    static header(request, headers, header, onlyDisplay = false) {
        if (onlyDisplay) {
            const guessedType = guessType(header.value);
            const id = newId();

            return create("tr")
                .classes("align-center")
                .children(
                    create("td")
                        .classes("header-name")
                        .text(header.name)
                        .build(),
                    create("td")
                        .children(
                            create("div")
                                .classes("value", guessedType)
                                .children(
                                    create("span")
                                        .text(header.value)
                                        .build(),
                                ).id(id)
                                .onclick(e => {
                                    navigator.clipboard.writeText(header.value);
                                    const element = document.getElementById(id);

                                    toast("Copied to clipboard", {
                                        x: element.getBoundingClientRect().right + 10,
                                        y: element.getBoundingClientRect().top,
                                    }, "positive", 2);
                                })
                                .build(),
                        ).build(),
                ).build();
        }

        return create("tr")
            .classes("align-center")
            .children(
                create("td")
                    .children(
                        GenericTemplates.input("text", "headername", header.name, "Header Name", "Header Name", "header-name", ["flex-grow"], (val) => {
                            const newHeaders = {
                                ...headers.value,
                                [val]: header.value,
                            };
                            delete newHeaders[header.name];
                            request.updateHeaders(newHeaders);
                        }, () => {}, true),
                    ).build(),
                create("td")
                    .children(
                        GenericTemplates.input("text", "headervalue", header.value, "Header Value", "Header Value", "header-value", ["flex-grow"], (val) => {
                            const newHeaders = {
                                ...headers.value,
                                [header.name]: val,
                            };
                            request.updateHeaders(newHeaders);
                        }, () => {}, true),
                    ).build(),
            ).build();
    }

    static bodyEditor(request, headers) {
        const body = computedSignal(request.signal, req => req ? req.body : null);
        const contentType = computedSignal(headers, h => h ? h["Content-Type"] : "text/plain");

        return create("div")
            .classes("flex-v")
            .children(
                GenericTemplates.textArea(body, null, "body", (val) => {
                    request.updateBody(val);
                }),
                ifjs(body, create("span")
                    .text("Preview")
                    .build()),
                ifjs(body, GenericTemplates.bodyDisplay(body, contentType)),
            ).build();
    }

    static textArea(value, label, id, oninput) {
        return create("label")
            .classes("flex-v")
            .for(id)
            .children(
                ifjs(label, create("span")
                    .text(label)
                    .build()),
                create("textarea")
                    .classes("full-width")
                    .name(id)
                    .id(id)
                    .oninput((e) => {
                        oninput(e.target.value);
                    })
                    .value(value)
                    .build()
            ).build();
    }
}