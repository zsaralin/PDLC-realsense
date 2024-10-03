import { numCams } from "./cameraSetup.js";
import { drawToPixelatedCanvas } from "./pixelatedCanvas.js";
// Function to draw stick figure on the transparent canvas and copy to white canvas
const whiteCanvas = document.getElementById("whiteCanvas");
const whiteCtx = whiteCanvas.getContext('2d');
export function drawAndCopyToWhiteCanvas(poses, transparentCtx, canvasId) {
    // Clear the white canvas
    if ((numCams === 1) || (numCams === 2 && canvasId === "canvas0_duplicate")) whiteCtx.clearRect(0, 0, whiteCanvas.width, whiteCanvas.height);


    // Draw the transparent canvas onto the temporary canvas (stretch it to 280x100)
    whiteCtx.drawImage(
        transparentCtx.canvas, // Source: transparent canvas
        0, 0, transparentCtx.canvas.width, transparentCtx.canvas.height, // Source dimensions (original size)
        0, 0, 280, 100 // Destination dimensions (stretched to 280x100)
    );
    drawToPixelatedCanvas()
}