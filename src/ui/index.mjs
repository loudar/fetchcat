import {LayoutTemplates} from "./templates/layout.templates.mjs";
import {Request} from "./classes/request.mjs";
import {defaultHeaders, defaultRequestType} from "./classes/defaults.mjs";
import {signal} from "https://fjs.targoninc.com/f.mjs";
import {Response} from "./classes/response.mjs";

const request = new Request({
    url: "",
    method: defaultRequestType,
    headers: defaultHeaders,
    body: null,
});
const response = new Response({});
await Promise.all([
    request.fillFromLocalCache(),
    response.fillFromLocalCache()
]);
const sending = signal(false);

const content = document.getElementById('content');
content.appendChild(LayoutTemplates.app(request, sending, response));

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
        request.send(sending).then(async res => {
            await response.fromResponse(res);
        });
    }
});