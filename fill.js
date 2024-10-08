import { handleFadeAnimation, handleGradientAnimation, handleRadialGradientAnimation, handleRadialFadeAnimation, handlePixelMovement , handleHorizontalBarMovement, handleVerticalBarMovement } from './dmxTests.js'; // Import fade animation module
import { drawToPixelatedCanvas } from './pixelatedCanvas.js';
import { startDMXAnimationLoop, stopDMXAnimationLoop } from './sendDMXOld.js';
document.addEventListener('DOMContentLoaded', function() {
    const poseCheckbox = document.getElementById('poseCheckbox');
    const videoCheckbox = document.getElementById('videoCheckbox');
    const domesticCheckbox = document.getElementById('domesticCheckbox');
    const whiteCheckbox = document.getElementById('whiteCheckbox');
    const blackCheckbox = document.getElementById('blackCheckbox');
    const greyCheckbox = document.getElementById('greyCheckbox');
    const greySlider = document.getElementById('greySlider');
    const greyValueDisplay = document.getElementById('greySliderValue');
    const fadeAnimCheckbox = document.getElementById('fadeAnimCheckbox');
    const gradientAnimCheckbox = document.getElementById('gradientAnimCheckbox');
    const radialAnimCheckbox = document.getElementById('radialAnimCheckbox');
    const radialFadeAnimCheckbox = document.getElementById('radialFadeAnimCheckbox');
    const startChaseCheckbox = document.getElementById('startChase'); // Add your startChase checkbox
    const verticalBarCheckbox = document.getElementById('verticalBarCheckbox')
    const horizontalBarCheckbox = document.getElementById('horizontalBarCheckbox')
    const pixelMoverCheckbox = document.getElementById('pixelMoverCheckbox')

    const canvas = document.getElementById('whiteCanvas')
    const ctx = canvas.getContext('2d')
    // Add your control functions
    const radialGradientControl = handleRadialGradientAnimation(canvas, ctx);
    const radialFadeControl = handleRadialFadeAnimation(canvas, ctx);
    const fadeControl = handleFadeAnimation(canvas, ctx);
    const gradientControl = handleGradientAnimation(canvas, ctx);
    let video;
    let stopBarMovement; 
    let stopPixelMovement; 

    let videoInterval;

    // Function to make API requests to the server
    async function callServer(endpoint) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            console.log(`${endpoint} response:`, data);
        } catch (error) {
            console.error(`Error calling ${endpoint}:`, error);
        }
    }

    // Listen to the 'startChase' checkbox changes
    startChaseCheckbox.addEventListener('change', function() {
        if (this.checked) {
            domesticCheckbox.checked = false;
            whiteCheckbox.checked = false; 
            videoCheckbox.checked = false;
            blackCheckbox.checked = false;
            greyCheckbox.checked = false; // Uncheck grey checkbox
            gradientAnimCheckbox.checked = false; // Uncheck gradient checkbox
            radialAnimCheckbox.checked = false; // Uncheck radial checkbox
            radialFadeAnimCheckbox.checked = false; // Uncheck radial fade checkbox
            gradientControl.stopGradient(); // Stop gradient animation
            radialGradientControl.stopRadialGradient(); // Stop radial animation
            radialFadeControl.stopRadialFade(); // Stop radial fade animation
            poseCheckbox.checked = false; 
            stopDMXAnimationLoop()
            // Call the start DMX animation endpoint when checked
            callServer('http://localhost:3000/start-dmx-animation');
        } else {
            // Call the stop DMX animation endpoint when unchecked
            callServer('http://localhost:3000/stop-dmx-animation');
            startDMXAnimationLoop()
        }
    });


// Function to play the video on the canvas
function playVideoOnCanvas() {
    // Clear the interval if one is running
    if (videoInterval) {
        clearInterval(videoInterval);
    }

    // Ensure the video is ready before starting to draw
    video.addEventListener('play', () => {
        videoInterval = setInterval(() => {
            if (!video.paused && !video.ended) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height); // Draw the video frame on the canvas
                drawToPixelatedCanvas()
            }
        }, 1000 / 60); // 60 FPS
    });

    video.play();
}

