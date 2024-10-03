const fs = require('fs');
const { parse } = require('csv-parse');

// Function to parse a single CSV file and create a mapping object
function parseCsvFile(filePath) {
    return new Promise((resolve, reject) => {
        const records = [];
        fs.createReadStream(filePath)
            .pipe(parse({ columns: true, trim: true }))
            .on('data', (record) => {
                records.push(record);
            })
            .on('end', () => {
                const mapping = records.reduce((acc, record) => {
                    const row = parseInt(record['row'], 10);
                    const col = parseInt(record['col'], 10);
                    const key = `${row}-${col}`;
                    acc[key] = {
                        dmxUniverse: parseInt(record['dmx universe'], 10),
                        dmxChannel: parseInt(record['dmx channel'], 10),
                        dimmerSpeed: parseFloat(record['dimmer_speed'])
                    };
                    return acc;
                }, {});
                resolve(mapping);
            })
            .on('error', reject);
    });
}

// Function to create CSV mappings for both file paths
function createCsvMapping() {
    const filePaths = ['./layout0.csv'];
    return Promise.all(filePaths.map(filePath => parseCsvFile(filePath)));
}

module.exports = { createCsvMapping };
