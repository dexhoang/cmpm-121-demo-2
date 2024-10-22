import "./style.css";

const APP_NAME = "Dex";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const title = document.createElement("h1");
title.textContent = APP_NAME;
app.appendChild(title);

const canvas = document.createElement("canvas");
canvas.height = 256;
canvas.width = 256;
canvas.id = "display";
app.appendChild(canvas);