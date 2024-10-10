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

            // After updating the sliders, send minZ and maxZ to the backend
            updateDepthThresholds();
        })
        .catch(error => console.error('Error loading config:', error));
}

// Function to update minZ and maxZ sliders to the backend
function updateDepthThresholds() {
    const minZ0 = parseFloat(document.getElementById('minZ0Slider').value);
    const maxZ0 = parseFloat(document.getElementById('maxZ0Slider').value);
    const minZ1 = parseFloat(document.getElementById('minZ0Slider').value);
    const maxZ1 = parseFloat(document.getElementById('maxZ0Slider').value);

    // Send minZ to the backend
    fetch('http://localhost:5000/update_minZ0', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minZ0: minZ0 }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('minZ updated:', data);
    })
    .catch(error => {
        console.error('Error updating minZ:', error);
    });

    // Send maxZ to the backend
    fetch('http://localhost:5000/update_maxZ0', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maxZ0: maxZ0 }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('maxZ updated:', data);
    })
    .catch(error => {
        console.error('Error updating maxZ:', error);
    });

    // Send minZ to the backend
    fetch('http://localhost:5000/update_minZ1', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minZ1: minZ1 }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('minZ updated:', data);
    })
    .catch(error => {
        console.error('Error updating minZ:', error);
    });

    // Send maxZ to the backend
    fetch('http://localhost:5000/update_maxZ1', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maxZ1: maxZ1 }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('maxZ updated:', data);
    })
    .catch(error => {
        console.error('Error updating maxZ:', error);
    });
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

// Add event listeners to minZ and maxZ sliders to update backend on slider changes
function addDepthSliderListeners() {
    const minZ0Slider = document.getElementById('minZ0Slider');
    const maxZ0Slider = document.getElementById('maxZ0Slider');

    minZ0Slider.addEventListener('input', updateDepthThresholds);
    maxZ0Slider.addEventListener('input', updateDepthThresholds);

    const minZ1Slider = document.getElementById('minZ1Slider');
    const maxZ1Slider = document.getElementById('maxZ1Slider');

    minZ1Slider.addEventListener('input', updateDepthThresholds);
    maxZ1Slider.addEventListener('input', updateDepthThresholds);
}

// Setup sliders dynamically
function setupSliders() {
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        addSliderControls(slider); // Add controls for each slider
    });

    // Add event listeners for minZ and maxZ sliders
    addDepthSliderListeners();
}

// Initialize event listeners
function init() {
    loadConfig(); // Load initial config values

    // Setup sliders and their controls
    setupSliders();
    document.addEventListener('keydown', handleKeyPress);
    // Add event listener to save button
    document.getElementById('saveButton').addEventListener('click', saveConfig);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', init);


export function setSliderMax(sliderId, max) {
    const slider = document.getElementById(sliderId);
    if (slider) {
        slider.max = max;
    } else {
        console.error(`Slider with ID ${sliderId} not found.`);
    }
}

function handleKeyPress(event) {
    // List of all checkbox IDs
    const checkboxes = [
        'poseCheckbox', 'radialAnimCheckbox',
         'domesticCheckbox', 
        'whiteCheckbox', 'blackCheckbox', 'greyCheckbox', 
        'fadeAnimCheckbox', 'gradientAnimCheckbox', 'radialFadeAnimCheckbox'
    ];

    // Uncheck all checkboxes and dispatch 'change' event
    checkboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change')); // Manually trigger 'change' event
    });

    // Based on key, check the appropriate checkbox and dispatch 'change' event
    switch (event.key) {
        case '1':
            const poseCheckbox = document.getElementById('poseCheckbox');
            poseCheckbox.checked = true;
            poseCheckbox.dispatchEvent(new Event('change')); // Trigger 'change' event
            break;
        case '2':
            const radialAnimCheckbox = document.getElementById('radialFadeAnimCheckbox');
            radialAnimCheckbox.checked = true;
            radialAnimCheckbox.dispatchEvent(new Event('change')); // Trigger 'change' event
            break;
        case '3':
            const domesticCheckbox = document.getElementById('domesticCheckbox');
            domesticCheckbox.checked = true;
            domesticCheckbox.dispatchEvent(new Event('change')); // Trigger 'change' event
            break;
        default:
            break;
    }
}

var coll = document.getElementsByClassName("collapsible");
for (var i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
        }
    });
}