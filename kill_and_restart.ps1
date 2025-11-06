# Kill all processes on port 8000 and restart server fresh

Write-Host "Stopping all processes on port 8000..." -ForegroundColor Yellow

# Get all PIDs listening on port 8000
$netstatOutput = netstat -ano | Select-String ":8000.*LISTENING"

foreach ($line in $netstatOutput) {
    # Extract PID from the line
    if ($line -match '\s+(\d+)\s*$') {
        $pid = $matches[1]
        Write-Host "  Killing process $pid" -ForegroundColor Red
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "Waiting 3 seconds for cleanup..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Starting fresh server..." -ForegroundColor Green
Write-Host ""

# Start fresh server from project root
Set-Location "c:\Users\marley\siphio-website"
& ".\api\venv\Scripts\python.exe" -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
