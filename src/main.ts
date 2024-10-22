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
let currentStroke: Array<[number, number]> = [];
let strokes: Array<Array<[number, number]>> = [];

canvas.addEventListener("mousedown", (e) => {
    currentStroke = [];
    isDrawing = true;
    createPoint(e.offsetX, e.offsetY);
    redrawCanvas();
});

canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
        createPoint(e.offsetX, e.offsetY);
        redrawCanvas();
    }
});

canvas.addEventListener("mouseup", (e) => {
    if (!isDrawing) return;
    
    isDrawing = false;
    strokes.push(currentStroke);
    canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mouseleave", () => {
    if (isDrawing) {
        isDrawing = false;
        strokes.push(currentStroke);
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

function createPoint(x: number, y: number) {
    currentStroke.push([x, y]);
}

//redraw canvas with stroke array
function redrawCanvas() {
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "white";
    context.lineWidth = 1;

    strokes.forEach(stroke => drawStroke(stroke));
    drawStroke(currentStroke);
}

//draw stroke
function drawStroke(stroke: Array<[number, number]>) {
    if (!context) return; 

    if (stroke.length < 2) return;
    context.beginPath();
    context.moveTo(stroke[0][0], stroke[0][1]);
    for (let i = 1; i < stroke.length; i++) {
        context.lineTo(stroke[i][0], stroke[i][1]);
    }
    context.stroke();
    context.closePath();
}

//observes for event 
canvas.addEventListener("drawing-changed", () => {
    redrawCanvas();
});

//add clear button
const clearButton = document.createElement("button");
clearButton.innerHTML = "CLEAR";
document.body.appendChild(clearButton);

clearButton.addEventListener("click", () => {
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    strokes = [];
});
