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

function sendPattern() {
    count ++;
    const data = Array(numberOfChannels).fill(255);  // Set all channels to 255
    
    // Set the current channel to 0
    data[currentChannel] = 0;
    console.log(`Current Channel: ${currentChannel}`);

    // Set a random channel to 0, different from the current channel
    let randomChannel = Math.floor(Math.random() * numberOfChannels);
    while (randomChannel === currentChannel) {
        randomChannel = Math.floor(Math.random() * numberOfChannels);  // Ensure it's different
    }
    data[randomChannel] = 0;

    // Send data over Art-Net (universe 0 by default)
    artnet.set(0, data, (err) => {
        if (err) {
            console.error('Error sending data to Art-Net:', err);
        }
    });

    // Move to the next channel, wrapping around to 0 after the last channel
    // if(count===100){
    //     currentChannel = (currentChannel + 5) % numberOfChannels;
    //     count = 0 ;}
}

// setInterval(sendPattern, 10); // Continuously update pixels every 100ms


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
        console.log(dmxValues)
        let universeData = {};
        const rows = dmxValues.length; // Total rows
        function clampValue(value) {
            return Math.max(Math.min(value, 255), 0); // Ensure value is between 0 and 255
        }

        for (let row = 0; row < 10; row++) {
            const rowData = dmxValues[row];
            for (let col = 0; col < 28; col++) {
                let colIndex = col;
                const brightness = clampValue(rowData[colIndex]);
                const mapping = csvMapping0[`${row}-${col}`];
                if (mapping) {
                    const { dmxUniverse, dmxChannel } = mapping;
                    if (!universeData[0]) {
                        universeData[0] = [];
                    }
                    universeData[0].push({ channel: dmxChannel, value: brightness });
                }
            }
        }
        // Your DMX sending logic her

            // Send DMX values for each universe
            for (const [universe, channels] of Object.entries(universeData)) {
                let values = new Array(512).fill(255); // Initialize with zeros for all channels
                channels.forEach(({ channel, value }) => {
                    // if (channel <= 301) {
                        values[channel - 1] = value; // Subtracting 1 to adjust for zero-based indexing
                    // }
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
