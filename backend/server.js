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
    host: '10.0.7.155',
    // port: 0, // Art-Net port, typically 6454
};
const artnet = require('artnet')(options);

const numberOfChannels = 512; // Adjust to the number of channels you have
let currentChannel = 180;
let count = 0 ; 
async function fadeColumn18() {
    try {
        // Wait for CSV mapping to be created
        const csvMapping = await createCsvMapping();
        csvMapping0 = csvMapping[0]; // Assuming we are working with the first mapping

        const universeData = new Array(512).fill(255); // Initialize all channels with 255 (white)
        let fadeDirection = -1; // Fade direction: -1 for fading to 0, 1 for fading to 255
        let brightness = 255;   // Start at full brightness

        // Create an interval to fade column 18 between 0 and 255
        const intervalId = setInterval(async () => {
            try {
                // Adjust the brightness
                brightness += fadeDirection * 10; // Adjust the fade speed with increments
                if (brightness <= 0) {
                    brightness = 0;
                    fadeDirection = 1; // Start fading up
                } else if (brightness >= 255) {
                    brightness = 255;
                    fadeDirection = -1; // Start fading down
                }

                // Only apply the brightness to column 18 across all rows
                for (let row = 0; row < 10; row++) {
                    const mapping = csvMapping0[`${row}-18`]; // Column 18
                    if (mapping) {
                        const { dmxChannel } = mapping;
                        universeData[dmxChannel - 1] = brightness; // Set the column's channel to the current brightness
                    }
                }

                // Send the DMX data for all channels over Art-Net
                await artnet.set(0, 1, universeData);
                console.log(`Fading column 18 to brightness ${brightness}`);

            } catch (error) {
                console.error('Error sending DMX values over Art-Net:', error);
                clearInterval(intervalId); // Stop the interval if there's an error
            }
        }, 100); // Adjust interval time for smoother fading (100 ms = 10 steps per second)

    } catch (error) {
        console.error('Error in fadeColumn18:', error);
    }
}


// fadeColumn18()

let csvMapping0;

createCsvMapping()
    .then(c => {
        // Use the mapping here
        csvMapping0 = c[0];
    })
    .catch(error => {
        console.error('Failed to create CSV mapping:', error);
    });
    let previousValues = {}; // Store previous DMX values for each channel

    // Smooth transition function using a factor for gradual change
    function smoothTransition(prevValue, newValue, factor = .01) {
        return prevValue + (newValue - prevValue) * factor;
    }
    app.post('/set-dmx', async (req, res) => {
        try {
            let { dmxValues } = req.body; // Received all 30 columns brightness values
            dmxValues = dmxValues.map(row => row.map(value => 255 - value)); // Inverting brightness values for DMX
            let universeData = new Array(512).fill(0); // Initialize all channels with 0 (black)
    
            function clampValue(value) {
                return Math.max(Math.min(value, 255), 0); // Ensure value is between 0 and 255
            }
    
            // Iterate through rows and columns
            for (let row = 0; row < 10; row++) {
                const rowData = dmxValues[row];
                for (let col = 0; col < 28; col++) {
                    if(col === 18) console.log(rowData)
                    const brightness = clampValue(rowData[col]);
                    const mapping = csvMapping0[`${row}-${col}`];
                    if (mapping) {
                        const { dmxChannel } = mapping;
    
                        // Get the previous value for this channel, default to the current brightness
                        const previousValue = previousValues[dmxChannel] || brightness;
    
                        // Apply the smooth transition
                        const smoothValue = smoothTransition(previousValue, brightness, 0.1);
    
                        // Store the smooth value directly in the universeData array at the correct DMX channel index
                        universeData[dmxChannel - 1] = smoothValue;
    
                        // Update the previous value for the channel
                        previousValues[dmxChannel] = smoothValue;
                    }
                }
            }
    
            // DMX sending logic
            await artnet.set(0, 1, universeData); // Send the smooth values over Art-Net
    
            res.json({ message: 'DMX set successfully' });
        } catch (err) {
            console.error(`Error setting DMX values: ${err}`);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error setting DMX' });
            }
        }
    });
    
    
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
