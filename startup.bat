@echo off
cd "C:\Users\antim\OneDrive\Desktop\pdlc-realsense\PDLC-realsense"

:: Call python script
python twocam.py

:: Wait for 30 seconds
timeout /t 30 /nobreak

:: Move to backend folder and start Node.js server
cd backend
node server.js

:: Open the app
start "" "C:\Users\antim\OneDrive\Desktop\pdlc-realsense\PDLC-realsense\dist\win-unpacked\pdlc.exe"
