import { setDMXFromPixelCanvas, startDMXAnimationLoop } from "./sendDMXOld.js";

// Function to draw stick figure on the transparent canvas and copy to white canvas
const whiteCanvas = document.getElementById("whiteCanvas");
const whiteCtx = whiteCanvas.getContext('2d');
const pixelatedCanvas = document.getElementById("pixelatedCanvas");
const pixelatedCtx = pixelatedCanvas.getContext('2d');
pixelatedCanvas.height = whiteCanvas.height = 100;
pixelatedCanvas.width = whiteCanvas.width = 280;

// Create a new off-screen canvas for 28x10 version
const avgCanvas = document.createElement('canvas');
avgCanvas.width = 28;
avgCanvas.height = 10;
export const avgCtx = avgCanvas.getContext('2d'); // Exported variable for access by other files

// Initialize previous brightness values for smoothing (for each 28x10 block)
let prevBrightnessValues = Array(10).fill().map(() => Array(28).fill(0)); // 28 columns and 10 rows

startDMXAnimationLoop();

export function drawToPixelatedCanvas(pixelSmoothing) {
    if (!pixelSmoothing) {
        pixelSmoothing = document.getElementById('pixelSlider').value /2;
    }
    pixelatedCtx.clearRect(0, 0, pixelatedCanvas.width, pixelatedCanvas.height);
    const blockWidth = 10;
    const blockHeight = 10;
    const tempCanvasWidth = whiteCanvas.width;
    const tempCanvasHeight = whiteCanvas.height;

    // Get the image data from the white canvas
    const imageData = whiteCtx.getImageData(0, 0, tempCanvasWidth, tempCanvasHeight);
    const pixels = imageData.data; // Get the pixel data as an array (RGBA format)

    // Loop through the white canvas in 10x10 blocks
    for (let y = 0; y < tempCanvasHeight; y += blockHeight) {
        for (let x = 0; x < tempCanvasWidth; x += blockWidth) {
            let totalBrightness = 0;
            let pixelCount = 0;

            // Calculate corresponding 28x10 position
            const pixelX28 = x / blockWidth;
            const pixelY10 = y / blockHeight;

            // Get the previous brightness for this block
            const prevBrightness = prevBrightnessValues[pixelY10][pixelX28];

            // Loop through each pixel in the block
            for (let blockY = 0; blockY < blockHeight; blockY++) {
                for (let blockX = 0; blockX < blockWidth; blockX++) {
                    const pixelX = x + blockX;
                    const pixelY = y + blockY;

                    if (pixelX < tempCanvasWidth && pixelY < tempCanvasHeight) {
                        const index = (pixelY * tempCanvasWidth + pixelX) * 4; // RGBA format

                        // Calculate brightness using the luminosity method (R * 0.21 + G * 0.72 + B * 0.07)
                        const brightness = 0.21 * pixels[index] + 0.72 * pixels[index + 1] + 0.07 * pixels[index + 2];
                        totalBrightness += brightness;
                        pixelCount++;
                    }
                }
            }

            // Calculate the average brightness for the block
            const avgBrightness = totalBrightness / pixelCount;

            // Apply smoothing to calculate the smoothed brightness
            const smoothedBrightness = Math.round(prevBrightness + pixelSmoothing * (avgBrightness - prevBrightness));

            // Update the previous brightness value for the next frame
            prevBrightnessValues[pixelY10][pixelX28] = smoothedBrightness;

            // Set the fill style to the smoothed brightness (grayscale)
            pixelatedCtx.fillStyle = `rgb(${smoothedBrightness}, ${smoothedBrightness}, ${smoothedBrightness})`;

            // Draw the filled square on the pixelated canvas
            pixelatedCtx.fillRect(
                x, // X position
                y, // Y position
                blockWidth, // Width
                blockHeight // Height
            );

            // Draw on the 28x10 canvas
            avgCtx.fillStyle = `rgb(${smoothedBrightness}, ${smoothedBrightness}, ${smoothedBrightness})`;
            avgCtx.fillRect(pixelX28, pixelY10, 1, 1); // Draw 1x1 pixel on the 28x10 canvas
        }
    }
}
