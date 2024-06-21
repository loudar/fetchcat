import {computedSignal, create, ifjs, signal} from "https://fjs.targoninc.com/f.mjs";
import {GenericTemplates} from "./generic.templates.mjs";
import {requestTypes} from "../classes/defaults.mjs";
import {formatTime} from "../classes/time.mjs";

export class LayoutTemplates {
    static app(request, sending, response, sideBarOpen) {
        return create("div")
            .classes("app", "padded-big", "flex")
            .children(
                LayoutTemplates.sideBar(request, sending, response, sideBarOpen),
                LayoutTemplates.mainPanel(request, sending, response, sideBarOpen),
            ).build();
    }

    static sideBar(request, sending, response, sideBarOpen) {
        const sidebarClass = computedSignal(sideBarOpen, val => val ? "open" : "closed");

        return create("div")
            .classes("flex-v", "sidebar", sidebarClass)
            .children(
                create("span")
                    .text("Sidebar")
                    .build(),
            ).build();
    }

    static mainPanel(request, sending, response, sideBarOpen) {
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

        return create("div")
            .classes("flex-v", "flex-grow")
            .children(
                create("div")
                    .classes("flex")
                    .children(
                        GenericTemplates.buttonWithIcon(menuIcon, "Menu", () => {
                            sideBarOpen.value = !sideBarOpen.value;
                        }),
                    ).build(),
                create("div")
                    .classes("flex", "restrict-to-window")
                    .children(
                        GenericTemplates.select(null, requestTypes, signal(request.method), (type) => {
                            request.updateMethod(type);
                        }),
                        GenericTemplates.input("text", "url", request.url, "URL", "URL", "url", ["flex-grow"], (val) => {
                            request.updateUrl(val);
                        }, e => {
                            clearTimeout(urlDebounceTimeout);
                            urlDebounceTimeout = setTimeout(() => {
                                request.updateUrl(e.target.value);
                            }, 500);
                        }),
                        GenericTemplates.buttonWithIcon("send", "Send", () => {
                            request.send(sending).then(async res => {
                                await response.fromResponse(res);
                            });
                        }),
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
        const contentType = computedSignal(response, res => res ? res.headers["content-type"] : "");
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
                        GenericTemplates.infoText("http", statusText, [responseClass]),
                        GenericTemplates.infoText("timer", timeText, [responseClass]),
                    ).build(),
                GenericTemplates.collapsible(responseHeadersTitle, GenericTemplates.headers(responseHeaders, true), ["full-width"]),
                GenericTemplates.collapsible("Response Body", GenericTemplates.bodyDisplay(body, contentType), ["full-width"], true),
            ).build();
    }
}