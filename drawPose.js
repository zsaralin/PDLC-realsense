import { drawAndCopyToWhiteCanvas } from "./whiteCanvas.js";
// Define constants for sliders and their display elements
const bodyWidthSlider = document.getElementById('bodySlider');
const headSlider = document.getElementById('headSlider');
const armLengthSlider = document.getElementById('armSlider');
const stretchySlider = document.getElementById('stretchySlider');
const stretchxSlider = document.getElementById('stretchxSlider');
const offsetXSlider = document.getElementById('offsetXSlider');
const offsetYSlider = document.getElementById('offsetYSlider');

const previousKeypoints = {
    'canvas0_duplicate': {},
    'canvas1_duplicate': {}
};

// Function to apply offsetX and offsetY to keypoints
function applyOffsetsAndStretch(keypoints, offsetX, offsetY, stretchX, stretchY) {
    // Calculate the center x and y position of the torso (hips and nose) for reference
    const torsoKeypoints = keypoints.filter(kp => ['left_hip', 'right_hip'].includes(kp.name));
    const minX = Math.min(...torsoKeypoints.map(kp => kp.x));
    const maxX = Math.max(...torsoKeypoints.map(kp => kp.x));
    const centerX = (minX + maxX) / 2;

    const minY = Math.min(...torsoKeypoints.map(kp => kp.y));
    const maxY = Math.max(...torsoKeypoints.map(kp => kp.y));
    const centerY = (minY + maxY) / 2;

    // Stretch limbs (arms, legs, and head) but not the center line (torso, hips, nose)
    return keypoints.map(kp => {
        // Stretch for limbs and head (not nose, hips)
        if (['left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle', 'nose'].includes(kp.name)) {
            return {
                ...kp,
                x: centerX + (kp.x - centerX) * stretchX + offsetX, // Stretch limbs and head horizontally
                y: centerY + (kp.y - centerY) * stretchY + offsetY // Stretch limbs and head vertically
            };
        } else {
            // No stretch for torso, hips, or nose, only apply offsets
            return {
                ...kp,
                x: kp.x + offsetX, // Only apply horizontal offset
                y: kp.y + offsetY // Only apply vertical offset
            };
        }
    });
}// Counters for consistency checks


// Function to draw stick figure on the transparent canvas and call drawAndCopyToWhiteCanvas
// Counters for consistency checks (store counters per canvas and per person)
const drawStateCounters = {
    'canvas0_duplicate': [],
    'canvas1_duplicate': []
};

const thresholdFrames = 50; // Number of frames to wait for stability before updating

// Function to smooth keypoints between frames for each person
function smoothKeypoints(currentKeypoints, previousKeypoints, smoothingFactor = 0.1) {
    if (!previousKeypoints) return currentKeypoints; // No previous data, no smoothing

    return currentKeypoints.map((current, index) => {
        const previous = previousKeypoints[index];
        if (!previous) return current; // No previous point

        return {
            ...current,
            x: previous.x + smoothingFactor * (current.x - previous.x),
            y: previous.y + smoothingFactor * (current.y - previous.y),
            score: current.score // Keep the confidence score from the current frame
        };
    });
}

// Function to check consistency and return a boolean for drawing
function checkConsistency(drawBool, counterType, canvasId, personIndex, keypointScore) {
    if (!drawStateCounters[canvasId][personIndex]) {
        drawStateCounters[canvasId][personIndex] = { head: 0, torso: 0, arms: 0, legs: 0 };
    }

    const counters = drawStateCounters[canvasId][personIndex];
    // Reset the counter if keypoint score is less than 0.2
    if (keypointScore < 0.2) {
        counters[counterType] = 0;
        return false;
    }

    // Increase counter if drawing condition is true
    if (drawBool) {
        counters[counterType]++;
        if (counters[counterType] > thresholdFrames) {
            return true;
        }
    } else {
        counters[counterType] = 0;
    }

    return false;
}

