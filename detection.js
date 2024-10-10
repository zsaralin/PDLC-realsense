import { drawBodyLine, drawStickFigure } from './drawPose.js';
import { numCams } from './cameraSetup.js'; 
import { setSliderMax } from './setupSidepanel.js';

const mirror0Checkbox = document.getElementById('mirror0');
const mirror1Checkbox = document.getElementById('mirror1');
const cam0Checkbox = document.getElementById('cam0Checkbox');
const cam1Checkbox = document.getElementById('cam1Checkbox');
const poseCheckbox = document.getElementById('poseCheckbox');
const domesticCheckbox = document.getElementById('domesticCheckbox');

// Load models and start body tracking based on the number of available cameras
export function startTracking(){
    Promise.all([loadModel(), loadModel()]).then(([detector0, detector1]) => {
        if (numCams > 0) {
            initializeCanvasAndSliders('canvas0_duplicate');
            trackPoses(detector0, 'videoFeed0_duplicate', 'canvas0_duplicate');
        }
        if (numCams > 1) {
            initializeCanvasAndSliders('canvas1_duplicate');
            trackPoses(detector1, 'videoFeed1_duplicate', 'canvas1_duplicate');
        }
    });
}

// Initialize canvas size and sliders for cutoff values
function initializeCanvasAndSliders(canvasId) {
    const canvas = document.getElementById(canvasId);
    const img = document.getElementById(canvasId.replace('canvas', 'videoFeed')); // Assuming canvasId and videoFeedId match pattern
    canvas.width = img.width;
    canvas.height = img.height;

    // Set slider max values based on canvas size
    setSliderMax("rightEdgeCutoff0Slider", canvas.width);
    setSliderMax("leftEdgeCutoff0Slider", canvas.width);
    setSliderMax("topEdgeCutoff0Slider", canvas.height);
    setSliderMax("bottomEdgeCutoff0Slider", canvas.height);
    setSliderMax("rightEdgeCutoff1Slider", canvas.width);
    setSliderMax("leftEdgeCutoff1Slider", canvas.width);
    setSliderMax("topEdgeCutoff1Slider", canvas.height);
    setSliderMax("bottomEdgeCutoff1Slider", canvas.height);
}

// Load the MoveNet body tracking model
async function loadModel() {
    try {
        console.log("Starting to load MoveNet model...");

        const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
            modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
            modelUrl: '/cdns/movenet/model.json', // Ensure this path is correct
            // maxPoses: 6, // Set the number of poses to the maximum MoveNet can handle (up to 6),
            // enableSmoothing: true, // Set to true to reduce jitter in keypoints
            // inputResolution: { width: 640, height: 480 } // Set the resolution of the input images
        });

        console.log("Model loaded successfully:", detector);
        return detector;

    } catch (error) {
        console.error("Error while loading the model:", error);
    }
}


// Function to perform body tracking on a given image and canvas
async function trackPoses(detector, imgId, canvasId) {
    const img = document.getElementById(imgId);
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');

    async function detect() {
        if (img.width === 0 || img.height === 0) {
            console.warn(`Skipping detection for ${canvasId}: Image has invalid dimensions.`);
            requestAnimationFrame(detect); // Skip this frame and move to the next one
            return; // Exit this detect cycle
        }
        canvas.width = img.width;
        canvas.height = img.height;
        const rightEdgeCutoff = canvasId === "canvas0_duplicate" ? parseInt(document.getElementById('rightEdgeCutoff0Slider').value):parseInt(document.getElementById('rightEdgeCutoff1Slider').value)
        const leftEdgeCutoff = canvasId === "canvas0_duplicate" ? parseInt(document.getElementById('leftEdgeCutoff0Slider').value):parseInt(document.getElementById('leftEdgeCutoff1Slider').value)
        const topEdgeCutoff = canvasId === "canvas0_duplicate" ? parseInt(document.getElementById('topEdgeCutoff0Slider').value):parseInt(document.getElementById('topEdgeCutoff1Slider').value)
        const bottomEdgeCutoff = canvasId === "canvas0_duplicate" ? parseInt(document.getElementById('bottomEdgeCutoff0Slider').value):parseInt(document.getElementById('bottomEdgeCutoff1Slider').value)
        if (poseCheckbox.checked || domesticCheckbox.checked) {
            updateFPS();

            if ((canvasId === 'canvas0_duplicate' && !cam0Checkbox.checked) ||
                (canvasId === 'canvas1_duplicate' && !cam1Checkbox.checked)) {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if ((canvasId === 'canvas0_duplicate' && mirror0Checkbox.checked) ||
                    (canvasId === 'canvas1_duplicate' && mirror1Checkbox.checked)) {
                    ctx.save();
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                }

                // Draw the image onto the flipped canvas
                ctx.drawImage(img, 0, 0, img.width, img.height);

                // Draw bars if any of the slider values are not 0
                ctx.fillStyle = "black";  // Bar color

                if (leftEdgeCutoff > 0) {
                    ctx.fillRect(0, 0, leftEdgeCutoff, canvas.height);  // Left bar
                }
                if (rightEdgeCutoff > 0) {
                    ctx.fillRect(canvas.width - rightEdgeCutoff, 0, rightEdgeCutoff, canvas.height);  // Right bar
                }
                if (topEdgeCutoff > 0) {
                    ctx.fillRect(0, 0, canvas.width, topEdgeCutoff);  // Top bar
                }
                if (bottomEdgeCutoff > 0) {
                    ctx.fillRect(0, canvas.height - bottomEdgeCutoff, canvas.width, bottomEdgeCutoff);  // Bottom bar
                }

                // Estimate poses on the original image
                // console.log(detector.estimatePoses(canvas))
                if (canvas.width === 0 || canvas.height === 0) {
                    console.error("Canvas has invalid dimensions:", canvas.width, canvas.height);
                } else {
                    let poses = await detector.estimatePoses(canvas);
                    const isMirrored = (canvasId === 'canvas0_duplicate' && mirror0Checkbox.checked) ||
                        (canvasId === 'canvas1_duplicate' && mirror1Checkbox.checked);

                    // If mirrored, flip the keypoints horizontally
                    if (isMirrored) {
                        poses.forEach(pose => {
                            pose.keypoints.forEach(keypoint => {
                                keypoint.x = canvas.width - keypoint.x;  // Flip horizontally
                            });
                        });
                    }

                    // Draw the stick figure only if there are valid poses
                    if(poseCheckbox.checked){
                        drawStickFigure(poses, ctx, canvasId);
                    }
                    else if(domesticCheckbox.checked){
                        drawBodyLine(poses, ctx, canvasId)
                    }


                    ctx.restore();
                }

            }
        }

        requestAnimationFrame(detect); // Loop the detection
    }

    detect();
}

// Function to update the FPS display
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
