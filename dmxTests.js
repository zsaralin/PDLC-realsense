import { drawToPixelatedCanvas } from "./pixelatedCanvas.js";
export function handleFadeAnimation(canvas, ctx) {
    let alpha = 0;
    let fadeIn = true;
    let fadeInterval;

    function startFade() {
        fadeInterval = setInterval(function() {
            const colorValue = Math.round(alpha * 255);
            ctx.fillStyle = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (fadeIn) {
                alpha += 0.01;
                if (alpha >= 1) fadeIn = false;
            } else {
                alpha -= 0.01;
                if (alpha <= 0) fadeIn = true;
            }
        drawToPixelatedCanvas()

        }, 30);
    }

    function stopFade() {
        if (fadeInterval) {
            clearInterval(fadeInterval);
            fadeInterval = null;
        }
    }

    return {
        startFade,
        stopFade
    };
}
export function handleGradientAnimation(canvas, ctx) {
    const canvasHeight = canvas.height;
    const visibleCanvasWidth = canvas.width;
    const extendedCanvasWidth = visibleCanvasWidth * 3;  // 3x the width of the visible canvas

    let gradientPosition = 0;
    let gradientInterval;

    // Create an offscreen canvas to hold the 3x wide gradient
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = extendedCanvasWidth;
    offscreenCanvas.height = canvasHeight;

    // Function to draw the gradient on the offscreen canvas
    function drawGradient() {
        // Left third: fully black
        offscreenCtx.fillStyle = 'white';
        offscreenCtx.fillRect(0, 0, visibleCanvasWidth, canvasHeight);

        // Middle third: smooth gradient from black to white
        const gradient = offscreenCtx.createLinearGradient(visibleCanvasWidth, 0, visibleCanvasWidth * 2, 0);
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(0.5, 'gray'); // Add gray in the middle for smooth transition
        gradient.addColorStop(1, 'black');
        offscreenCtx.fillStyle = gradient;
        offscreenCtx.fillRect(visibleCanvasWidth, 0, visibleCanvasWidth, canvasHeight);

        // Right third: fully white
        offscreenCtx.fillStyle = 'black';
        offscreenCtx.fillRect(visibleCanvasWidth * 2, 0, visibleCanvasWidth, canvasHeight);
    }
    function startGradient() {
        drawGradient();  // Draw the gradient onto the offscreen canvas
    
        let gradientDirection = 1; // 1 for moving right, -1 for moving left
    
        gradientInterval = setInterval(function() {
            // Clear the visible canvas
            ctx.clearRect(0, 0, visibleCanvasWidth, canvasHeight);
    
            // Draw the portion of the offscreen canvas onto the visible canvas
            ctx.drawImage(
                offscreenCanvas,
                gradientPosition, 0, visibleCanvasWidth, canvasHeight,
                0, 0, visibleCanvasWidth, canvasHeight
            );
    
            // Move the gradient position based on the direction
            gradientPosition += gradientDirection * 5; // Adjust this value to control speed
    
            // Reverse direction if the gradient reaches either end
            if (gradientPosition >= visibleCanvasWidth * 2) {
                gradientDirection = -1;  // Change direction to left
            } else if (gradientPosition <= 0) {
                gradientDirection = 1;   // Change direction to right
            }
            drawToPixelatedCanvas()

        }, 30);  // Adjust the speed of the animation
    }
    
    function stopGradient() {
        if (gradientInterval) {
            clearInterval(gradientInterval);
            gradientInterval = null;
        }
    }

    return {
        startGradient,
        stopGradient
    };
}

