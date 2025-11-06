@echo off
REM Start the AI Nutrition Coach API server
REM This script must be run from the api directory

echo Starting AI Nutrition Coach API Server...
echo.

REM Check if venv is activated
if not defined VIRTUAL_ENV (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
)

echo Starting uvicorn server on http://127.0.0.1:8000
echo Press CTRL+C to stop the server
echo.

REM Run uvicorn from parent directory with api.main:app
cd ..
python api\venv\Scripts\uvicorn.exe api.main:app --reload --host 127.0.0.1 --port 8000
