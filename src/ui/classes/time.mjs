export function formatTime(time) {
    let minutes = Math.floor(time / 60);
    let seconds = Math.floor(time - minutes * 60);
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    return minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0");
}