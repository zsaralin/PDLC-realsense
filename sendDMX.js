// Initialize an array to store the previous brightness values for smoothing
let prevBrightnessValues = Array(10).fill().map(() => Array(28).fill(0)); // 28 columns and 10 rows


export function setDMXFromPixelCanvas(imageData, pixelSmoothing) {
    if(!pixelSmoothing){
        pixelSmoothing = document.getElementById('pixelSlider').value/10
    }
    console.log(pixelSmoothing)
    let brightnessValues = [];
    const data = imageData.data;
    const cols = 28; // 28 columns (from the 28x10 canvas)
    const rows = 10; // 10 rows (from the 28x10 canvas)

    for (let row = 0; row < rows; row++) {
        let rowBrightness = [];
        for (let col = 0; col < cols; col++) {
            const index = (row * cols + col) * 4; // 4 values per pixel (R, G, B, A)
            const currentBrightness = data[index]; // Use the red channel value (R) directly for brightness

            // Get the previous brightness for the current pixel
            const prevBrightness = prevBrightnessValues[row][col];

            // Apply smoothing to calculate the smoothed brightness
            const smoothedBrightness = Math.round(prevBrightness + pixelSmoothing * (currentBrightness - prevBrightness));

            // Update the previous brightness value for the next frame
            prevBrightnessValues[row][col] = smoothedBrightness;

            // Push the smoothed brightness value to the row
            rowBrightness.push(smoothedBrightness);
        }
        // Push the row's smoothed brightness values to the overall brightnessValues array
        brightnessValues.push(rowBrightness);
    }

    // Send the smoothed brightness values to the server
    fetch(`http://localhost:3000/set-dmx`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            dmxValues: brightnessValues // Your DMX values here
        })
    })
        .then(response => response.json())
        .catch(error => console.error('Error:', error));
}
