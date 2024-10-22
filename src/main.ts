import "./style.css";

const APP_NAME = "Sketch Me";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const title = document.createElement("h1");
title.textContent = APP_NAME;
app.appendChild(title);

//create canvas
const canvas = document.getElementById("display") as HTMLCanvasElement;
const context = canvas.getContext("2d");

//listens for mouse activities to draw on canvas
let isDrawing = false;
let x = 0;
let y = 0;

canvas.addEventListener("mousedown", (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
});

canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
        drawLine(context, x, y, e.offsetX, e.offsetY);
        x = e.offsetX;
        y = e.offsetY;
    }
});

canvas.addEventListener("mouseup", (e) => {
    isDrawing = false;
})

canvas.addEventListener("mouseleave", (e) => {
    isDrawing = false;
})

function drawLine(context, x1, y1, x2, y2) {
    context.beginPath();
    context.strokeStyle = "white";
    context.lineWidth = 1;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
}

//add clear button
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
    context?.clearRect(0, 0, canvas.width, canvas.height);
});
