

export function setDMXFromPixelCanvas(imageData) {
    let brightnessValues = [];
    const data = imageData.data;
    const cols = 28; // 28 columns (from the 28x10 canvas)
    const rows = 10; // 10 rows (from the 28x10 canvas)

    for (let row = 0; row < rows; row++) {
        let rowBrightness = [];
        for (let col = 0; col < cols; col++) {
            const index = (row * cols + col) * 4; // 4 values per pixel (R, G, B, A)
            const brightness = data[index]; // Use the red channel value (R) directly for brightness

            rowBrightness.push(brightness);
        }
        // Push the row's brightness values to the overall brightnessValues array
        brightnessValues.push(rowBrightness);
    }

    // Send the brightness values to the server
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
