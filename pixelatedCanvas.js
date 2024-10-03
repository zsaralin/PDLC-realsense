
import { setDMXFromPixelCanvas } from "./sendDMX.js";
// Function to draw stick figure on the transparent canvas and copy to white canvas
const whiteCanvas = document.getElementById("whiteCanvas");
const whiteCtx = whiteCanvas.getContext('2d');
const pixelatedCanvas = document.getElementById("pixelatedCanvas");
const pixelatedCtx = pixelatedCanvas.getContext('2d');
pixelatedCanvas.height = whiteCanvas. height = 100
pixelatedCanvas.width = whiteCanvas.width = 280
// Variables to store previous frame's pixel data
let previousFrame = null;

export function drawToPixelatedCanvas(smoothingFactor = null) {
    // If smoothingFactor is not provided, get it from the pixelSlider in the document
    if (smoothingFactor === null) {
        const pixelSlider = document.getElementById('pixelSlider');
        smoothingFactor = parseFloat(pixelSlider.value);
    }
    pixelatedCtx.clearRect(0, 0, pixelatedCanvas.width, pixelatedCanvas.height);
    const blockWidth = 10;
    const blockHeight = 10;
    const tempCanvasWidth = whiteCanvas.width;
    const tempCanvasHeight = whiteCanvas.height;

    // Create a new off-screen canvas for 28x10 version
    const avgCanvas = document.createElement('canvas');
    avgCanvas.width = 28;
    avgCanvas.height = 10;
    const avgCtx = avgCanvas.getContext('2d');

    // Get the image data from the white canvas
    const imageData = whiteCtx.getImageData(0, 0, tempCanvasWidth, tempCanvasHeight);
    const pixels = imageData.data; // Get the pixel data as an array (RGBA format)

    // Initialize the previousFrame if it doesn't exist
    if (!previousFrame) {
        previousFrame = new Uint8ClampedArray(pixels.length); // Same size as the current frame
        previousFrame.set(pixels); // Copy current frame into previousFrame
    }

    // Loop through the white canvas in 10x10 blocks
    for (let y = 0; y < tempCanvasHeight; y += blockHeight) {
        for (let x = 0; x < tempCanvasWidth; x += blockWidth) {
            let totalR = 0, totalG = 0, totalB = 0, totalA = 0, pixelCount = 0;

            // Loop through each pixel in the block
            for (let blockY = 0; blockY < blockHeight; blockY++) {
                for (let blockX = 0; blockX < blockWidth; blockX++) {
                    const pixelX = x + blockX;
                    const pixelY = y + blockY;

                    if (pixelX < tempCanvasWidth && pixelY < tempCanvasHeight) {
                        const index = (pixelY * tempCanvasWidth + pixelX) * 4; // Calculate index in RGBA array

                        totalR += pixels[index];     // Red
                        totalG += pixels[index + 1]; // Green
                        totalB += pixels[index + 2]; // Blue
                        totalA += pixels[index + 3]; // Alpha
                        pixelCount++;
                    }
                }
            }

            // Calculate average color
            const avgR = totalR / pixelCount;
            const avgG = totalG / pixelCount;
            const avgB = totalB / pixelCount;
            const avgA = totalA / pixelCount / 255; // Normalize alpha

            // Get the previous frame's averaged color for the current block
            const prevIndex = (y * tempCanvasWidth + x) * 4;
            const prevR = previousFrame[prevIndex];
            const prevG = previousFrame[prevIndex + 1];
            const prevB = previousFrame[prevIndex + 2];
            const prevA = previousFrame[prevIndex + 3] / 255; // Normalize alpha

            // Apply smoothing (blend current frame with previous frame)
            const smoothR = avgR * (1 - smoothingFactor) + prevR * smoothingFactor;
            const smoothG = avgG * (1 - smoothingFactor) + prevG * smoothingFactor;
            const smoothB = avgB * (1 - smoothingFactor) + prevB * smoothingFactor;
            const smoothA = avgA * (1 - smoothingFactor) + prevA * smoothingFactor;

            // Set the fill style to the smoothed color
            pixelatedCtx.fillStyle = `rgba(${smoothR}, ${smoothG}, ${smoothB}, ${smoothA})`;

            // Draw the filled square on the pixelated canvas
            pixelatedCtx.fillRect(
                x, // X position
                y, // Y position
                blockWidth, // Width
                blockHeight // Height
            );

            // For the smaller 28x10 canvas, take the color of the first pixel from this block
            const index = (y * tempCanvasWidth + x) * 4;
            const r = pixels[index];
            const g = pixels[index + 1];
            const b = pixels[index + 2];
            const a = pixels[index + 3] / 255; // Normalize alpha
            // Set the fill style to the same color and draw a 1x1 pixel on the 28x10 canvas
            avgCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
            const pixelX = x / blockWidth; // Corresponding X in the 28x10 canvas
            const pixelY = y / blockHeight; // Corresponding Y in the 28x10 canvas
            avgCtx.fillRect(pixelX, pixelY, 1, 1); // Draw 1x1 pixel

            // Store the smoothed color in the previous frame
            previousFrame[prevIndex] = smoothR;
            previousFrame[prevIndex + 1] = smoothG;
            previousFrame[prevIndex + 2] = smoothB;
            previousFrame[prevIndex + 3] = smoothA * 255; // Convert alpha back to 0-255 range
        }
    }
    const pixelImageData = avgCtx.getImageData(0, 0, tempCanvasWidth, tempCanvasHeight);

    setDMXFromPixelCanvas(pixelImageData)
}
