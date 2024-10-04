import { startTracking } from "./detection.js";

let numCams = 0; // Initialize the number of cameras

function checkCameraFeeds() {
    const cameraUrls = [
        "http://localhost:5000/video_feed_0",
        "http://localhost:5000/video_feed_1"
        // Add more camera URLs as needed
    ];

    let promises = cameraUrls.map(url => {
        return fetch(url, { method: 'HEAD' })
            .then(response => {
                return response.ok; // Return true if the camera feed is available
            })
            .catch(() => false); // Handle fetch errors without logging
    });

    Promise.all(promises).then(results => {
        numCams = results.filter(isAvailable => isAvailable).length; // Count available cameras
        console.log(`Number of available cameras: ${numCams}`);
        createCameraElements(numCams); // Create camera elements based on available cameras
    });
}


// Function to create and append camera elements
function createCameraElements(numCams) {
    const cameraRowContainer = document.getElementById('camera-row');

    // Create the first camera element
    if (numCams >= 1) {
        const cameraContainer = document.createElement('div');
        cameraContainer.className = 'camera-container';

        const videoFeed = document.createElement('img');
        videoFeed.id = `videoFeed0`;
        videoFeed.crossOrigin = 'anonymous';
        videoFeed.src = `http://localhost:5000/video_feed_0`;
        videoFeed.alt = `Camera 0 Feed`;

        const duplicateContainer = document.createElement('div');
        duplicateContainer.className = 'duplicate-container';

        const videoFeedDuplicate = document.createElement('img');
        videoFeedDuplicate.id = `videoFeed0_duplicate`;
        videoFeedDuplicate.crossOrigin = 'anonymous';
        videoFeedDuplicate.src = `http://localhost:5000/video_feed_0`;
        videoFeedDuplicate.alt = `Camera 0 Duplicate Feed`;

        const canvas = document.createElement('canvas');
        canvas.id = `canvas0_duplicate`; // Unique ID for each canvas
        
        duplicateContainer.appendChild(videoFeedDuplicate);
        duplicateContainer.appendChild(canvas);
        cameraContainer.appendChild(videoFeed);
        cameraContainer.appendChild(duplicateContainer);
        cameraRowContainer.appendChild(cameraContainer);
    }

    // Create the second camera element only if numCams is 2
    if (numCams === 2) {
        const cameraContainer = document.createElement('div');
        cameraContainer.className = 'camera-container';

        const videoFeed = document.createElement('img');
        videoFeed.id = `videoFeed1`;
        videoFeed.crossOrigin = 'anonymous';
        videoFeed.src = `http://localhost:5000/video_feed_1`;
        videoFeed.alt = `Camera 1 Feed`;

        const duplicateContainer = document.createElement('div');
        duplicateContainer.className = 'duplicate-container';

        const videoFeedDuplicate = document.createElement('img');
        videoFeedDuplicate.id = `videoFeed1_duplicate`;
        videoFeedDuplicate.crossOrigin = 'anonymous';
        videoFeedDuplicate.src = `http://localhost:5000/video_feed_1`;
        videoFeedDuplicate.alt = `Camera 1 Duplicate Feed`;

        const canvas = document.createElement('canvas');
        canvas.id = `canvas1_duplicate`; // Unique ID for each canvas

        duplicateContainer.appendChild(videoFeedDuplicate);
        duplicateContainer.appendChild(canvas);
        cameraContainer.appendChild(videoFeed);
        cameraContainer.appendChild(duplicateContainer);
        cameraRowContainer.appendChild(cameraContainer);
    }
    startTracking()
}

checkCameraFeeds()

export {numCams}