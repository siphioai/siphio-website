# Start the AI Nutrition Coach API server
# Run this from the project root: c:\Users\marley\siphio-website

Write-Host "Starting AI Nutrition Coach API Server..." -ForegroundColor Cyan
Write-Host ""

# Use the virtual environment's Python
& ".\api\venv\Scripts\python.exe" -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
