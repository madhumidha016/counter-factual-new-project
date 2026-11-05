@echo off
echo ========================================================
echo  Starting Lung Cancer Detection & Staging Backend API
echo ========================================================
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause

