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
const sideBarOpen = signal(true);
const requests = signal([]);
Request.getSaved().then(reqs => {
    console.log({reqs});
    requests.value = reqs;
});

const content = document.getElementById('content');
content.appendChild(LayoutTemplates.app(request, requests, sending, response, sideBarOpen));

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
        request.send(sending).then(async res => {
            await response.fromResponse(res);
        });
    }
});