export async function pasteFromClipboard() {
    const text = await navigator.clipboard.readText();
    const pasteType = detectPasteType(text);
    switch (pasteType) {
        case "curl":
            return requestFromCurlCmd(text);
        case "powershell":
            return requestFromPowershell(text);
        case "fetch":
            return requestFromFetch(text);
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
