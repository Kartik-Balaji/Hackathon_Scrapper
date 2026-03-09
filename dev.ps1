# dev.ps1 – Start backend and frontend dev servers simultaneously
# Run from project root: .\dev.ps1

Write-Host "Starting Hackathon Globe Radar..." -ForegroundColor Yellow

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$PWD\backend'; .\venv\Scripts\uvicorn app.main:app --reload --port 8000"

Start-Sleep -Seconds 1

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$PWD\frontend'; npm run dev"

Write-Host "`nServers launched:" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  API docs: http://localhost:8000/docs" -ForegroundColor Gray
