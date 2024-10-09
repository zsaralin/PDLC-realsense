// import { avgCtx } from './pixelatedCanvas.js';
// // import OSC from 'osc-js'; // Import OSC library

// // Initialize an OSC instance
// const osc = new OSC({ plugin: new OSC.DatagramPlugin({ send: { port: 57121 } }) }); // Change the port if necessary
// osc.open(); // Open the OSC connection

// // Initialize an array to store the previous brightness values for smoothing
// let prevBrightnessValues = Array(10).fill().map(() => Array(28).fill(0)); // 28 columns and 10 rows

// // Function to set DMX from pixel canvas and send OSC message
// export function setDMXFromPixelCanvas(pixelSmoothing) {
//     if (!pixelSmoothing) {
//         pixelSmoothing = document.getElementById('pixelSlider').value / 2;
//     }

//     // Grab the ImageData directly from the avgCtx
//     const imageData = avgCtx.getImageData(0, 0, 28, 10); // Assuming avgCtx is 28x10
//     const data = imageData.data;
//     let brightnessValues = [];
//     const cols = 28; // 28 columns (from the 28x10 canvas)
//     const rows = 10; // 10 rows (from the 28x10 canvas)

//     for (let row = 0; row < rows; row++) {
//         let rowBrightness = [];
//         for (let col = 0; col < cols; col++) {
//             const index = (row * cols + col) * 4; // 4 values per pixel (R, G, B, A)
//             const currentBrightness = data[index]; // Use the red channel value (R) directly for brightness

//             // Get the previous brightness for the current pixel
//             const prevBrightness = prevBrightnessValues[row][col];

//             // Apply smoothing to calculate the smoothed brightness
//             const smoothedBrightness = currentBrightness// Math.round(prevBrightness + pixelSmoothing * (currentBrightness - prevBrightness));

//             // Update the previous brightness value for the next frame
//             prevBrightnessValues[row][col] = smoothedBrightness;

//             // Push the smoothed brightness value to the row
//             rowBrightness.push(smoothedBrightness);
//         }
//         // Push the row's smoothed brightness values to the overall brightnessValues array
//         brightnessValues.push(rowBrightness);
//     }

//     // Send the brightness values using OSC
//     const msg = new OSC.Message('/dmxValues', brightnessValues.flat()); // Flatten the 2D array to a 1D array
//     osc.send(msg); // Send the OSC message
// }

// let backendInterval;

// export function startDMXAnimationLoop() {
//     // Start calling setDMXFromPixelCanvas every 60 milliseconds (roughly 16-17 times per second)
//     backendInterval = setInterval(() => {
//         setDMXFromPixelCanvas();  // Call the function to send DMX data
//     }, 16.67); // 60 fps
// }

// export function stopDMXAnimationLoop() {
//     if (backendInterval) {
//         clearInterval(backendInterval);  // Stop the interval
//         backendInterval = null;  // Reset the interval variable
//     }
// }