// Function to draw stick figure on the transparent canvas and call drawAndCopyToWhiteCanvas
export function drawStickFigure(poses, ctx, canvasId) {
    const transparentCanvas = document.createElement('canvas');
    transparentCanvas.width = ctx.canvas.width;
    transparentCanvas.height = ctx.canvas.height;
    const transparentCtx = transparentCanvas.getContext('2d');

    const offsetX = parseInt(offsetXSlider.value, 10);
    const offsetY = parseInt(offsetYSlider.value, 10);
    const stretchX = parseFloat(stretchxSlider.value, 10);
    const stretchY = parseFloat(stretchySlider.value, 10);
    if (poses.length === 0) {
        drawStateCounters[canvasId] = [];
        previousKeypoints[canvasId] = [];
        return;
    }
    poses.forEach((pose, personIndex) => {
        if (!previousKeypoints[canvasId]) previousKeypoints[canvasId] = {};

        // Ensure previousKeypoints and drawStateCounters exist for this person
        if (!previousKeypoints[canvasId][personIndex]) previousKeypoints[canvasId][personIndex] = [];
        if (!drawStateCounters[canvasId][personIndex]) drawStateCounters[canvasId][personIndex] = { head: 0, torso: 0, arms: 0, legs: 0 };

        const smoothedKeypoints = smoothKeypoints(pose.keypoints, previousKeypoints[canvasId][personIndex]);
        const keypointsWithOffset = applyOffsetsAndStretch(smoothedKeypoints, offsetX, offsetY, stretchX, stretchY);

        previousKeypoints[canvasId][personIndex] = keypointsWithOffset;

        const keypoints = keypointsWithOffset;

        // Find keypoints
        const nose = keypoints.find(kp => kp.name === 'nose');
        const leftEye = keypoints.find(kp => kp.name === 'left_eye');
        const rightEye = keypoints.find(kp => kp.name === 'right_eye');
        const leftHip = keypoints.find(kp => kp.name === 'left_hip');
        const rightHip = keypoints.find(kp => kp.name === 'right_hip');
        const leftElbow = keypoints.find(kp => kp.name === 'left_elbow');
        const rightElbow = keypoints.find(kp => kp.name === 'right_elbow');
        const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
        const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
        const leftKnee = keypoints.find(kp => kp.name === 'left_knee');
        const rightKnee = keypoints.find(kp => kp.name === 'right_knee');
        const leftAnkle = keypoints.find(kp => kp.name === 'left_ankle');
        const rightAnkle = keypoints.find(kp => kp.name === 'right_ankle');

        // Boolean flags for drawing parts based on keypoints and confidence score
        let drawHead = nose?.score > 0.2 && leftEye?.score > 0.2 && rightEye?.score > 0.2;
        let drawTorso = nose?.score > 0.2 && leftHip?.score > 0.2 && rightHip?.score > 0.2;
        let drawLegs = leftKnee?.score > 0.2 && rightKnee?.score > 0.2 && leftAnkle?.score > 0.2 && rightAnkle?.score > 0.2;
        let drawArms = leftElbow?.score > 0.2 && leftWrist?.score > 0.2 && rightElbow?.score > 0.2 && rightWrist?.score > 0.2;

        // Apply consistency check
        drawHead = checkConsistency(drawHead, 'head', canvasId, personIndex, Math.min(nose?.score || 0, leftEye?.score || 0, rightEye?.score || 0));
        drawTorso = checkConsistency(drawTorso, 'torso', canvasId, personIndex, Math.min(nose?.score || 0, leftHip?.score || 0, rightHip?.score || 0));
        drawArms = checkConsistency(drawArms, 'arms', canvasId, personIndex, Math.min(leftElbow?.score || 0, rightElbow?.score || 0, leftWrist?.score || 0, rightWrist?.score || 0));
        drawLegs = checkConsistency(drawLegs, 'legs', canvasId, personIndex, Math.min(leftKnee?.score || 0, rightKnee?.score || 0, leftAnkle?.score || 0, rightAnkle?.score || 0));

        // Helper function to draw lines
        function drawLine(p1, p2, color = "black") {
            const thickness = parseInt(bodyWidthSlider.value, 10);
            if (p1.score > 0.2 && p2.score > 0.2) {
                transparentCtx.beginPath();
                transparentCtx.moveTo(p1.x, p1.y);
                transparentCtx.lineTo(p2.x, p2.y);
                transparentCtx.strokeStyle = color;
                transparentCtx.lineWidth = thickness;
                transparentCtx.stroke();
            }
        }

        if (drawHead) {
            const headRadiusX = parseInt(headSlider.value, 10) / 2;
            const headRadiusY = headRadiusX * 2;
            if (nose.score > 0.2) {
                transparentCtx.beginPath();
                transparentCtx.ellipse(nose.x, nose.y, headRadiusX, headRadiusY, 0, 0, 2 * Math.PI);
                transparentCtx.fillStyle = "black";
                transparentCtx.fill();
                transparentCtx.stroke();
            }
        

        let torsoStart, torsoEnd;
        if (drawTorso) {
            const hipCenterX = (leftHip.x + rightHip.x) / 2;
            const hipCenterY = (leftHip.y + rightHip.y) / 2;
            torsoStart = { x: nose.x, y: nose.y, score: nose.score };
            torsoEnd = { x: hipCenterX, y: drawLegs ? hipCenterY : hipCenterY * 2, score: Math.min(leftHip.score, rightHip.score) };
            drawLine(torsoStart, torsoEnd);
        } else {
            torsoStart = { x: nose.x, y: nose.y, score: nose.score };
            torsoEnd = { x: nose.x, y: transparentCanvas.height, score: nose.score };
            drawLine(torsoStart, torsoEnd);
        }

        const shoulderRatio = 0.2;
        const leftShoulder = {
            x: torsoStart.x + (torsoEnd.x - torsoStart.x) * shoulderRatio,
            y: torsoStart.y + (torsoEnd.y - torsoStart.y) * shoulderRatio,
            score: Math.min(torsoStart.score, torsoEnd.score)
        };
        const rightShoulder = {
            x: torsoStart.x - (torsoEnd.x - torsoStart.x) * shoulderRatio,
            y: leftShoulder.y,
            score: leftShoulder.score
        };

        if (drawArms) {
            const leftElbowExtended = {
                x: leftShoulder.x + armLengthSlider.value * (leftElbow.x - leftShoulder.x),
                y: leftShoulder.y + armLengthSlider.value * (leftElbow.y - leftShoulder.y),
                score: leftElbow.score
            };
            const leftWristExtended = {
                x: leftElbowExtended.x + armLengthSlider.value * (leftWrist.x - leftElbow.x),
                y: leftElbowExtended.y + armLengthSlider.value * (leftWrist.y - leftElbow.y),
                score: leftWrist.score
            };
            drawLine(leftShoulder, leftElbowExtended);
            drawLine(leftElbowExtended, leftWristExtended);

            const rightElbowExtended = {
                x: rightShoulder.x + armLengthSlider.value * (rightElbow.x - rightShoulder.x),
                y: rightShoulder.y + armLengthSlider.value * (rightElbow.y - rightShoulder.y),
                score: rightElbow.score
            };
            const rightWristExtended = {
                x: rightElbowExtended.x + armLengthSlider.value * (rightWrist.x - rightElbow.x),
                y: rightElbowExtended.y + armLengthSlider.value * (rightWrist.y - rightElbow.y),
                score: rightWrist.score
            };
            drawLine(rightShoulder, rightElbowExtended);
            drawLine(rightElbowExtended, rightWristExtended);
        }

        if (drawLegs) {
            drawLine(torsoEnd, leftKnee);
            drawLine(torsoEnd, rightKnee);

            const extendedLeftAnkle = {
                ...leftAnkle,
                y: Math.max(leftAnkle.y, ctx.canvas.height + 20) // Extend past canvas height by 20 pixels
            };
            const extendedRightAnkle = {
                ...rightAnkle,
                y: Math.max(rightAnkle.y, ctx.canvas.height + 20) // Extend past canvas height by 20 pixels
            };

            drawLine(leftKnee, extendedLeftAnkle);
            drawLine(rightKnee, extendedRightAnkle);
        }
    }
    });

    ctx.drawImage(transparentCanvas, 0, 0);
    drawAndCopyToWhiteCanvas(poses, transparentCtx, canvasId);
}



