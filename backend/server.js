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
    function smoothTransition(prevValue, newValue, factor = 1) {
        return prevValue + (newValue - prevValue) * factor;
    }
    app.post('/set-dmx', async (req, res) => {
        
        if(!animationInterval){
        try {
            let { dmxValues } = req.body; // Received all 30 columns brightness values
            dmxValues = dmxValues.map(row => row.map(value => 255 - value)); // Inverting brightness values for DMX
            let universeData = new Array(512).fill(0); // Initialize all channels with 0 (black)
            universeData[universeData.length - 1] = Math.floor(Math.random() * 256);

            function clampValue(value) {
                return Math.max(Math.min(value, 255), 0); // Ensure value is between 0 and 255
            }
    
            // Iterate through rows and columns
            for (let row = 0; row < 10; row++) {
                const rowData = dmxValues[row];
                for (let col = 0; col < 28; col++) {
                    const brightness = clampValue(rowData[col]);
                    const mapping = csvMapping0[`${row}-${col}`];
                    if (mapping) {
                        const { dmxChannel } = mapping;
    
                        // Get the previous value for this channel, default to the current brightness
                        const previousValue = previousValues[dmxChannel] || brightness;
    
                        // Apply the smooth transition
                        const smoothValue = brightness//smoothTransition(previousValue, brightness, 0.9);
    
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


const totalChannels = 512; // Total DMX channels
let universeData = new Array(totalChannels).fill(0); // Initialize all channels with 0 (black)
let animationInterval = null; // To store the interval ID

// Function to update the DMX for a specific channel
function updateDMXWithChannel(channel) {
    // Set all channels to 0 except the current one
    universeData.fill(255);
    universeData[universeData.length - 1] = Math.floor(Math.random() * 256);

    universeData[channel] = 0; // Set the current channel to 255 (white)

    // Send the updated DMX values over Art-Net
    artnet.set(0, 1, universeData)
}

// Define a new endpoint to start the DMX animation loop
app.post('/start-dmx-animation', (req, res) => {
    let currentChannel = 0; // Start from the first channel

    // Clear any existing interval if already running
    if (animationInterval) {
        clearInterval(animationInterval);
    }

    // Start the animation loop that changes the DMX channel every second
    animationInterval = setInterval(() => {
        updateDMXWithChannel(currentChannel);

        // Move to the next channel, looping back to 0 when reaching the end
        currentChannel = (currentChannel + 1) % totalChannels;
    }, 500); // Change channel every 1 second

    res.json({ message: 'DMX animation started' });
});

// Define a new endpoint to stop the DMX animation loop
app.post('/stop-dmx-animation', (req, res) => {
    console.log('STOP MEEEEE')
    // Clear the interval to stop the DMX animation
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }

    res.json({ message: 'DMX animation stopped' });
});