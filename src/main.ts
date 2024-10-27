//array of stickers in JSON syntax
const stickerArray = [
    {id: "sticker1", label: "😆"},
    {id: "sticker2", label: "🐰"},
    {id: "sticker3", label: "😕"},
];

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
        ctx.strokeStyle = "white";
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

//given help by Brace for sticker classes
class StickerPreview implements Drawable{
    private x: number;
    private y: number;
    public sticker: string;
    public visible: boolean;

    constructor(sticker: string) {
        this.sticker = sticker;
        this.x = 0;
        this.y = 0;
        this.visible = true;
    }

    display(ctx: CanvasRenderingContext2D): void {
        if (!this.visible) return;

        ctx.font = "40px Arial";
        ctx.fillText(this.sticker, this.x, this.y);
    }

    updatePosition(x: number, y: number): void {
        const xOffset = -30;
        this.x = x + xOffset;
        this.y = y;
    }
}

class PlaceSticker implements Drawable {
    public x: number;
    public y: number;
    public sticker: string;

    constructor (sticker: string, x: number, y: number) {
        this.sticker = sticker;
        this.x = x;
        this.y = y;
    }

    display(ctx: CanvasRenderingContext2D): void {
        ctx.font = "40px Arial";
        const xOffset = -30;
        ctx.fillText(this.sticker, this.x + xOffset, this.y);
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
let strokes: Drawable[] = [];
let redoStrokes: Drawable[] = [];
let currentStroke: MarkerLine | null = null;
let toolPreview: ToolPreview | null = null;
let stickerPreview: StickerPreview | null = null;
let selectedSticker: PlaceSticker | null = null;

canvas.addEventListener("mousedown", (e) => {
    for (const stroke of strokes) {
        if (stroke instanceof PlaceSticker) {
            const dx = Math.abs(e.offsetX - stroke.x);
            const dy = Math.abs(e.offsetY - (stroke.y - 15));

            if (dx < 20 && dy < 20) {
                selectedSticker = stroke;
                break;
            }
        }
    }

    if (!selectedSticker) {
        currentStroke = new MarkerLine(e.offsetX, e.offsetY, currentThickness);
        isDrawing = true;
        toolPreview = null;
        redrawCanvas();
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (selectedSticker) {
        selectedSticker.x = e.offsetX;
        selectedSticker.y = e.offsetY;
        redrawCanvas();
    }

    if (stickerPreview) {
        stickerPreview.updatePosition(e.offsetX, e.offsetY);
        stickerPreview.visible = !isDrawing;
        redrawCanvas();
    }

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
    if (selectedSticker) {
        selectedSticker = null;
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
    else if (isDrawing && currentStroke) {
        isDrawing = false;
        strokes.push(currentStroke);
        currentStroke = null;
        redoStrokes = [];
        toolPreview = new ToolPreview(e.offsetX, e.offsetY, currentThickness);
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
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

canvas.addEventListener("click", (event) => {
    if (stickerPreview && stickerPreview.visible) {
        const placeSticker = new PlaceSticker(
            stickerPreview.sticker,
            event.offsetX,
            event.offsetY
        );

        strokes.push(placeSticker);
        stickerPreview = null;
        redrawCanvas();
    }
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

    if (!isDrawing && stickerPreview && stickerPreview.visible) {
        stickerPreview.display(context);
    }
    
}

//observes for event 
canvas.addEventListener("drawing-changed", () => {
    redrawCanvas();
});

canvas.addEventListener("tool-moved", () => {
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

//add sticker event handler
function handleSticker(stickerLabel: string) {
    stickerPreview = new StickerPreview(stickerLabel);
    stickerPreview.visible = true;
    canvas.dispatchEvent(new Event("tool-moved"));
}

function addStickerButton(sticker: { id: string, label: string}) {
    const button = document.createElement("button");
    button.id = sticker.id;
    button.textContent = sticker.label;
    button.addEventListener("click", () => handleSticker(sticker.label));
    app.appendChild(button);
}

stickerArray.forEach(sticker => addStickerButton(sticker));

//add custom sticker button
const customStickerButton = document.createElement("button");
customStickerButton.id = "customSticker";
customStickerButton.textContent = "Add Custom Sticker";
customStickerButton.addEventListener("click", () => {
    const userInput = prompt("Custom Sticker Text", "📖");
    if (userInput) {
        const newSticker = { id: `customSticker_${stickerArray.length}`, label: userInput.trim() };
        stickerArray.push(newSticker);
        addStickerButton(newSticker);
        console.log(`Added new sticker: ${userInput}`);
    } else {
        alert("No input provided");
    }
});
document.body.appendChild(customStickerButton);

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

//export canvas
const exportCanvas = document.createElement("canvas");
exportCanvas.width = canvas.width * 4;
exportCanvas.height = canvas.height * 4;
const exportCtx = exportCanvas.getContext("2d");

function exportDrawing() {
    if (!exportCtx) return;

    exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.save();
    exportCtx.scale(4, 4);
    exportCtx.translate(0, 0);

    strokes.forEach(stroke => stroke.display(exportCtx));

    const link = document.createElement("a");
    link.download = "exported_drawing.png";
    link.href = exportCanvas.toDataURL("image/png");
    link.click();

    exportCtx.restore();
}

const exportButton = document.createElement("button");
exportButton.innerHTML = "Export";
document.body.appendChild(exportButton);
exportButton.addEventListener("click", exportDrawing);
