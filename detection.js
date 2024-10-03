
import { drawStickFigure } from './drawPose.js';
import { numCams } from './cameraSetup.js'; // Import numCams from your camera detection script

const mirror0Checkbox = document.getElementById('mirror0');
const mirror1Checkbox = document.getElementById('mirror1');
const cam0Checkbox = document.getElementById('cam0Checkbox');
const cam1Checkbox = document.getElementById('cam1Checkbox');
const poseCheckbox = document.getElementById('poseCheckbox');

// Load models and start body tracking based on the number of available cameras
export function startTracking(){
Promise.all([loadModel(), loadModel()]).then(([detector0, detector1]) => {
    if (numCams > 0) {
        trackPoses(detector0, 'videoFeed0_duplicate', 'canvas0_duplicate');
    }
    if (numCams > 1) {
        trackPoses(detector1, 'videoFeed1_duplicate', 'canvas1_duplicate');
    }
});
}

// Load the MoveNet body tracking model
async function loadModel() {
    const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING
    });
    return detector;
}


// Function to perform body tracking on a given image and canvas
async function trackPoses(detector, imgId, canvasId) {
    const img = document.getElementById(imgId);
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    // Check if the image and canvas have valid dimensions before proceeding
    if (!img || img.width === 0 || img.height === 0) {
        return; // Exit the function early if the image has invalid dimensions
    }

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
        return; // Exit the function early if the canvas has invalid dimensions
    }

    // Set canvas size based on image dimensions
    canvas.width = img.width;
    canvas.height = img.height;

    async function detect() {
        if (poseCheckbox.checked) {
            updateFPS();

            if ((canvasId === 'canvas0_duplicate' && !cam0Checkbox.checked) || 
                (canvasId === 'canvas1_duplicate' && !cam1Checkbox.checked)) {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if ((canvasId === 'canvas0_duplicate' && mirror0Checkbox.checked) || 
                    (canvasId === 'canvas1_duplicate' && mirror1Checkbox.checked)) {
                    // Flip the canvas horizontally
                    ctx.save();
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                }

                // Draw the image onto the flipped canvas
                ctx.drawImage(img, 0, 0, img.width, img.height);

                const minDepth = parseFloat(minZSlider.value); // Get minimum depth from the slider
                const maxDepth = parseFloat(maxZSlider.value); // Get maximum depth from the slider
                
                // Estimate poses on the original image
                const poses = await detector.estimatePoses(img);
                
                // For each pose, fetch the depth information
                poses.forEach(async (pose, index) => {
                    let totalDepth = 0;
                    let depthCount = 0;
                
                    // Loop through each keypoint in the pose
                    for (let keypoint of pose.keypoints) {
                        if (keypoint.score > 0.2) { // Only consider keypoints with a good score
                            const { x, y } = keypoint;
                
                            // Fetch depth data from the Python backend
                            const depthResponse = await fetch(`http://localhost:5000/get_depth_0/${Math.round(x)}/${Math.round(y)}`);
                            const depthData = await depthResponse.json();
                            
                            if (depthData && depthData.depth) {
                                const depth = depthData.depth;
                
                                // Accumulate depth for the pose
                                totalDepth += depth;
                                depthCount++;
                            }
                        }
                    }
                
                    // Calculate the average depth for the pose
                    const avgDepth = depthCount > 0 ? totalDepth / depthCount : 0;
                    
                    // Exclude poses not within the depth range
                    if (avgDepth < minDepth || avgDepth > maxDepth) {
                        console.log(`Pose ${index} excluded: avg depth ${avgDepth.toFixed(2)} meters out of range.`);
                    } else {
                        // Draw the pose only if it's within the depth range
                        console.log(`Pose ${index} included: avg depth ${avgDepth.toFixed(2)} meters.`);
                        drawStickFigure([pose], ctx, canvasId); // Pass the pose to draw the stick figure
                    }
                });

                ctx.restore();
            }
        }
        requestAnimationFrame(detect);  // Loop the detection
    }

    detect();
}

let lastFrameTime = performance.now();
let fpsElement = document.getElementById('fpsDisplay'); // Assuming you have an element to display FPS

function updateFPS() {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTime;
    const fps = Math.round(1000 / deltaTime); // Calculate FPS
    lastFrameTime = currentTime;

    // Update the FPS display
    if (fpsElement) {
        fpsElement.textContent = `FPS: ${fps}`;
    }
}