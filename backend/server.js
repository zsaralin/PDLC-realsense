const express = require('express');
const cors = require('cors');
const { createCsvMapping } = require("./csvMapping");
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors()); // Use CORS if needed
app.use(express.json()); // Middleware to parse JSON bodies

// Configure your Art-Net options
const options = {
    host: '10.0.7.190',
    // port: 0, // Art-Net port, typically 6454
};
const artnet = require('artnet')(options);
let csvMapping0;

createCsvMapping()
    .then(c => {
        // Use the mapping here
        csvMapping0 = c[0];
    })
    .catch(error => {
        console.error('Failed to create CSV mapping:', error);
    });

let previousValues = {};

function smoothTransition(prevValue, newValue, factor = 0.3) {
    return prevValue + (newValue - prevValue) * factor;
}

app.post('/set-dmx', async (req, res) => {
        try {
            let { dmxValues } = req.body; // Received all 30 columns brightness values
            dmxValues = dmxValues.map(row => row.map(value => 255 - value));
            let universeData = {};
            const rows = dmxValues.length; // Total rows

            function applyDimmerSpeed(mapping, brightness) {
                const adjustedBrightness = Math.round(brightness * mapping.dimmerSpeed);
                return Math.max(Math.min(adjustedBrightness, 255), 0); // Ensure the brightness does not exceed 255
            }

            for (let row = 0; row < rows; row++) {
                const rowData = dmxValues[row];
                for (let col = 0; col < 29; col++) {
                    let colIndex = col;
                    const brightness = rowData[colIndex];
                    const mapping = csvMapping0[`${row}-${9 - col}`];
                    if (mapping) {
                        const { dmxUniverse, dmxChannel, dimmerSpeed } = mapping;
                        const adjustedBrightness = applyDimmerSpeed(mapping, brightness);
                        if (!universeData[0]) {
                            universeData[0] = [];
                        }

                        const previousValue = previousValues[`${0}-${dmxChannel}`] || 255;
                        const smoothedBrightness = smoothTransition(previousValue, adjustedBrightness);

                        universeData[0].push({ channel: dmxChannel, value: smoothedBrightness });
                        previousValues[`${0}-${dmxChannel}`] = smoothedBrightness;
                    }
                }
            }

            // Send DMX values for each universe
            for (const [universe, channels] of Object.entries(universeData)) {
                let values = new Array(512).fill(255); // Initialize with zeros for all channels
                channels.forEach(({ channel, value }) => {
                    if (channel <= 301) {
                        values[channel - 1] = value; // Subtracting 1 to adjust for zero-based indexing
                    }
                });
                await artnet.set(parseInt(universe), 1, values);
            }

            res.json({ message: 'DMX set successfully' });
        } catch (err) {
            console.error(`Error setting DMX values: ${err}`);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error setting DMX' });
            }
        }
    

})

// Start the server
const PORT = 3000; // Port number for the HTTP server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


// New /save-config endpoint to save configuration data
app.post('/save-config', (req, res) => {
    const configData = req.body; // The config data is sent in the request body
    const filePath = path.join(__dirname, '..','config.json'); // Define the path for the config file
    // Write the config data to the config.json file
    fs.writeFile(filePath, JSON.stringify(configData, null, 2), (err) => {
        if (err) {
            console.error('Error saving config:', err);
            res.status(500).json({ error: 'Failed to save config' });
        } else {
            res.json({ message: 'Config saved successfully' });
        }
    });
});
