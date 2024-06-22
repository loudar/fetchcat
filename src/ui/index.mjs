import {LayoutTemplates} from "./templates/layout.templates.mjs";
import {Request} from "./classes/request.mjs";
import {defaultHeaders, defaultRequestType} from "./classes/defaults.mjs";
import {signal} from "https://fjs.targoninc.com/f.mjs";
import {Response} from "./classes/response.mjs";

const request = new Request({
    url: "https://google.com",
    method: defaultRequestType,
    headers: defaultHeaders,
    body: null,
    name: "My request",
    saved: false
});
const response = new Response({});
await Promise.all([
    request.fillFromLocalCache(),
    response.fillFromLocalCache()
]);
const sending = signal(false);
const saving = signal(false);
const sideBarOpen = signal(true);
const requests = signal([]);
Request.getSaved().then(reqs => {
    requests.value = reqs;
});

const content = document.getElementById('content');
content.appendChild(LayoutTemplates.app(request, requests, sending, saving, response, sideBarOpen));

document.addEventListener("keydown", (e) => {
    if (!e.ctrlKey) {
        return;
    }
    if (e.key === "Enter") {
        request.send(sending).then(async res => {
            await response.fromResponse(res);
        });
    }
    if (e.key === "s") {
        request.persist(saving).then(() => {
            Request.getSaved().then(reqs => {
                requests.value = reqs;
            });
        });
    }
});