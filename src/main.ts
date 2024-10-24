//create class that holds objects - help from Brace
interface Drawable {
    display(ctx: CanvasRenderingContext2D): void;
}

class MarkerLine implements Drawable {
    private points: { x: number, y: number }[] = [];
    private thickness: number;

    constructor(initialX: number, initialY: number, thickness: number) {
        this.points.push({ x: initialX, y: initialY});
        this.thickness = thickness; 
    }

    drag( x: number, y: number): void {
        this.points.push({x, y});
    }

    display(ctx: CanvasRenderingContext2D): void {
        if (this.points.length < 2) return;

        ctx.lineWidth = this.thickness;
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);

        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }

        ctx.stroke();
    }
}

class ToolPreview implements Drawable{
    private x: number;
    private y: number;
    private thickness: number;

    constructor(x: number, y: number, thickness: number) {
        this.x = 0;
        this.y = 0;
        this.thickness = thickness;
    }

    updatePosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    display(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
        ctx.stroke();
    }
}

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
let currentStroke: MarkerLine | null = null;
let strokes: Drawable[] = [];
let redoStrokes: Drawable[] = [];
let toolPreview: ToolPreview | null = null;

canvas.addEventListener("mousedown", (e) => {
    currentStroke = new MarkerLine(e.offsetX, e.offsetY, currentThickness);
    isDrawing = true;
    toolPreview = null;
    redrawCanvas();
});

canvas.addEventListener("mousemove", (e) => {
    if (isDrawing && currentStroke) {
        currentStroke.drag(e.offsetX, e.offsetY);
        redrawCanvas();
    }
    else {
        if (!toolPreview) {
            toolPreview = new ToolPreview(e.offsetX, e.offsetY, currentThickness);
        }
        else {
            toolPreview.updatePosition(e.offsetX, e.offsetY);
        }
        canvas.dispatchEvent(new Event ("tool-moved"));
    }
});

canvas.addEventListener("mouseup", (e) => {
    if (!isDrawing || !currentStroke) return;
    
    isDrawing = false;
    strokes.push(currentStroke);
    currentStroke = null;
    redoStrokes = [];
    toolPreview = new ToolPreview(e.offsetX, e.offsetY, currentThickness);
    canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mouseleave", () => {
    if (isDrawing && currentStroke) {
        isDrawing = false;
        strokes.push(currentStroke);
        currentStroke = null;
        redoStrokes = [];
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
    toolPreview = null;
});

//redraw canvas with stroke array
function redrawCanvas() {
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "white";
    context.lineWidth = 1;

    strokes.forEach((stroke) => stroke.display(context));
    if (currentStroke) {
        currentStroke.display(context);
    }

    if (!isDrawing && toolPreview) {
        toolPreview.display(context);
    }
    
}

//observes for event 
canvas.addEventListener("drawing-changed", () => {
    redrawCanvas();
});

canvas.addEventListener("tool-moved", () => {
    redrawCanvas();
})

//add clear button
const clearButton = document.createElement("button");
clearButton.innerHTML = "CLEAR";
document.body.appendChild(clearButton);

clearButton.addEventListener("click", () => {
    strokes = [];
    redoStrokes = [];
    redrawCanvas();
});

//add undo button
const undoButton = document.createElement("button");
undoButton.innerHTML = "UNDO";
document.body.appendChild(undoButton);

undoButton.addEventListener("click", () => {
    const lastStroke = strokes.pop();

    if (lastStroke) {
        redoStrokes.push(lastStroke);
    }
    redrawCanvas();
})

//add redo button
const redoButton = document.createElement("button");
redoButton.innerHTML = "REDO";
document.body.appendChild(redoButton);

redoButton.addEventListener("click", () => {
    const lastredoStroke = redoStrokes.pop();
    
    if (lastredoStroke) {
        strokes.push(lastredoStroke)
    }
    redrawCanvas();
})

//add listeners for different brush size thickness
let currentThickness = 1;
updateSelectedTool("thinMarker");

document.getElementById("thinMarker")?.addEventListener("click", () => {
    currentThickness = 1;
    updateSelectedTool("thinMarker");
});

document.getElementById("thickMarker")?.addEventListener("click", () => {
    currentThickness = 5;
    updateSelectedTool("thickMarker");
});

function updateSelectedTool(selectedID: string) {
    document.querySelectorAll("button").forEach(button => {
        button.classList.remove("selectedTool");
    });
    document.getElementById(selectedID)?.classList.add("selectedTool");
}