// Function to handle which video checkbox in the group is checked and play the corresponding video
function handleVideoCheckboxGroupChange() {
    const videoCheckboxes = [
        document.getElementById('videoCheckbox0'),
        document.getElementById('videoCheckbox1'),
        document.getElementById('videoCheckbox2'),
        document.getElementById('videoCheckbox3'),
        document.getElementById('videoCheckbox4')
    ];

    // Find the checked checkbox
    const checkedIndex = videoCheckboxes.findIndex(cb => cb.checked);

    // If a checkbox is checked, play the corresponding video
    if (checkedIndex !== -1) {
        const videoSrc = `td_videos/${checkedIndex}.mp4`; // Load the corresponding video file

        // Create a video element or update the existing one
        if (!video) {
            video = document.createElement('video');
            video.loop = true; // Loop the video
        }

        // Update the video source
        video.src = videoSrc;

        // Play the video on the canvas
        playVideoOnCanvas();
    }
}

// Function to clear the video and canvas when the video stops or checkbox is unchecked
function clearVideo() {
    if (video) {
        video.pause();
    }
    if (videoInterval) {
        clearInterval(videoInterval);
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
}

// Function to add event listeners to the video group checkboxes
function addVideoGroupListeners() {
    
    document.querySelectorAll('.video-group').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            
            if (this.checked) {
                // Uncheck other checkboxes in the group
                document.querySelectorAll('.video-group').forEach(cb => {
                    if (cb !== this) {
                        cb.checked = false;
                    }
                });
                // Clear the canvas and stop any previous video
                clearVideo();

                // Handle the video change
                handleVideoCheckboxGroupChange();
            }
        });
    });
}