export function drawBodyLine(poses, ctx, canvasId) {
    const transparentCanvas = document.createElement('canvas');
    transparentCanvas.width = ctx.canvas.width;
    transparentCanvas.height = ctx.canvas.height;
    const transparentCtx = transparentCanvas.getContext('2d');

    if (poses.length === 0) {
        previousKeypoints[canvasId] = []; // Reset previous keypoints if no pose is detected
        return; // If no poses are detected, do nothing
    }

    poses.forEach((pose, personIndex) => {
        if (!previousKeypoints[canvasId]) previousKeypoints[canvasId] = [];

        // Smooth keypoints
        const smoothedKeypoints = smoothKeypoints(pose.keypoints, previousKeypoints[canvasId]);
        previousKeypoints[canvasId] = smoothedKeypoints; // Update previous keypoints for the next frame

        // Find smoothed keypoints for left and right hips
        const leftHip = smoothedKeypoints.find(kp => kp.name === 'left_hip' && kp.score > 0.2);
        const rightHip = smoothedKeypoints.find(kp => kp.name === 'right_hip' && kp.score > 0.2);

        // If both hips are detected, draw the body line with the gradient
        if (leftHip && rightHip) {
            const centerX = (leftHip.x + rightHip.x) / 2; // Calculate the center x-position of the body
            const lineWidth = parseInt(bodyWidthSlider.value, 10)*2; // Use the body width slider for line thickness

            // Create a horizontal gradient that fades to white on either side of the black line
            const gradient = transparentCtx.createLinearGradient(centerX - lineWidth, 0, centerX + lineWidth, 0);
            gradient.addColorStop(0, 'white'); // Left side fades to white
            gradient.addColorStop(0.5, 'black'); // Center is black
            gradient.addColorStop(1, 'white'); // Right side fades to white

            // Draw the body line with the gradient
            transparentCtx.beginPath();
            transparentCtx.moveTo(centerX, 0); // Start at the top of the canvas
            transparentCtx.lineTo(centerX, transparentCanvas.height); // End at the bottom of the canvas
            transparentCtx.strokeStyle = gradient; // Use the gradient as the stroke style
            transparentCtx.lineWidth = lineWidth; // Set the line width
            transparentCtx.stroke(); // Draw the line
        }
    });

    // Draw the transparent canvas onto the original canvas
    ctx.drawImage(transparentCanvas, 0, 0);
    drawAndCopyToWhiteCanvas(poses, transparentCtx, canvasId);
}