export function handleRadialGradientAnimation(canvas, ctx) {
    let gradient = null;
    let gradientInterval;

    function startRadialGradient(minSpeed = 2, maxSpeed = 6) {
        // Initialize the gradient object
        gradient = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 0, // Start from radius 0
            maxRadius: Math.random() * (canvas.width)+ 300, // Random max radius
            speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
            expanding: true,
        };

        gradientInterval = setInterval(function() {
            // Clear the canvas and fill it with black
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update the gradient radius
            if (gradient.expanding) {
                gradient.radius += gradient.speed;
                if (gradient.radius >= gradient.maxRadius) {
                    gradient.radius = gradient.maxRadius;
                    gradient.expanding = false; // Start contracting
                }
            } else {
                gradient.radius -= gradient.speed;
                if (gradient.radius <= 0) {
                    gradient.radius = 0; // Ensure radius doesn't go negative
                    gradient.expanding = true; // Start expanding again
                    // Optionally reset position, maxRadius, and speed
                    gradient.x = Math.random() * canvas.width;
                    gradient.y = Math.random() * canvas.height;
                    gradient.maxRadius = Math.random() * (canvas.width / 2) + 50;
                    gradient.speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
                }
            }

            // Draw the gradient if radius is greater than zero
            if (gradient.radius > 0) {
                // Create a radial gradient
                const radialGradient = ctx.createRadialGradient(
                    gradient.x, gradient.y, 0,
                    gradient.x, gradient.y, gradient.radius
                );
                radialGradient.addColorStop(0, 'white'); // Center color
                radialGradient.addColorStop(1, 'transparent'); // Fade to transparent

                ctx.fillStyle = radialGradient;
                ctx.beginPath();
                ctx.arc(gradient.x, gradient.y, gradient.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            drawToPixelatedCanvas()

        }, 30); // Adjust the interval as needed
    }

    function stopRadialGradient() {
        if (gradientInterval) {
            clearInterval(gradientInterval);
            gradientInterval = null;
        }
    }

    return {
        startRadialGradient,
        stopRadialGradient
    };
}

export function handleRadialFadeAnimation (canvas, ctx) {
    let gradient = null;
    let animationFrameId;
    let phase = 'expanding'; // Possible phases: 'expanding', 'contracting', 'fadeToWhite', 'fadeToBlack'
    let backgroundColor = { r: 0, g: 0, b: 0 }; // Starts with black background
    let backgroundTargetColor = { r: 255, g: 255, b: 255 }; // White color
    let backgroundFadeStep = 0;
    let isWhiteBackground = false; // Tracks the current background color state

    function startRadialFade(minSpeed = 2, maxSpeed = 6, fadeDuration = 2000) {
        // Initialize the gradient object
        gradient = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 0, // Start from radius 0
            maxRadius: Math.random() * (canvas.width) + 300, // Random max radius
            speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
            expanding: true,
        };

        backgroundFadeStep = 1 / (fadeDuration / 16.67); // Approximate fade steps based on 60 FPS

        function animate() {
                        drawToPixelatedCanvas()

            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Fill the background with the current background color
            ctx.fillStyle = `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Handle different phases of the animation
            if (phase === 'expanding' || phase === 'contracting') {
                // Update the gradient radius
                if (gradient.expanding) {
                    gradient.radius += gradient.speed;
                    if (gradient.radius >= gradient.maxRadius) {
                        gradient.radius = gradient.maxRadius;
                        gradient.expanding = false; // Start contracting
                        phase = 'contracting';
                    }
                } else {
                    gradient.radius -= gradient.speed;
                    if (gradient.radius <= 0) {
                        gradient.radius = 0; // Ensure radius doesn't go negative
                        // Decide the next phase based on the current background
                        if (isWhiteBackground) {
                            phase = 'fadeToBlack';
                            backgroundTargetColor = { r: 0, g: 0, b: 0 };
                        } else {
                            phase = 'fadeToWhite';
                            backgroundTargetColor = { r: 255, g: 255, b: 255 };
                        }
                    }
                }

                // Draw the gradient if radius is greater than zero
                if (gradient.radius > 0) {
                    // Create a radial gradient
                    const radialGradient = ctx.createRadialGradient(
                        gradient.x, gradient.y, 0,
                        gradient.x, gradient.y, gradient.radius
                    );

                    if (isWhiteBackground) {
                        // Black gradient over white background
                        radialGradient.addColorStop(0, 'black'); // Center color
                        radialGradient.addColorStop(1, 'transparent'); // Fade to transparent
                    } else {
                        // White gradient over black background
                        radialGradient.addColorStop(0, 'white'); // Center color
                        radialGradient.addColorStop(1, 'transparent'); // Fade to transparent
                    }

                    ctx.fillStyle = radialGradient;
                    ctx.beginPath();
                    ctx.arc(gradient.x, gradient.y, gradient.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (phase === 'fadeToWhite' || phase === 'fadeToBlack') {
                // Fade the background color
                let colorChanged = false;

                ['r', 'g', 'b'].forEach((channel) => {
                    if (backgroundColor[channel] < backgroundTargetColor[channel]) {
                        backgroundColor[channel] += backgroundFadeStep * 255;
                        if (backgroundColor[channel] > backgroundTargetColor[channel]) {
                            backgroundColor[channel] = backgroundTargetColor[channel];
                        }
                        colorChanged = true;
                    } else if (backgroundColor[channel] > backgroundTargetColor[channel]) {
                        backgroundColor[channel] -= backgroundFadeStep * 255;
                        if (backgroundColor[channel] < backgroundTargetColor[channel]) {
                            backgroundColor[channel] = backgroundTargetColor[channel];
                        }
                        colorChanged = true;
                    }
                });

                // Ensure color values stay within 0-255
                backgroundColor.r = Math.min(255, Math.max(0, backgroundColor.r));
                backgroundColor.g = Math.min(255, Math.max(0, backgroundColor.g));
                backgroundColor.b = Math.min(255, Math.max(0, backgroundColor.b));

                if (!colorChanged) {
                    // Fade is complete
                    if (phase === 'fadeToWhite') {
                        isWhiteBackground = true;
                    } else {
                        isWhiteBackground = false;
                    }

                    // Reset gradient properties for the next cycle
                    gradient = {
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        radius: 0,
                        maxRadius: Math.random() * (canvas.width / 2) + 50,
                        speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
                        expanding: true,
                    };
                    phase = 'expanding';
                }
            }

            // Request the next frame
            animationFrameId = requestAnimationFrame(animate);
        }

        // Start the animation loop
        animate();
    }

    function stopRadialFade() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    return {
        startRadialFade ,
        stopRadialFade,
    };
}
