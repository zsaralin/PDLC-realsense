import { drawAndCopyToWhiteCanvas } from "./whiteCanvas.js";
// Define constants for sliders and their display elements
const bodyWidthSlider = document.getElementById('bodySlider');
const armWidthSlider = document.getElementById('armWidthSlider');

const headSlider = document.getElementById('headSlider');
const armLengthSlider = document.getElementById('armSlider');
const stretchySlider = document.getElementById('stretchySlider');
const stretchxSlider = document.getElementById('stretchxSlider');
const offsetX0Slider = document.getElementById('offsetX0Slider');
const offsetX1Slider = document.getElementById('offsetX1Slider');

const offsetY0Slider = document.getElementById('offsetY0Slider');
const offsetY1Slider = document.getElementById('offsetY1Slider');

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

// Function to draw stick figure on the transparent canvas and call drawAndCopyToWhiteCanvas
export function drawStickFigure(poses, ctx, canvasId) {
    const transparentCanvas = document.createElement('canvas');
    transparentCanvas.width = ctx.canvas.width;
    transparentCanvas.height = ctx.canvas.height;
    const transparentCtx = transparentCanvas.getContext('2d');

    const offsetX = canvasId === "canvas0_duplicate" ?  parseInt(offsetX0Slider.value, 10) : parseInt(offsetX1Slider.value, 10);
    const offsetY = canvasId === "canvas0_duplicate" ?  parseInt(offsetY0Slider.value, 10) : parseInt(offsetY1Slider.value, 10);
    const stretchX = parseFloat(stretchxSlider.value, 10);
    const stretchY = parseFloat(stretchySlider.value, 10);
    if (poses.length === 0) {
        drawAndCopyToWhiteCanvas(poses, transparentCtx, canvasId, true);
        return;
    }
    poses.forEach((pose, personIndex) => {
        const keypoints = applyOffsetsAndStretch(pose.keypoints, offsetX, offsetY, stretchX, stretchY);
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

        const armLengthMultiplier = armLengthSlider.value;

        let drawHead = nose?.score > 0.2 && leftEye?.score > 0.2 && rightEye?.score > 0.2;
        let drawTorso = nose?.score > 0.2 && leftHip?.score > 0.2 && rightHip?.score > 0.2;
        let drawLeftArm = leftElbow?.score > 0.2 && leftWrist?.score > 0.2;
        let drawRightArm = rightElbow?.score > 0.2 && rightWrist?.score > 0.2;
        let drawLeftLeg = leftKnee?.score > 0.2 && leftAnkle?.score > 0.2;
        let drawRightLeg = rightKnee?.score > 0.2 && rightAnkle?.score > 0.2;

        function drawLine(p1, p2, color = "black") {
            const thickness = parseInt(armWidthSlider.value, 10);
            if (p1.score > 0.2 && p2.score > 0.2) {
                transparentCtx.beginPath();
                transparentCtx.moveTo(p1.x, p1.y);
                transparentCtx.lineTo(p2.x, p2.y);
                transparentCtx.strokeStyle = color;
                transparentCtx.lineWidth = thickness;
                transparentCtx.stroke();
            }
        }

        function drawBodyLine(p1, p2, color = "black") {
            const thickness = parseInt(bodyWidthSlider.value, 10);
            if (p1.score > 0.2 && p2.score > 0.2) {
                transparentCtx.beginPath();
                transparentCtx.moveTo(p1.x, p1.y);
                transparentCtx.lineTo(p2.x, p2.y);
                transparentCtx.strokeStyle = color;
                transparentCtx.lineWidth = thickness * 2;
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
        }

        let torsoStart, torsoEnd;
        if (drawTorso) {
            const hipCenterX = (leftHip.x + rightHip.x) / 2;
            const hipCenterY = (leftHip.y + rightHip.y) / 2;
            torsoStart = { x: nose.x, y: nose.y, score: nose.score };
            torsoEnd = { x: hipCenterX, y: hipCenterY * 1, score: Math.min(leftHip.score, rightHip.score) };
            drawBodyLine(torsoStart, torsoEnd);
        } else {
            torsoStart = { x: nose.x, y: nose.y, score: nose.score };
            torsoEnd = { x: nose.x, y: transparentCanvas.height, score: nose.score };
            drawBodyLine(torsoStart, torsoEnd);
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

        if (drawLeftArm) {
            const shoulderToWrist = {
                x: leftWrist.x - leftShoulder.x,
                y: leftWrist.y - leftShoulder.y
            };
            const horizontalLeeway = 30;
            const isArmStraightDown = Math.abs(leftWrist.x - leftShoulder.x) < horizontalLeeway;
            if (isArmStraightDown) {
                const leftElbowStraightened = {
                    x: leftShoulder.x,
                    y: leftShoulder.y + armLengthMultiplier * 0.5 * shoulderToWrist.y,
                    score: leftElbow.score
                };
        
                const leftWristExtended = {
                    x: leftShoulder.x,
                    y: leftShoulder.y + armLengthMultiplier * shoulderToWrist.y,
                    score: leftWrist.score
                };
        
                drawLine(leftShoulder, leftElbowStraightened);
                drawLine(leftElbowStraightened, leftWristExtended);
            } else {
                const leftElbowStraightened = {
                    x: leftShoulder.x + armLengthMultiplier * 0.5 * shoulderToWrist.x,
                    y: leftShoulder.y + armLengthMultiplier * 0.5 * shoulderToWrist.y,
                    score: leftElbow.score
                };
        
                const leftWristExtended = {
                    x: leftShoulder.x + armLengthMultiplier * shoulderToWrist.x,
                    y: leftShoulder.y + armLengthMultiplier * shoulderToWrist.y,
                    score: leftWrist.score
                };
        
                drawLine(leftShoulder, leftElbowStraightened);
                drawLine(leftElbowStraightened, leftWristExtended);
            }
        }
        
        if (drawRightArm) {
            const shoulderToWrist = {
                x: rightWrist.x - rightShoulder.x,
                y: rightWrist.y - rightShoulder.y
            };
            const horizontalLeeway = 20;
            const isArmStraightDown =  Math.abs(rightWrist.x - rightShoulder.x) < horizontalLeeway;
        
            if (isArmStraightDown) {
                const rightElbowStraightened = {
                    x: rightShoulder.x,
                    y: rightShoulder.y + armLengthMultiplier * 0.5 * shoulderToWrist.y,
                    score: rightElbow.score
                };
        
                const rightWristExtended = {
                    x: rightShoulder.x,
                    y: rightShoulder.y + armLengthMultiplier * shoulderToWrist.y,
                    score: rightWrist.score
                };
        
                drawLine(rightShoulder, rightElbowStraightened);
                drawLine(rightElbowStraightened, rightWristExtended);
            } else {
                const rightElbowStraightened = {
                    x: rightShoulder.x + armLengthMultiplier * 0.5 * shoulderToWrist.x,
                    y: rightShoulder.y + armLengthMultiplier * 0.5 * shoulderToWrist.y,
                    score: rightElbow.score
                };
        
                const rightWristExtended = {
                    x: rightShoulder.x + armLengthMultiplier * shoulderToWrist.x,
                    y: rightShoulder.y + armLengthMultiplier * shoulderToWrist.y,
                    score: rightWrist.score
                };
        
                drawLine(rightShoulder, rightElbowStraightened);
                drawLine(rightElbowStraightened, rightWristExtended);
            }
        }
        
        function drawLeftLegFunc(leftKnee, leftAnkle, torsoEnd, ctx) {
            drawLine(torsoEnd, leftKnee);
            const extendedLeftAnkle = {
                ...leftAnkle,
                y: Math.max(leftAnkle.y, ctx.canvas.height + 20)
            };
            drawLine(leftKnee, extendedLeftAnkle);
        }

        function drawRightLegFunc(rightKnee, rightAnkle, torsoEnd, ctx) {
            drawLine(torsoEnd, rightKnee);
            const extendedRightAnkle = {
                ...rightAnkle,
                y: Math.max(rightAnkle.y, ctx.canvas.height + 20)
            };
            drawLine(rightKnee, extendedRightAnkle);
        }

        if (drawLeftLeg) {
            drawLeftLegFunc(leftKnee, leftAnkle, torsoEnd, ctx);
        }

        if (drawRightLeg) {
            drawRightLegFunc(rightKnee, rightAnkle, torsoEnd, ctx);
        }
    });

    ctx.drawImage(transparentCanvas, 0, 0);
    drawAndCopyToWhiteCanvas(poses, transparentCtx, canvasId, true);
}


export function drawBodyLine(poses, ctx, canvasId) {
    const transparentCanvas = document.createElement('canvas');
    transparentCanvas.width = ctx.canvas.width;
    transparentCanvas.height = ctx.canvas.height;
    const transparentCtx = transparentCanvas.getContext('2d');


    const offsetX = canvasId === "canvas0_duplicate" ?  parseInt(offsetX0Slider.value, 10) : parseInt(offsetX1Slider.value, 10);
    const offsetY = 0//parseInt(offsetYSlider.value, 10);
    const stretchX = parseFloat(stretchxSlider.value, 10);
    const stretchY = parseFloat(stretchySlider.value, 10);

    if (poses.length === 0) {
        drawAndCopyToWhiteCanvas(poses, transparentCtx, canvasId, true);
        return;
    }
    poses.forEach((pose) => {
        const keypoints = applyOffsetsAndStretch(pose.keypoints, offsetX, offsetY, stretchX, stretchY);

        // Get keypoints for hips
        const leftHip = keypoints.find(kp => kp.name === 'left_hip' && kp.score > 0.2);
        const rightHip = keypoints.find(kp => kp.name === 'right_hip' && kp.score > 0.2);

        // Draw the body line if both hips are detected
        if (leftHip && rightHip) {
            const centerX = (leftHip.x + rightHip.x) / 2; // Calculate the center x-position of the body

            // Function to draw a line with gradient
            const drawGradientLine = (lineWidth, colorStops) => {
                const gradient = transparentCtx.createLinearGradient(centerX - lineWidth, 0, centerX + lineWidth, 0);
                colorStops.forEach(([offset, color]) => gradient.addColorStop(offset, color));

                transparentCtx.beginPath();
                transparentCtx.moveTo(centerX, 0); // Start at the top of the canvas
                transparentCtx.lineTo(centerX, transparentCanvas.height); // End at the bottom of the canvas
                transparentCtx.strokeStyle = gradient; // Use the gradient as the stroke style
                transparentCtx.lineWidth = lineWidth; // Set the line width
                transparentCtx.stroke(); // Draw the line
            };

            // Draw thicker line with gradient
            const thickLineWidth = parseInt(bodyWidthSlider.value, 10) * 4;
            drawGradientLine(thickLineWidth, [
                [0, 'white'],        // Left fades to white
                [0.5, 'rgb(80,80,80)'], // Center is dark grey
                [1, 'white']         // Right fades to white
            ]);

            // Draw thinner black line
            const thinLineWidth = parseInt(bodyWidthSlider.value, 10);
            drawGradientLine(thinLineWidth, [
                [0, 'black'],        // Left side
                [0.5, 'black'],      // Center is black
                [1, 'black']         // Right side
            ]);
        }
    });

    // Draw the transparent canvas onto the original canvas
    ctx.drawImage(transparentCanvas, 0, 0);
    drawAndCopyToWhiteCanvas(poses, transparentCtx, canvasId);
}