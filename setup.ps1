# setup.ps1 – one-time setup for Hackathon Globe Radar
# Run from the project root: .\setup.ps1

Write-Host "`n=== Backend Setup ===" -ForegroundColor Yellow

Set-Location backend

# Create virtual environment
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python venv..." -ForegroundColor Cyan
    python -m venv venv
}

# Activate and install deps
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
.\venv\Scripts\pip install -r requirements.txt

# Install Playwright browsers
Write-Host "Installing Playwright browsers..." -ForegroundColor Cyan
.\venv\Scripts\playwright install chromium

# Init MongoDB indexes
Write-Host "Initializing MongoDB indexes..." -ForegroundColor Cyan
.\venv\Scripts\python init_db.py

Set-Location ..

Write-Host "`n=== Frontend Setup ===" -ForegroundColor Yellow
Set-Location frontend

Write-Host "Installing Node dependencies..." -ForegroundColor Cyan
npm install

Set-Location ..

Write-Host "`n=== Setup complete! ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Start MongoDB:  mongod" -ForegroundColor Gray
Write-Host "  2. Run scraper:    cd backend; .\venv\Scripts\python -m scraper.run" -ForegroundColor Gray
Write-Host "  3. Start backend:  cd backend; .\venv\Scripts\uvicorn app.main:app --reload" -ForegroundColor Gray
Write-Host "  4. Start frontend: cd frontend; npm run dev" -ForegroundColor Gray
