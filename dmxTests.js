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
    let gradientDirection = 1; // 1 for moving right, -1 for moving left
    let animationFrameId;

    // Create an offscreen canvas to hold the 3x wide gradient
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = extendedCanvasWidth;
    offscreenCanvas.height = canvasHeight;

    // Function to draw the gradient on the offscreen canvas
    function drawGradient() {
        // Left third: fully white
        offscreenCtx.fillStyle = 'white';
        offscreenCtx.fillRect(0, 0, visibleCanvasWidth, canvasHeight);

        // Middle third: smooth gradient from white to black
        const gradient = offscreenCtx.createLinearGradient(visibleCanvasWidth, 0, visibleCanvasWidth * 2, 0);
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(0.5, 'gray'); // Add gray in the middle for smooth transition
        gradient.addColorStop(1, 'black');
        offscreenCtx.fillStyle = gradient;
        offscreenCtx.fillRect(visibleCanvasWidth, 0, visibleCanvasWidth, canvasHeight);

        // Right third: fully black
        offscreenCtx.fillStyle = 'black';
        offscreenCtx.fillRect(visibleCanvasWidth * 2, 0, visibleCanvasWidth, canvasHeight);
    }

    function animateGradient() {
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

        // Redraw the pixelated canvas (if necessary)
        drawToPixelatedCanvas();

        // Request the next frame
        animationFrameId = requestAnimationFrame(animateGradient);
    }

    function startGradient() {
        drawGradient();  // Draw the gradient onto the offscreen canvas
        if (!animationFrameId) {
            animateGradient(); // Start the animation loop
        }
    }

    function stopGradient() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId); // Stop the animation loop
            animationFrameId = null;
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

    function startRadialGradient(minSpeed = 1, maxSpeed = 5) {
        // Initialize the gradient object
        gradient = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 0, // Start from radius 0
            maxRadius: Math.floor(Math.random() * (500 - 200 + 1)) + 200,
            speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
            expanding: true,
        };

        gradientInterval = setInterval(function () {
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
                    gradient.maxRadius = Math.floor(Math.random() * (500 - 200 + 1)) + 200;
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

            drawToPixelatedCanvas();

        }, 30); // Adjust the interval as needed (currently set to 30ms)
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

export function handleRadialFadeAnimation(canvas, ctx) {
    let gradient = null;
    let intervalId;
    let phase = 'expanding'; // Possible phases: 'expanding', 'contracting', 'fadeToWhite', 'fadeToBlack'
    let backgroundColor = { r: 0, g: 0, b: 0 }; // Starts with black background
    let backgroundTargetColor = { r: 255, g: 255, b: 255 }; // White color
    let backgroundFadeStep = 0;
    let isWhiteBackground = false; // Tracks the current background color state

    function startRadialFade(minSpeed = 1, maxSpeed = 5, fadeDuration = 2000) {
        // Initialize the gradient object
        gradient = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 0, // Start from radius 0
            maxRadius: Math.floor(Math.random() * (500 - 200 + 1)) + 200, // Random max radius
            speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
            expanding: true,
        };

        backgroundFadeStep = 1 / (fadeDuration / 30); // Approximate fade steps based on 60 FPS

        function animate() {
            drawToPixelatedCanvas();

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
                        maxRadius: Math.floor(Math.random() * (500 - 200 + 1)) + 200,
                        speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
                        expanding: true,
                    };
                    phase = 'expanding';
                }
            }
        }

        // Start the animation loop, running every 30ms
        intervalId = setInterval(animate, 30);
    }

    function stopRadialFade() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    return {
        startRadialFade,
        stopRadialFade,
    };
}
export function handleVerticalBarMovement(canvas, ctx) {
    let barX = 0; // Start the bar on the leftmost side
    const barWidth = 10; // Width of the vertical bar
    const barHeight = canvas.height; // Height of the vertical bar
    const barInfo = document.getElementById('pixelInfo'); // Grab the barInfo div

    // Draw the bar at its current position
    function drawBar() {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        ctx.fillStyle = 'black'; // Set the color of the bar
        ctx.fillRect(barX, 0, barWidth, barHeight); // Draw the bar

        // Calculate the current column based on barX
        const currentCol = Math.floor(barX / barWidth);

        // Update the barInfo div with the current column
        barInfo.innerHTML = `Col: ${currentCol}`;

        drawToPixelatedCanvas(1);
    }

    // Handle key presses to move the bar
    function handleKeyPress(event) {
        if (event.key === 'ArrowLeft') {
            barX -= 10; // Move the bar to the left
            if (barX < 0) barX = 0; // Prevent it from going off the left side
        } else if (event.key === 'ArrowRight') {
            barX += 10; // Move the bar to the right
            if (barX + barWidth > canvas.width) barX = canvas.width - barWidth; // Prevent it from going off the right side
        }
        drawBar(); // Redraw the bar in the new position
    }

    // Attach the keydown event listener
    window.addEventListener('keydown', handleKeyPress);

    // Initial draw of the bar
    drawBar();

    // Return a function to stop bar movement and remove event listeners
    return function stopBarMovement() {
        window.removeEventListener('keydown', handleKeyPress); // Remove the event listener
    };
}

