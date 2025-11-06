# Complete fresh start - kill everything and restart without reload

Write-Host "Step 1: Killing ALL Python processes..." -ForegroundColor Yellow
Get-Process python* -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Step 2: Clearing ALL Python cache..." -ForegroundColor Yellow
Remove-Item -Path "api\__pycache__" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "api\agent\__pycache__" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "api\database\__pycache__" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "api\utils\__pycache__" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Cache cleared!" -ForegroundColor Green

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Step 3: Starting FRESH server (no reload flag)..." -ForegroundColor Green
Write-Host "Server will start with latest code. Press Ctrl+C to stop." -ForegroundColor Cyan
Write-Host ""

Set-Location "c:\Users\marley\siphio-website"

# Start WITHOUT --reload to force fresh import
& ".\api\venv\Scripts\python.exe" -m uvicorn api.main:app --host 127.0.0.1 --port 8000
