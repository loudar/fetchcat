import {computedSignal, create, ifjs, signal, signalMap} from "https://fjs.targoninc.com/f.mjs";
import {GenericTemplates} from "./generic.templates.mjs";
import {requestTypes} from "../classes/defaults.mjs";
import {formatTime} from "../classes/time.mjs";
import {Request} from "../classes/request.mjs";
import {toast} from "../classes/ui.mjs";
import {pasteFromClipboard} from "../classes/paste.mjs";

export class LayoutTemplates {
    static app(request, requests, sending, saving, response, sideBarOpen) {
        return create("div")
            .classes("app", "no-wrap", "padded-big", "flex")
            .children(
                LayoutTemplates.sideBar(request, requests, sending, response, sideBarOpen),
                LayoutTemplates.mainPanel(request, requests, sending, saving, response, sideBarOpen),
            ).build();
    }

    static sideBar(request, requests, sending, response, sideBarOpen) {
        const sidebarClass = computedSignal(sideBarOpen, val => val ? "open" : "closed");

        return create("div")
            .classes("flex-v", "sidebar", sidebarClass)
            .children(
                create("span")
                    .text("Saved requests")
                    .build(),
                signalMap(requests, create("div").classes("flex-v"),
                    req => LayoutTemplates.requestInList(req, requests, request, response))
            ).build();
    }

    static requestInList(request, requests, currentRequest, currentResponse) {
        const activeClass = computedSignal(currentRequest.signal, req => req && req.id === request.id ? "active" : "_");

        return create("div")
            .classes("flex-v", "align-center", "request-list-item", activeClass)
            .children(
                create("div")
                    .children(
                        create("span")
                            .classes("bold")
                            .text(request.name)
                            .build(),
                    ).build(),
                create("div")
                    .classes("flex", "no-wrap")
                    .children(
                        GenericTemplates.buttonWithIcon("open_in_browser", "Open", async () => {
                            await currentRequest.overwrite(request);
                            await currentResponse.overwrite(null);
                            toast(`Request "${request.name}" opened`, null, "positive");
                        }),
                        GenericTemplates.buttonWithIcon("delete", "Delete", () => {
                            Request.delete(request.id).then(() => {
                                Request.getSaved().then(reqs => {
                                    if (currentRequest.id === request.id) {
                                        currentRequest.new({
                                            url: "",
                                            method: "GET",
                                            headers: {},
                                            body: null,
                                            name: "",
                                            saved: false
                                        });
                                    }
                                    requests.value = reqs;
                                });
                            });
                        }, ["negative"]),
                    ).build(),
            ).build();
    }

