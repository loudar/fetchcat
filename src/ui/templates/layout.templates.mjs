import {computedSignal, create, ifjs, signal} from "https://fjs.targoninc.com/f.mjs";
import {GenericTemplates} from "./generic.templates.mjs";
import {requestTypes} from "../classes/defaults.mjs";
import {formatTime} from "../classes/time.mjs";

export class LayoutTemplates {
    static app(request, sending, response) {
        const headers = signal(request.headers);
        headers.subscribe((val) => {
            request.updateHeaders(val);
        });
        const headersTitle = computedSignal(headers, (val) => {
            if (Object.keys(val).length === 0) {
                return "Headers";
            }
            return "Headers (" + Object.keys(val).length + ")";
        });

        return create("div")
            .classes("app", "padded-big", "flex-v")
            .children(
                create("div")
                    .classes("flex", "restrict-to-window")
                    .children(
                        GenericTemplates.select(null, requestTypes, signal(request.method), (type) => {
                            request.updateMethod(type);
                        }),
                        GenericTemplates.input("text", "url", request.url, "URL", "URL", "url", ["flex-grow"], (val) => {
                            request.updateUrl(val);
                        }),
                        GenericTemplates.buttonWithIcon("send", "Send", () => {
                            request.send(sending).then(async res => {
                                response.value = await res.json();
                            });
                        }),
                    ).build(),
                create("div")
                    .classes("flex", "flex-grow")
                    .children(
                        GenericTemplates.collapsible(headersTitle, GenericTemplates.headers(headers), ["full-width"]),
                    ).build(),
                ifjs(sending, create("div")
                    .classes("flex")
                    .children(
                        GenericTemplates.spinner(),
                        GenericTemplates.infoText("info", "No response yet", ["info"])
                    ).build()),
                ifjs(response, LayoutTemplates.responseDisplay(response)),
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

        return create("div")
            .classes("flex-v")
            .children(
                create("div")
                    .classes("flex-grow", "flex", "big-gap")
                    .children(
                        GenericTemplates.infoText("info", statusText, [responseClass]),
                        GenericTemplates.infoText("info", timeText, [responseClass]),
                    ).build(),
                GenericTemplates.bodyDisplay(response),
            ).build();
    }
}