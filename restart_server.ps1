# Simple server restart script with cache clearing

Write-Host "Clearing Python cache..." -ForegroundColor Yellow
Remove-Item -Path "api\__pycache__" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Cache cleared" -ForegroundColor Green

Write-Host ""
Write-Host "Killing old server processes..." -ForegroundColor Yellow
Stop-Process -Id 18704 -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Starting fresh server with cleared cache..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server when done" -ForegroundColor Cyan
Write-Host ""

Set-Location "c:\Users\marley\siphio-website"
& ".\api\venv\Scripts\python.exe" -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
