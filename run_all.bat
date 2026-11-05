@echo off
echo ========================================================
echo  Launching Lung Cancer Detection Full-Stack Application
echo ========================================================
start cmd /k "run_backend.bat"
timeout /t 3 /nobreak >nul
start cmd /k "run_frontend.bat"
echo Applications started!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs

