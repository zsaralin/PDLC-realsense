// Fetch config.json and update sliders/checkboxes
function loadConfig() {
    fetch('config.json')
        .then(response => response.json())
        .then(config => {
            // Update checkboxes based on config
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = config[checkbox.id];
            });

            // Update range (slider) inputs based on config
            document.querySelectorAll('input[type="range"]').forEach(slider => {
                slider.value = config[slider.id];
                document.getElementById(slider.id + 'Value').textContent = slider.value; // Update displayed value
            });
        })
        .catch(error => console.error('Error loading config:', error));
}

// Save current values of sliders and checkboxes
function saveConfig() {
    const config = {};

    // Collect checkbox values
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        config[checkbox.id] = checkbox.checked;
    });

    // Collect slider (range) values
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        config[slider.id] = slider.value;
    });

    // Send the updated config to the server
    fetch('http://localhost:3000/save-config', { // Include the backend port 3000
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Config saved successfully:', data);
    })
    .catch(error => {
        console.error('Error saving config:', error);
    });
}

// Add slider controls for increasing and decreasing values dynamically
function addSliderControls(slider) {
    const valueDisplay = document.getElementById(slider.id + 'Value');
    const decreaseBtn = slider.previousElementSibling;
    const increaseBtn = slider.nextElementSibling;

    decreaseBtn.addEventListener('click', () => {
        slider.value = Math.max(slider.min, parseFloat(slider.value) - parseFloat(slider.step || 1));
        valueDisplay.textContent = slider.value;
    });

    increaseBtn.addEventListener('click', () => {
        slider.value = Math.min(slider.max, parseFloat(slider.value) + parseFloat(slider.step || 1));
        valueDisplay.textContent = slider.value;
    });

    slider.addEventListener('input', () => {
        valueDisplay.textContent = slider.value;
    });
}

// Setup sliders dynamically
function setupSliders() {
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        addSliderControls(slider); // Add controls for each slider
    });
}

// Initialize event listeners
function init() {
    loadConfig(); // Load initial config values

    // Setup sliders and their controls
    setupSliders();

    // Add event listener to save button
    document.getElementById('saveButton').addEventListener('click', saveConfig);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', init);
// Function to handle key presses and update checkboxes
function handleKeyPress(event) {
    switch (event.key) {
        case '1':
            document.getElementById('poseCheckbox').checked = true;  // Check Pose
            document.getElementById('radialAnimCheckbox').checked = false;  // Uncheck Radial Animation
            document.getElementById('videoCheckbox').checked = false;  // Uncheck Video
            break;
        case '2':
            document.getElementById('poseCheckbox').checked = false;  // Uncheck Pose
            document.getElementById('radialAnimCheckbox').checked = true;  // Check Radial Animation
            document.getElementById('videoCheckbox').checked = false;  // Uncheck Video
            break;
        case '3':
            document.getElementById('poseCheckbox').checked = false;  // Uncheck Pose
            document.getElementById('radialAnimCheckbox').checked = false;  // Uncheck Radial Animation
            document.getElementById('videoCheckbox').checked = true;  // Check Video
            break;
        default:
            break;
    }
}


// Add event listener for keydown events
document.addEventListener('keydown', handleKeyPress);

document.addEventListener('DOMContentLoaded', function() {
    const videoCheckboxes = document.querySelectorAll('.video-group');

    videoCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('click', function() {
            videoCheckboxes.forEach(cb => {
                if (cb !== checkbox) {
                    cb.checked = false; // Uncheck all other checkboxes in the group
                }
            });
        });
    });
});