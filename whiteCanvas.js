import { numCams } from "./cameraSetup.js";
import { drawToPixelatedCanvas } from "./pixelatedCanvas.js";
// Function to draw stick figure on the transparent canvas and copy to white canvas
const whiteCanvas = document.getElementById("whiteCanvas");
const whiteCtx = whiteCanvas.getContext('2d');
const mirror0Checkbox = document.getElementById('mirror0');
const mirror1Checkbox = document.getElementById('mirror1');

export function drawAndCopyToWhiteCanvas(poses, transparentCtx, canvasId) {
    // Clear the white canvas
    if ((numCams === 1) || (numCams === 2 && canvasId === "canvas0_duplicate")) {
        whiteCtx.clearRect(0, 0, whiteCanvas.width, whiteCanvas.height);
    }

    // Check if mirroring is enabled for the given canvas
    const isMirrored = (canvasId === 'canvas0_duplicate' && mirror0Checkbox.checked) ||
                       (canvasId === 'canvas1_duplicate' && mirror1Checkbox.checked);

    if (isMirrored) {
        whiteCtx.save();  // Save the current state of the canvas
        whiteCtx.translate(whiteCanvas.width, 0);  // Move the context to the right edge
        whiteCtx.scale(-1, 1);  // Flip the canvas horizontally
    }

    // Draw the transparent canvas onto the white canvas (stretched to 280x100)
    whiteCtx.drawImage(
        transparentCtx.canvas,  // Source: transparent canvas
        0, 0, transparentCtx.canvas.width, transparentCtx.canvas.height,  // Source dimensions (original size)
        0, 0, 280, 100  // Destination dimensions (stretched to 280x100)
    );

    // Restore the context if it was flipped
    if (isMirrored) {
        whiteCtx.restore();
    }

    // Call to draw on pixelated canvas
    drawToPixelatedCanvas();
}