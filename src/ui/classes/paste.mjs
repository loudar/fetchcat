//import { Request } from "./request.mjs";

export async function pasteFromClipboard() {
    const text = await navigator.clipboard.readText();
    const pasteType = detectPasteType(text);
    switch (pasteType) {
        case "curl":
            return requestFromCurlCmd(text);
        case "powershell":
            return requestFromPowershell(text);
        default:
            return {
                error: "Unknown paste type"
            };
    }
}

export function detectPasteType(pasteString) {
    if (pasteString.trim().startsWith("curl")) {
        return "curl";
    }
    if (pasteString.trim().includes("Invoke-WebRequest")) {
        return "powershell";
    }
    if (pasteString.trim().startsWith("fetch(\"")) {
        return "fetch";
    }
    return "unknown";
}

/**
 *
 * @param pasteString {string}
 */
export function requestFromCurlCmd(pasteString) {
    const lines = pasteString.split("\n");
    try {
        return {
            url: lines[0].split("\"")[1],
            method: lines[0].split(" ")[0],
            headers: lines.filter(line => line.trim().startsWith("-H")).map(line => {
                console.log(line);
                const header = line.split("\"")[1];
                const parts = header.split(":");
                return {
                    name: parts[0].trim(),
                    value: parts[1].trim()
                };
            }),
            body: lines.filter(line => line.startsWith("--data-raw")).map(line => {
                return line
                    .replaceAll("^", "")
                    .split(" \"")[1]
                    .slice(0, -1);
            })
        };
    } catch (e) {
        console.error(e);
        return {
            error: e.message
        };
    }
}

export function requestFromPowershell(pasteString) {
    const lines = pasteString.split("\n");
    try {
        const headerStartLine = lines.find(line => line.trim().startsWith("-Headers"));
        const headerEndLine = lines.find(line => line.trim().startsWith("}"));
        const headerLines = lines.slice(lines.indexOf(headerStartLine) + 1, lines.indexOf(headerEndLine));
        return {
            url: lines.find(line => line.trim().startsWith("Invoke-WebRequest")).split("\"")[1],
            method: lines.find(line => line.trim().startsWith("-Method")).split("\"")[1],
            headers: headerLines.reduce((acc, line) => {
                const parts = line.split("=");
                const key = parts[0].trim().replaceAll("\"", "");
                acc[key] = parts[1].trim().replaceAll("\"", "");
                return acc;
            }, {}),
            body: lines.find(line => line.trim().startsWith("-Body"))
                .split("\"").slice(1, -1).join("\"")
                .replaceAll("`", "")
        };
    } catch (e) {
        console.error(e);
        return {
            error: e.message
        };
    }
}

export function requestFromFetch(pasteString) {
    const lines = pasteString.split("\n");
    try {
        return {
            url: lines.find(line => line.trim().startsWith("fetch(")).split("\"")[1],
            method: lines.find(line => line.trim().startsWith("\"method\":")).split("\"")[1],
            headers: lines.filter(line => line.trim().startsWith("\"")).map(line => {
                const parts = line.split(":");
                return {
                    name: parts[0].trim().replaceAll("\"", ""),
                    value: parts[1].trim().replaceAll("\"", "")
                };
            }),
            body: lines.find(line => line.trim().startsWith("\"body\": ")).split("\"body\": ")[1]
                .trim().slice(1, -2).replaceAll("\\", "")
        };
    } catch (e) {
        console.error(e);
        return {
            error: e.message
        };
    }
}

const testCurl = `curl "http://localhost:8080/delete-request" ^
  -H "Accept: application/json" ^
  -H "Accept-Language: de" ^
  -H "Cache-Control: no-cache" ^
  -H "Connection: keep-alive" ^
  -H "Content-Type: application/json" ^
  -H "Pragma: no-cache" ^
  -H "Sec-Fetch-Dest: empty" ^
  -H "Sec-Fetch-Mode: cors" ^
  -H "Sec-Fetch-Site: cross-site" ^
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) fetchcat/1.0.0 Chrome/126.0.6478.61 Electron/31.0.2 Safari/537.36" ^
  -H ^"sec-ch-ua: ^\\^"Not/A)Brand^\\^";v=^\\^"8^\\^", ^\\^"Chromium^\\^";v=^\\^"126^\\^"^" ^
  -H "sec-ch-ua-mobile: ?0" ^
  -H ^"sec-ch-ua-platform: ^\\^"Windows^\\^"^" ^
  --data-raw ^"^{^\\^"id^\\^":^\\^"d2am7dgv66hxmdgvnoamh^\\^"^}^"`;

const testPwsh = `$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$session.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) fetchcat/1.0.0 Chrome/126.0.6478.61 Electron/31.0.2 Safari/537.36"
Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:8080/save-request" \`
-Method "POST" \`
-WebSession $session \`
-Headers @{
"Accept"="application/json"
  "Accept-Encoding"="gzip, deflate, br"
  "Accept-Language"="de"
  "Cache-Control"="no-cache"
  "Pragma"="no-cache"
  "Sec-Fetch-Dest"="empty"
  "Sec-Fetch-Mode"="cors"
  "Sec-Fetch-Site"="cross-site"
  "sec-ch-ua"="\`"Not/A)Brand\`";v=\`"8\`", \`"Chromium\`";v=\`"126\`""
  "sec-ch-ua-mobile"="?0"
  "sec-ch-ua-platform"="\`"Windows\`""
} \`
-ContentType "application/json" \`
-Body "{\`"url\`":\`"\`",\`"method\`":\`"GET\`",\`"headers\`":{},\`"body\`":null,\`"name\`":\`"yoooo\`",\`"id\`":\`"huzt32r6w0h6zm33s4hsod\`",\`"saved\`":false}"`;

const testFetch = `fetch("http://localhost:8080/save-request", {
  "headers": {
    "accept": "application/json",
    "accept-language": "de",
    "cache-control": "no-cache",
    "content-type": "application/json",
    "pragma": "no-cache",
    "sec-ch-ua": "\\"Not/A)Brand\\";v=\\"8\\", \\"Chromium\\";v=\\"126\\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\\"Windows\\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site"
  },
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": "{\\"url\\":\\"\\",\\"method\\":\\"GET\\",\\"headers\\":{},\\"body\\":null,\\"name\\":\\"yoooo\\",\\"id\\":\\"huzt32r6w0h6zm33s4hsod\\",\\"saved\\":false}",
  "method": "POST",
  "mode": "cors",
  "credentials": "omit"
});`;

const response = requestFromFetch(testFetch)
console.log(response);