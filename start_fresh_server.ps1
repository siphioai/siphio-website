# Kill any existing uvicorn processes
Get-Process -Name python* -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -like "*uvicorn*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 2

# Start fresh server
Set-Location "c:\Users\marley\siphio-website"
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
