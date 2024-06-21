export function formatTime(ms) {
    let milliseconds = ms % 1000;
    let seconds = Math.floor(ms / 1000) % 60;
    let minutes = Math.floor(ms / 1000 / 60) % 60;
    let hours = Math.floor(ms / 1000 / 60 / 60);
    let result = "";
    if (hours > 0) {
        result += `${hours}h `;
    }
    if (minutes > 0) {
        result += `${minutes}m `;
    }
    if (seconds > 0) {
        result += `${seconds}s `;
    }
    if (milliseconds > 0) {
        result += `${milliseconds}ms`;
    }
    return result;
}