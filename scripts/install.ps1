$ErrorActionPreference = "Stop"

Write-Host "Installing FasoTontine dependencies..."

if (Test-Path "frontend") {
  Push-Location "frontend"
  npm install
  Pop-Location
}

if (Test-Path "backend") {
  Push-Location "backend"
  python -m venv .venv
  .\.venv\Scripts\python.exe -m ensurepip --upgrade
  .\.venv\Scripts\python.exe -m pip install --upgrade pip
  .\.venv\Scripts\python.exe -m pip install -r requirements.txt
  Pop-Location
}

Write-Host "Done."
