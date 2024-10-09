@echo off
cd "C:\Users\antim\OneDrive\Desktop\pdlc-realsense\PDLC-realsense\backend"

:: Run the Node.js server in a new window and continue the script
start "" node server.js

cd "C:\Users\antim\OneDrive\Desktop\pdlc-realsense\PDLC-realsense"

:: Run Python script
python twocam.py
