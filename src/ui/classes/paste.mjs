//import { Request } from "./request.mjs";

/**
 *
 * @param pasteString {string}
 */
export function requestFromCurlCmd(pasteString) {
    const lines = pasteString.split("\n");
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
}

const pasteString = `curl "http://localhost:8080/delete-request" ^
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

console.log(requestFromCurlCmd(pasteString));