    static mainPanel(request, requests, sending, saving, response, sideBarOpen) {
        const headers = signal(request.headers);
        headers.subscribe((val) => {
            request.updateHeaders(val);
        });
        const headersTitle = computedSignal(headers, (val) => {
            if (!val || Object.keys(val).length === 0) {
                return "Request Headers";
            }
            return "Request Headers (" + Object.keys(val).length + ")";
        });
        let urlDebounceTimeout = null;
        const menuIcon = computedSignal(sideBarOpen, val => val ? "menu_open" : "menu");
        const savingIcon = computedSignal(saving, val => val ? "save" : "save_alt");
        const savedText = computedSignal(request.signal, req => (req && req.saved) ? "Saved" : "Not saved");
        const savedClass = computedSignal(request.signal, req => (req && req.saved) ? "positive" : "sensitive");
        const name = computedSignal(request.signal, req => req ? req.name : "");
        const url = computedSignal(request.signal, req => req ? req.url : "");
        const method = computedSignal(request.signal, req => req ? req.method : "GET");

        return create("div")
            .classes("flex-v", "flex-grow", "main-panel")
            .children(
                create("div")
                    .classes("flex", "align-center")
                    .children(
                        GenericTemplates.buttonWithIcon(menuIcon, "Menu", () => {
                            sideBarOpen.value = !sideBarOpen.value;
                        }),
                        GenericTemplates.buttonWithIcon("edit_square", "New request", () => {
                            request.new({
                                url: "",
                                method: "GET",
                                headers: {},
                                body: null,
                                name: "",
                                saved: false
                            });
                        }),
                        GenericTemplates.buttonWithIcon("content_paste", "Paste from clipboard", async () => {
                            pasteFromClipboard().then(async req => {
                                if (!req.error) {
                                    await request.overwrite(req);
                                    toast("Pasted request from clipboard", null, "positive");
                                } else {
                                    toast(`Error pasting from clipboard: ${req.error}`, null, "negative");
                                }
                            });
                        }),
                        GenericTemplates.input("text", "name", name, "Name", "Name", "name", ["flex-grow"], (val) => {
                            request.updateName(val);
                        }),
                        GenericTemplates.buttonWithIcon(savingIcon, "Save", () => {
                            request.persist(saving).then(() => {
                                Request.getSaved().then(reqs => {
                                    requests.value = reqs;
                                });
                            });
                        }),
                        create("span")
                            .classes("status-text", savedClass)
                            .text(savedText)
                            .build(),
                    ).build(),
                create("div")
                    .classes("flex", "restrict-to-window")
                    .children(
                        GenericTemplates.select(null, requestTypes, method, (type) => {
                            request.updateMethod(type);
                        }),
                        GenericTemplates.input("text", "url", url, "URL", "URL", "url", ["flex-grow"], (val) => {
                            request.updateUrl(val);
                        }, e => {
                            clearTimeout(urlDebounceTimeout);
                            urlDebounceTimeout = setTimeout(() => {
                                request.updateUrl(e.target.value);
                            }, 500);
                        }, true),
                        GenericTemplates.buttonWithIcon("send", "Send", () => {
                            request.send(sending).then(async res => {
                                await response.fromResponse(res);
                            });
                        }, ["positive"]),
                    ).build(),
                GenericTemplates.collapsible(headersTitle, GenericTemplates.headers(headers), ["full-width"]),
                GenericTemplates.collapsible("Request Body", GenericTemplates.bodyEditor(request, headers), ["full-width"], true),
                ifjs(sending, create("div")
                    .classes("flex")
                    .children(
                        GenericTemplates.spinner(),
                        GenericTemplates.infoText("info", "No response yet", ["info"]),
                        GenericTemplates.buttonWithIcon("stop", "Stop", () => {
                            sending.value = false;
                        }, ["negative"]),
                    ).build()),
                create("hr").build(),
                ifjs(response.signal, LayoutTemplates.responseDisplay(response.signal)),
            ).build();
    }

    static responseDisplay(response) {
        const responseClass = computedSignal(response, res => {
            if (res && res.status >= 200 && res.status < 300) {
                return "positive";
            }
            if (res && res.status >= 300 && res.status < 400) {
                return "sensitive";
            }
            if (res && res.status === 418) {
                return "special";
            }
            if (res && res.status >= 400 && res.status < 500) {
                return "negative";
            }
            return "info";
        });
        const statusText = computedSignal(response, res => res ? res.status + " " + res.statusText : "");
        const timeText = computedSignal(response, res => res ? formatTime(res.time) : "");
        const body = computedSignal(response, res => res ? (res.json ? res.json : res.body) : "");
        const contentType = computedSignal(response, res => (res && res.headers) ? res.headers["content-type"] : "");
        const error = computedSignal(response, res => res ? res.error : null);
        const responseHeadersTitle = computedSignal(response, (val) => {
            if (!val || Object.keys(val).length === 0) {
                return "Response Headers";
            }
            return "Response Headers (" + Object.keys(val).length + ")";
        });
        const responseHeaders = computedSignal(response, val => val ? val.headers : {});

        return create("div")
            .classes("flex-v")
            .children(
                create("div")
                    .classes("flex-grow", "flex", "big-gap")
                    .children(
                        ifjs(error, GenericTemplates.infoText("http", statusText, [responseClass]), true),
                        ifjs(error, GenericTemplates.infoText("timer", timeText, [responseClass]), true),
                        ifjs(error, GenericTemplates.infoText("error", error, ["negative"]))
                    ).build(),
                ifjs(error, GenericTemplates.collapsible(responseHeadersTitle, GenericTemplates.headers(responseHeaders, true), ["full-width"]), true),
                ifjs(error, GenericTemplates.collapsible("Response Body", GenericTemplates.bodyDisplay(body, contentType), ["full-width"], true), true),
            ).build();
    }
}