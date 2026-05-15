$ErrorActionPreference = "Stop"

$Root = Resolve-Path "$PSScriptRoot\.."
$Backend = Join-Path $Root "backend"
$Python = Join-Path $Backend ".venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
  throw "Environnement Python introuvable. Lance d'abord .\scripts\install.ps1."
}

Start-Process -FilePath $Python `
  -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000" `
  -WorkingDirectory $Backend `
  -WindowStyle Hidden

Write-Host "FasoTontine backend started without PowerShell window: http://localhost:8000"
