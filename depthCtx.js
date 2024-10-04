export async function getAverageDepthFromBackend(pose, canvasId) {
    // Map canvasId to 0 for 'canvas0_duplicate' and 1 for 'canvas1_duplicate'
    const cameraId = canvasId === 'canvas0_duplicate' ? 0 : (canvasId === 'canvas1_duplicate' ? 1 : null);

    if (cameraId === null) {
        console.error('Invalid canvasId');
        return 0; // Return 0 if canvasId is invalid
    }

    const keypoints = pose.keypoints
        .filter(keypoint => keypoint.score > 0.2) // Only include keypoints with good score
        .map(keypoint => ({ x: Math.round(keypoint.x), y: Math.round(keypoint.y) }));

    if (keypoints.length === 0) return 0; // If no valid keypoints, return 0

    try {
        // Use the mapped cameraId (0 or 1) in the fetch request
        const response = await fetch(`http://localhost:5000/get_avg_depth_${cameraId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ points: keypoints }),
        });

        const data = await response.json();
        console.log(data.avg_depth)
        return data.avg_depth || 0;  // Return the average depth
    } catch (error) {
        console.error('Error fetching depth:', error);
        return 0;
    }
}
// Function to filter poses based on depth thresholds
export async function depthFilterPosesFromBackend(poses, canvasId) {
    const minDepth = parseFloat(minZSlider.value); // Get slider values for min depth
    const maxDepth = parseFloat(maxZSlider.value); // Get slider values for max depth

    // Filter out poses based on depth
    const filteredPoses = [];

    for (let pose of poses) {
        const avgDepth = await getAverageDepthFromBackend(pose, canvasId);
        
        if (avgDepth >= minDepth && avgDepth <= maxDepth) {
            filteredPoses.push(pose); // Keep only poses with depth in range
        }
    }
    
    return filteredPoses;
}