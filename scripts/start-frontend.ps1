$ErrorActionPreference = "Stop"

Push-Location "$PSScriptRoot\..\frontend"
npm run dev:local
Pop-Location
