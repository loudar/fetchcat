import {LayoutTemplates} from "./templates/layout.templates.mjs";
import {Request} from "./classes/request.mjs";
import {defaultHeaders, defaultRequestType} from "./classes/defaults.mjs";
import {signal} from "https://fjs.targoninc.com/f.mjs";

const request = new Request({
    url: "",
    method: defaultRequestType,
    headers: defaultHeaders,
    body: null,
});
request.fillFromLocalCache();
const response = signal(null);
const sending = signal(false);

const content = document.getElementById('content');
content.appendChild(LayoutTemplates.app(request, sending, response));

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
        request.send(sending).then(async res => {
            response.value = await res.json();
        });
    }
});