// Add listeners for the sub-checkboxes when the DOM is ready
addVideoGroupListeners()

    // Set initial canvas size
    function setCanvasSize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    // Call setCanvasSize initially and on window resize
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Function to fill the canvas
    function fillCanvas(color) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    poseCheckbox.addEventListener('change', function() {
        if (this.checked) {
            domesticCheckbox.checked = false;
            whiteCheckbox.checked = false; 
            blackCheckbox.checked = false;
            greyCheckbox.checked = false; // Uncheck grey checkbox
            gradientAnimCheckbox.checked = false; // Uncheck gradient checkbox
            radialAnimCheckbox.checked = false; // Uncheck radial checkbox
            radialFadeAnimCheckbox.checked = false; // Uncheck radial fade checkbox
            gradientControl.stopGradient(); // Stop gradient animation
            radialGradientControl.stopRadialGradient(); // Stop radial animation
            radialFadeControl.stopRadialFade(); // Stop radial fade animation
            startChaseCheckbox.checked = false; 
            
        } else if (!blackCheckbox.checked && !greyCheckbox.checked) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });
    domesticCheckbox.addEventListener('change', function() {
        if (this.checked) {
            poseCheckbox.checked = false;
            whiteCheckbox.checked = false; 
            blackCheckbox.checked = false;
            greyCheckbox.checked = false; // Uncheck grey checkbox
            gradientAnimCheckbox.checked = false; // Uncheck gradient checkbox
            radialAnimCheckbox.checked = false; // Uncheck radial checkbox
            radialFadeAnimCheckbox.checked = false; // Uncheck radial fade checkbox
            gradientControl.stopGradient(); // Stop gradient animation
            radialGradientControl.stopRadialGradient(); // Stop radial animation
            radialFadeControl.stopRadialFade(); // Stop radial fade animation
        } else if (!blackCheckbox.checked && !greyCheckbox.checked) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });
   
    // Event listeners for checkboxes
    whiteCheckbox.addEventListener('change', function() {
        if (this.checked) {
            fillCanvas('white');
            drawToPixelatedCanvas(1)
            domesticCheckbox.checked = false;

            blackCheckbox.checked = false;

            greyCheckbox.checked = false; // Uncheck grey checkbox
            gradientAnimCheckbox.checked = false; // Uncheck gradient checkbox
            radialAnimCheckbox.checked = false; // Uncheck radial checkbox
            radialFadeAnimCheckbox.checked = false; // Uncheck radial fade checkbox
            gradientControl.stopGradient(); // Stop gradient animation
            radialGradientControl.stopRadialGradient(); // Stop radial animation
            radialFadeControl.stopRadialFade(); // Stop radial fade animation
            poseCheckbox.checked = false; 

        } else if (!blackCheckbox.checked && !greyCheckbox.checked) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });

    blackCheckbox.addEventListener('change', function() {
        if (this.checked) {
            fillCanvas('black');
            drawToPixelatedCanvas(1)
            domesticCheckbox.checked = false;

            whiteCheckbox.checked = false;

            greyCheckbox.checked = false; // Uncheck grey checkbox
            gradientAnimCheckbox.checked = false; // Uncheck gradient checkbox
            radialAnimCheckbox.checked = false; // Uncheck radial checkbox
            radialFadeAnimCheckbox.checked = false; // Uncheck radial fade checkbox
            gradientControl.stopGradient(); // Stop gradient animation
            radialGradientControl.stopRadialGradient(); // Stop radial animation
            radialFadeControl.stopRadialFade(); // Stop radial fade animation
            poseCheckbox.checked = false; 

        } else if (!whiteCheckbox.checked && !greyCheckbox.checked) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });

    greyCheckbox.addEventListener('change', function() {
        if (this.checked) {
            const greyShade = greySlider.value; // Get the current slider value
            fillCanvas(`rgb(${greyShade}, ${greyShade}, ${greyShade})`); // Fill canvas with selected grey shade
            drawToPixelatedCanvas(1)
            domesticCheckbox.checked = false;

            whiteCheckbox.checked = false; // Uncheck white checkbox

            blackCheckbox.checked = false; // Uncheck black checkbox
            gradientAnimCheckbox.checked = false; // Uncheck gradient checkbox
            radialAnimCheckbox.checked = false; // Uncheck radial checkbox
            radialFadeAnimCheckbox.checked = false; // Uncheck radial fade checkbox
            gradientControl.stopGradient(); // Stop gradient animation
            radialGradientControl.stopRadialGradient(); // Stop radial animation
            radialFadeControl.stopRadialFade(); // Stop radial fade animation
            poseCheckbox.checked = false; 

        } else if (!whiteCheckbox.checked && !blackCheckbox.checked) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });

    greySlider.addEventListener('input', function() {
        const greyShade = this.value;
        greyValueDisplay.textContent = greyShade;
        if (greyCheckbox.checked) {
            fillCanvas(`rgb(${greyShade}, ${greyShade}, ${greyShade})`);
            drawToPixelatedCanvas(1)

        }
    });

    // Event listener for fadeAnimCheckbox
    fadeAnimCheckbox.addEventListener('change', function() {
        if (this.checked) {
            fadeControl.startFade();
            domesticCheckbox.checked = false;

            whiteCheckbox.checked = false; // Uncheck white checkbox
            blackCheckbox.checked = false; // Uncheck black checkbox
            greyCheckbox.checked = false; // Uncheck grey checkbox
            gradientAnimCheckbox.checked = false; // Uncheck gradient checkbox
            radialAnimCheckbox.checked = false; // Uncheck radial checkbox
            radialFadeAnimCheckbox.checked = false; // Uncheck radial fade checkbox
            poseCheckbox.checked = false; 

            gradientControl.stopGradient(); // Stop gradient animation
            radialFadeControl.stopRadialFade(); // Stop the radial fade animation

            radialGradientControl.stopRadialGradient(); // Stop radial animation
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas when fade animation starts
        } else {
            fadeControl.stopFade();
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas when fade animation stops
        }
    });

    // Linear gradient animation checkbox event listener
    gradientAnimCheckbox.addEventListener('change', function() {
        if (this.checked) {
            gradientControl.startGradient();
            domesticCheckbox.checked = false;

            whiteCheckbox.checked = false; // Uncheck white checkbox
            blackCheckbox.checked = false; // Uncheck black checkbox
            greyCheckbox.checked = false; // Uncheck grey checkbox
            radialAnimCheckbox.checked = false; // Uncheck radial checkbox
            radialFadeAnimCheckbox.checked = false; // Uncheck radial fade checkbox
            fadeAnimCheckbox.checked = false; // Uncheck fade animation checkbox
            poseCheckbox.checked = false; 
            radialFadeControl.stopRadialFade(); // Stop the radial fade animation
            radialGradientControl.stopRadialGradient();

            fadeControl.stopFade(); // Stop fade animation
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas when gradient animation starts
        } else {
            gradientControl.stopGradient();
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas when gradient animation stops
        }
    });

    // Radial gradient animation checkbox event listener
    radialAnimCheckbox.addEventListener('change', function() {
        if (this.checked) {
            domesticCheckbox.checked = false;

            radialGradientControl.startRadialGradient();
            whiteCheckbox.checked = false; // Uncheck white checkbox
            blackCheckbox.checked = false; // Uncheck black checkbox
            greyCheckbox.checked = false; // Uncheck grey checkbox
            fadeAnimCheckbox.checked = false; // Uncheck fade animation checkbox
            gradientAnimCheckbox.checked = false; // Uncheck gradient checkbox
            poseCheckbox.checked = false; 
            fadeControl.stopFade(); // Stop fade animation

            radialFadeAnimCheckbox.checked = false; // Uncheck radial fade checkbox
            gradientControl.stopGradient(); // Stop gradient animation
            radialFadeControl.stopRadialFade(); // Stop radial fade animation
            
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas when radial animation starts
        } else {
            radialGradientControl.stopRadialGradient();
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas when radial animation stops
        }
    });

    // Radial fade animation checkbox event listener
    radialFadeAnimCheckbox.addEventListener('change', function() {
        if (this.checked) {
            domesticCheckbox.checked = false;

            radialFadeControl.startRadialFade(); // Start the radial fade animation
            whiteCheckbox.checked = false; // Uncheck white checkbox
            blackCheckbox.checked = false; // Uncheck black checkbox
            greyCheckbox.checked = false; // Uncheck grey checkbox
            fadeAnimCheckbox.checked = false; // Uncheck fade animation checkbox
            gradientAnimCheckbox.checked = false; // Uncheck gradient checkbox
            poseCheckbox.checked = false; 

            radialAnimCheckbox.checked = false; // Uncheck radial checkbox
            fadeControl.stopFade(); // Stop fade animation

            gradientControl.stopGradient(); // Stop gradient animation
            radialGradientControl.stopRadialGradient(); // Stop radial animation
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas when radial fade animation starts
        } else {
            radialFadeControl.stopRadialFade(); // Stop the radial fade animation
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas when radial fade animation stops
        }
    });
    verticalBarCheckbox.addEventListener('change', function() {
        if (this.checked) {
            horizontalBarCheckbox.checked = false; 
            pixelMoverCheckbox.checked = false;
            domesticCheckbox.checked = false;
            poseCheckbox.checked = false; 
            whiteCheckbox.checked = false; 
            blackCheckbox.checked = false;
            greyCheckbox.checked = false; // Uncheck grey checkbox
            gradientAnimCheckbox.checked = false; // Uncheck gradient checkbox
            radialAnimCheckbox.checked = false; // Uncheck radial checkbox
            radialFadeAnimCheckbox.checked = false; // Uncheck radial fade checkbox
            gradientControl.stopGradient(); // Stop gradient animation
            radialGradientControl.stopRadialGradient(); // Stop radial animation
            radialFadeControl.stopRadialFade(); // Stop radial fade animation
            if (stopPixelMovement) stopPixelMovement(); // Stop bar movement

            stopBarMovement = handleVerticalBarMovement(canvas, ctx); // Start bar movement and store the stop function

        } else{
            if (stopBarMovement) stopBarMovement(); // Stop bar movement
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

        }
    });
    horizontalBarCheckbox.addEventListener('change', function() {
        if (this.checked) {
            pixelMoverCheckbox.checked = false;
            verticalBarCheckbox.checked = false;

            domesticCheckbox.checked = false;
            poseCheckbox.checked = false; 
            whiteCheckbox.checked = false; 
            blackCheckbox.checked = false;
            greyCheckbox.checked = false; // Uncheck grey checkbox
            gradientAnimCheckbox.checked = false; // Uncheck gradient checkbox
            radialAnimCheckbox.checked = false; // Uncheck radial checkbox
            radialFadeAnimCheckbox.checked = false; // Uncheck radial fade checkbox
            gradientControl.stopGradient(); // Stop gradient animation
            radialGradientControl.stopRadialGradient(); // Stop radial animation
            radialFadeControl.stopRadialFade(); // Stop radial fade animation
            if (stopPixelMovement) stopPixelMovement(); // Stop bar movement

            stopBarMovement = handleHorizontalBarMovement(canvas, ctx); // Start bar movement and store the stop function

        } else{
            if (stopBarMovement) stopBarMovement(); // Stop bar movement
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

        }
    });

        pixelMoverCheckbox.addEventListener('change', function() {
            if (this.checked) {
                horizontalBarCheckbox.checked = false; 

                verticalBarCheckbox.checked = false;
                domesticCheckbox.checked = false;
                poseCheckbox.checked = false; 
                whiteCheckbox.checked = false; 
                blackCheckbox.checked = false;
                greyCheckbox.checked = false; // Uncheck grey checkbox
                gradientAnimCheckbox.checked = false; // Uncheck gradient checkbox
                radialAnimCheckbox.checked = false; // Uncheck radial checkbox
                radialFadeAnimCheckbox.checked = false; // Uncheck radial fade checkbox
                gradientControl.stopGradient(); // Stop gradient animation
                radialGradientControl.stopRadialGradient(); // Stop radial animation
                radialFadeControl.stopRadialFade(); // Stop radial fade animation
    
                stopPixelMovement = handlePixelMovement(canvas, ctx); // Start bar movement and store the stop function
    
            } else{
                if (stopPixelMovement) stopPixelMovement(); // Stop bar movement
    
            }
            
    });
    // Initial fill (optional)
    fillCanvas('white');
});