import pyrealsense2 as rs
import numpy as np
import cv2
from flask import Flask, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS to prevent security issues

# Initialize variables for camera pipelines
pipeline0 = None
pipeline1 = None

# Attempt to start Camera 0
try:
    pipeline0 = rs.pipeline()
    config0 = rs.config()
    config0.enable_device('213622253034')  # Camera 0 serial number
    # Set resolution to 1280x800 @ 30 FPS for Camera 0
    config0.enable_stream(rs.stream.color, 1280, 800, rs.format.bgr8, 30)
    config0.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)  # Enable depth stream

    pipeline0.start(config0)
    print("Camera 0 started successfully.")
except Exception as e:
    print("Camera 0 not available:", e)

# Attempt to start Camera 1
try:
    pipeline1 = rs.pipeline()
    config1 = rs.config()
    config1.enable_device('213622252175')  # Camera 1 serial number
    # Set resolution to 1280x800 @ 30 FPS for Camera 1
    config1.enable_stream(rs.stream.color, 1280, 800, rs.format.bgr8, 30)
    config1.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)  # Enable depth stream

    pipeline1.start(config1)
    print("Camera 1 started successfully.")
except Exception as e:
    print("Camera 1 not available:", e)

# Function to generate frames from Camera 0
def gen_frames_camera0():
    if not pipeline0:
        return  # If the pipeline is not initialized, do not attempt to stream
    while True:
        try:
            frames = pipeline0.wait_for_frames()
            color_frame = frames.get_color_frame()
            if not color_frame:
                continue
            color_image = np.asanyarray(color_frame.get_data())
            ret, buffer = cv2.imencode('.jpg', color_image)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        except Exception as e:
            print("Error in Camera 0 stream:", e)
            break

# Function to generate frames from Camera 1
def gen_frames_camera1():
    if not pipeline1:
        return  # If the pipeline is not initialized, do not attempt to stream
    while True:
        try:
            frames = pipeline1.wait_for_frames()
            color_frame = frames.get_color_frame()
            if not color_frame:
                continue
            color_image = np.asanyarray(color_frame.get_data())
            ret, buffer = cv2.imencode('.jpg', color_image)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        except Exception as e:
            print("Error in Camera 1 stream:", e)
            break

def get_depth_at_pixel(pipeline, x, y):
    try:
        frames = pipeline.wait_for_frames()
        depth_frame = frames.get_depth_frame()  # Get the depth frame
        if not depth_frame:
            return None

        # Get depth at the specified x, y coordinate (x and y should be integers)
        depth = depth_frame.get_distance(x, y)
        return depth  # Return depth in meters
    except Exception as e:
        print("Error getting depth information:", e)
        return None

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
    
# Flask route to get depth at a pixel from Camera 0
@app.route('/get_depth_0/<int:x>/<int:y>')
def get_depth_0(x, y):
    if pipeline0:
        depth = get_depth_at_pixel(pipeline0, x, y)
        if depth is not None:
            return {"depth": depth}, 200
        else:
            return {"error": "Could not retrieve depth information. Invalid coordinates or depth frame not available."}, 400
    else:
        return {"error": "Camera 0 not available"}, 404

# Flask route to get depth at a pixel from Camera 1
@app.route('/get_depth_1/<int:x>/<int:y>')
def get_depth_1(x, y):
    if pipeline1:
        depth = get_depth_at_pixel(pipeline1, x, y)
        if depth is not None:
            return {"depth": depth}
        else:
            return {"error": "Could not retrieve depth information"}, 400
    else:
        return {"error": "Camera 1 not available"}, 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)