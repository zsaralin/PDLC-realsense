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
    cameraRowContainer.innerHTML = ''; // Clear previous camera elements

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
    startTracking();
}

// Update the number of cameras based on checkbox states
function updateNumCams() {
    const cam0Checkbox = document.getElementById('cam0Checkbox');
    const cam1Checkbox = document.getElementById('cam1Checkbox');
    
    numCams = 0; // Reset numCams

    if (cam0Checkbox.checked) {
        numCams++;
    }
    if (cam1Checkbox.checked) {
        numCams++;
    }

    console.log(`Number of checked cameras: ${numCams}`);
    createCameraElements(numCams); // Recreate camera elements based on the checkboxes
}

// Add event listeners to the checkboxes
const cam0Checkbox = document.getElementById('cam0Checkbox');
const cam1Checkbox = document.getElementById('cam1Checkbox');

cam0Checkbox.addEventListener('change', updateNumCams);
cam1Checkbox.addEventListener('change', updateNumCams);

// Initial setup to check camera feeds and set the UI
checkCameraFeeds();

export { numCams };
