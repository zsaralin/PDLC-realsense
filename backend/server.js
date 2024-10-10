const express = require('express');
const cors = require('cors');
const { createCsvMapping } = require("./csvMapping");
const path = require('path');
const fs = require('fs');
const OSC = require('osc'); // Import the OSC library

const app = express();
app.use(cors()); // Use CORS if needed
app.use(express.json()); // Middleware to parse JSON bodies

// OSC UDP port setup
const udpPort = new OSC.UDPPort({
    localAddress: "192.168.93.219", // Change to the server's IP if needed
    localPort: 8080, // Local port for listening
    // remoteAddress: "192.168.93.219", // Change to the remote address of the OSC receiver
    // remotePort: 57121 // Change to the remote port of the OSC receiver
});

// Open the UDP port for sending OSC messages
udpPort.open();

let csvMapping0;

// Create the CSV mapping
createCsvMapping()
    .then(c => {
        csvMapping0 = c[0];
    })
    .catch(error => {
        console.error('Failed to create CSV mapping:', error);
    });

let previousValues = {}; // Store previous DMX values for each channel

app.post('/set-dmx', async (req, res) => {
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

                    // Set the brightness value directly in the universeData array at the correct DMX channel index
                    universeData[dmxChannel - 1] = brightness;

                    // Update the previous value for the channel
                    previousValues[dmxChannel] = brightness;
                }
            }
        }

        // Flatten the DMX values array
        const flattenedValues = universeData.flat();

        // Create the OSC message
        const oscMessage = {
            address: "/dmxValues", // The OSC address
            args: flattenedValues.map(value => ({ type: "i", value })) // Ensure the data is sent as integers
        };

        // Send the OSC message
        udpPort.send(oscMessage, "192.168.93.219", 57121); // Change this to the receiver's address/port if needed

        // console.log('OSC message sent:', oscMessage);
        res.json({ message: 'DMX set successfully via OSC' });
    } catch (err) {
        console.error(`Error setting DMX values: ${err}`);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error setting DMX' });
        }
    }
});

app.post('/get-dmx-channel', (req, res) => {
    const { x, y } = req.body;
    console.log(x,y)
    if (typeof x !== 'number' || typeof y !== 'number') {
        return res.status(400).json({ error: 'x and y must be numbers' });
    }

    const mapping = csvMapping0[`${y}-${x}`];

    if (mapping) {
        const { dmxChannel } = mapping;
        res.json({ dmxChannel });
    } else {
        res.status(404).json({ error: 'No mapping found for the given x and y values' });
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
    const filePath = path.join(__dirname, '..', 'config.json'); // Define the path for the config file
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
