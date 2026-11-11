# Quick Start Script for Meta Hackathon Prize Splitter

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  THE META HACKATHON PRIZE SPLITTER (SUPABASE EDITION)     " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

# Check Python environment
Write-Host "`n[1/2] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# Check Vite frontend
Write-Host "[2/2] Starting Vite React Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`nAll services launched!" -ForegroundColor Cyan
Write-Host "- Backend API & Swagger: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "- Frontend Application: http://localhost:5173" -ForegroundColor Gray
