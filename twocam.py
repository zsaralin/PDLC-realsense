import pyrealsense2 as rs
import numpy as np
import cv2
import subprocess  # Import subprocess to launch the app
from flask_cors import CORS
from flask import request, jsonify, Flask, Response

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Initialize variables for camera pipelines
pipeline0 = None
pipeline1 = None

try:
    pipeline0 = rs.pipeline()
    config0 = rs.config()
    config0.enable_device('213622252175')#'207322250086')  # Camera 0 serial number
    config0.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)
    config0.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)  # Enable depth stream
    pipeline_profile0 = pipeline0.start(config0)

    # Get the depth scale for Camera 0
    depth_sensor = pipeline_profile0.get_device().first_depth_sensor()
    depth_scale = depth_sensor.get_depth_scale()
    print(f"Depth Scale for Camera 0: {depth_scale}")

    print("Camera 0 started successfully.")
except Exception as e:
    print("Camera 0 not available:", e)

# Attempt to start Camera 1
try:
    pipeline1 = rs.pipeline()
    config1 = rs.config()
    config1.enable_device('213622253034')  # Camera 1 serial number
    config1.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)
    config1.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)  # Enable depth stream
    pipeline_profile1 = pipeline1.start(config1)

    # Get the depth scale for Camera 1
    depth_sensor = pipeline_profile1.get_device().first_depth_sensor()
    depth_scale = depth_sensor.get_depth_scale()
    print(f"Depth Scale for Camera 1: {depth_scale}")

    print("Camera 1 started successfully.")
except Exception as e:
    print("Camera 1 not available:", e)

# Launch the external app right after attempting to start the cameras
try:
    subprocess.Popen(
        r"C:\\Users\\antim\\OneDrive\\Desktop\\pdlc-realsense\\PDLC-realsense\\dist\win-unpacked\\pdlc.exe"
    )
    print("App launched successfully.")
except Exception as e:
    print("Failed to launch the app:", e)

# Default min/max depth thresholds
min_depth_threshold_0 = 0  # Default minimum depth (meters)
max_depth_threshold_0 = 6  # Default maximum depth (meters)
min_depth_threshold_1 = 0  # Default minimum depth (meters)
max_depth_threshold_1 = 6  # Default maximum depth (meters)

# Function to generate frames from Camera 0 with optional depth filtering
def gen_frames_camera0():
    if not pipeline0:
        return  # If the pipeline is not initialized, do not attempt to stream
    while True:
        try:
            frames = pipeline0.wait_for_frames()
            color_frame = frames.get_color_frame()
            depth_frame = frames.get_depth_frame()

            if not color_frame or not depth_frame:
                continue

            # Convert to numpy arrays
            color_image = np.asanyarray(color_frame.get_data())
            depth_image = np.asanyarray(depth_frame.get_data())

            # Convert depth data to meters by multiplying by depth scale
            depth_image_meters = depth_image * depth_scale

            # Only apply masking if depth thresholds are not default (0 to 6 meters)
            if min_depth_threshold_0 != 0 or max_depth_threshold_0 != 6:
                # Create a mask for pixels that are either too close or too far
                mask = (depth_image_meters < min_depth_threshold_0) | (depth_image_meters > max_depth_threshold_0)

                # Apply the mask to the color image: set all pixels outside the valid depth range to white
                color_image[mask] = [255, 255, 255]

            # Encode the color image
            ret, buffer = cv2.imencode('.jpg', color_image)
            frame = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        except Exception as e:
            print("Error in Camera 0 stream:", e)
            break

# Function to generate frames from Camera 1 with optional depth filtering
def gen_frames_camera1():
    if not pipeline1:
        return  # If the pipeline is not initialized, do not attempt to stream
    while True:
        try:
            frames = pipeline1.wait_for_frames()
            color_frame = frames.get_color_frame()
            depth_frame = frames.get_depth_frame()

            if not color_frame or not depth_frame:
                continue

            # Convert to numpy arrays
            color_image = np.asanyarray(color_frame.get_data())
            depth_image = np.asanyarray(depth_frame.get_data())

            # Convert depth data to meters by multiplying by depth scale
            depth_image_meters = depth_image * depth_scale

            # Only apply masking if depth thresholds are not default (0 to 6 meters)
            if min_depth_threshold_1 != 0 or max_depth_threshold_1 != 6:
                # Create a mask for pixels that are either too close or too far
                mask = (depth_image_meters < min_depth_threshold_1) | (depth_image_meters > max_depth_threshold_1)

                # Apply the mask to the color image: set all pixels outside the valid depth range to white
                color_image[mask] = [255, 255, 255]

            # Encode the color image
            ret, buffer = cv2.imencode('.jpg', color_image)
            frame = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        except Exception as e:
            print("Error in Camera 1 stream:", e)
            break

# Flask route to stream video from Camera 0
@app.route('/video_feed_0')
def video_feed_0():
    if pipeline0:
        return Response(gen_frames_camera0(), mimetype='multipart/x-mixed-replace; boundary=frame')
    else:
        return Response("Camera 0 not available", status=404)

# Flask route to stream video from Camera 1
@app.route('/video_feed_1')
def video_feed_1():
    if pipeline1:
        return Response(gen_frames_camera1(), mimetype='multipart/x-mixed-replace; boundary=frame')
    else:
        return Response("Camera 1 not available", status=404)

# Function to update minZ from the frontend
@app.route('/update_minZ0', methods=['POST'])
def update_minZ0():
    global min_depth_threshold_0
    data = request.json
    new_minZ = data.get('minZ0', None)  # Get the minZ value from the request body
    if new_minZ is not None and isinstance(new_minZ, (float, int)):
        min_depth_threshold_0 = float(new_minZ)  # Update the global minZ value
        return jsonify({"message": f"minZ0 updated to {min_depth_threshold_0}"}), 200
    return jsonify({"error": "Invalid minZ value"}), 400

# Function to update maxZ from the frontend
@app.route('/update_maxZ0', methods=['POST'])
def update_maxZ0():
    global max_depth_threshold_0
    data = request.json
    new_maxZ = data.get('maxZ0', None)  # Get the maxZ value from the request body
    if new_maxZ is not None and isinstance(new_maxZ, (float, int)):
        max_depth_threshold_0 = float(new_maxZ)  # Update the global maxZ value
        return jsonify({"message": f"maxZ0 updated to {max_depth_threshold_0}"}), 200
    return jsonify({"error": "Invalid maxZ value"}), 400

@app.route('/update_minZ1', methods=['POST'])
def update_minZ1():
    global min_depth_threshold_1

    data = request.json
    new_minZ = data.get('minZ1', None)  # Get the minZ value from the request body
    if new_minZ is not None and isinstance(new_minZ, (float, int)):
        min_depth_threshold_1 = float(new_minZ)  # Update the global minZ value
        return jsonify({"message": f"minZ0 updated to {min_depth_threshold_1}"}), 200
    return jsonify({"error": "Invalid minZ value"}), 400

# Function to update maxZ from the frontend
@app.route('/update_maxZ1', methods=['POST'])
def update_maxZ1():
    global max_depth_threshold_1
    data = request.json
    new_maxZ = data.get('maxZ1', None)  # Get the maxZ value from the request body
    if new_maxZ is not None and isinstance(new_maxZ, (float, int)):
        max_depth_threshold_1 = float(new_maxZ)  # Update the global maxZ value
        return jsonify({"message": f"maxZ0 updated to {max_depth_threshold_1}"}), 200
    return jsonify({"error": "Invalid maxZ value"}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