export function handleHorizontalBarMovement(canvas, ctx) {
    let barY = 0; // Start the bar on the topmost side
    const barHeight = 10; // Height of the horizontal bar
    const barWidth = canvas.width; // Width of the horizontal bar
    const barInfo = document.getElementById('pixelInfo'); // Grab the barInfo div

    // Draw the bar at its current position
    function drawBar() {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        ctx.fillStyle = 'black'; // Set the color of the bar
        ctx.fillRect(0, barY, barWidth, barHeight); // Draw the horizontal bar

        // Calculate the current row based on barY
        const currentRow = Math.floor(barY / barHeight);

        // Update the barInfo div with the current row
        barInfo.innerHTML = `Row: ${currentRow}`;

        drawToPixelatedCanvas(1);
    }

    // Handle key presses to move the bar
    function handleKeyPress(event) {
        if (event.key === 'ArrowUp') {
            barY -= 10; // Move the bar upwards
            if (barY < 0) {
                // If the bar moves above the top, wrap to the bottom
                barY = canvas.height - barHeight;
            }
        } else if (event.key === 'ArrowDown') {
            barY += 10; // Move the bar downwards
            if (barY + barHeight > canvas.height) {
                // If the bar moves below the bottom, wrap to the top
                barY = 0;
            }
        }
        drawBar(); // Redraw the bar in the new position
    }

    // Attach the keydown event listener
    window.addEventListener('keydown', handleKeyPress);

    // Initial draw of the bar
    drawBar();

    // Return a function to stop bar movement and remove event listeners
    return function stopBarMovement() {
        window.removeEventListener('keydown', handleKeyPress); // Remove the event listener
    };
}

export function handlePixelMovement(canvas, ctx) {
    let pixelX = 0; // Start at the leftmost side
    let pixelY = 0; // Start at the topmost side
    const pixelSize = 10; // Width and height of the pixel (10x10)
    const pixelInfo = document.getElementById('pixelInfo'); // Grab the pixelInfo div

    // Draw the pixel at its current position
    function drawPixel(dmxChannel) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        ctx.fillStyle = 'black'; // Set the color of the pixel
        ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize); // Draw the pixel

        // Calculate the current column and row based on pixelX and pixelY
        const currentCol = Math.floor(pixelX / pixelSize);
        const currentRow = Math.floor(pixelY / pixelSize);

        // Update the pixelInfo div with the current column and row
        pixelInfo.innerHTML = `Col: ${currentCol}, Row: ${currentRow}, DMXChannel: ${dmxChannel}`;

        drawToPixelatedCanvas(1);
    }

    // Handle key presses to move the pixel
    function handleKeyPress(event) {
        if (event.key === 'ArrowLeft') {
            pixelX -= pixelSize; // Move the pixel to the left
            if (pixelX < 0) {
                pixelX = canvas.width - pixelSize; // Wrap to the last column of the previous row
                pixelY -= pixelSize;
                if (pixelY < 0) pixelY = 0; // Prevent going above the top row
            }
        } else if (event.key === 'ArrowRight') {
            pixelX += pixelSize; // Move the pixel to the right
            if (pixelX >= canvas.width) {
                pixelX = 0; // Wrap to the first column of the next row
                pixelY += pixelSize;
                if (pixelY >= canvas.height) pixelY = canvas.height - pixelSize; // Prevent going beyond the bottom row
            }
        } else if (event.key === 'ArrowUp') {
            pixelY -= pixelSize; // Move the pixel up
            if (pixelY < 0) {
                pixelY = 0; // Prevent going off the top
            }
        } else if (event.key === 'ArrowDown') {
            pixelY += pixelSize; // Move the pixel down
            if (pixelY >= canvas.height) {
                pixelY = canvas.height - pixelSize; // Prevent going off the bottom
            }
        }
            // Fetch DMX channel associated with current pixelX and pixelY
            fetch('http://localhost:3000/get-dmx-channel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ x: pixelX/10, y: pixelY/10 }) // Send the current x and y positions
            })
            .then(response => response.json())
            .then(data => {
                if (data.dmxChannel) {
                    // Pass the DMX channel to drawPixel function to redraw the pixel
                    drawPixel(data.dmxChannel);
                } else {
                    console.error('No DMX channel found for the current position');
                }
            })
            .catch(error => {
                console.error('Error fetching DMX channel:', error);
            });
        }

    // Attach the keydown event listener
    window.addEventListener('keydown', handleKeyPress);

    // Initial draw of the pixel
// Fetch DMX channel associated with current pixelX and pixelY
fetch('http://localhost:3000/get-dmx-channel', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ x: 0, y: 0 }) // Send the current x and y positions
})
.then(response => response.json())
.then(data => {
    if (data.dmxChannel) {
        // Pass the DMX channel to drawPixel function to redraw the pixel
        drawPixel(data.dmxChannel);
    } else {
        console.error('No DMX channel found for the current position');
    }
})
.catch(error => {
    console.error('Error fetching DMX channel:', error);
});
    // Return a function to stop pixel movement and remove event listeners
    return function stopPixelMovement() {
        console.log('STOPPIN ')
        window.removeEventListener('keydown', handleKeyPress); // Remove the event listener
    };
}
