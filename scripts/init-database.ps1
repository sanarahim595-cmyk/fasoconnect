$ErrorActionPreference = "Stop"

$DatabaseUrl = $env:DATABASE_URL

if (-not $DatabaseUrl) {
  throw "DATABASE_URL est obligatoire. Exemple: postgresql://USER:PASSWORD@HOST:5432/fasotontine"
}

psql $DatabaseUrl -f "$PSScriptRoot\..\database\migrations\001_initial_schema.sql"
psql $DatabaseUrl -f "$PSScriptRoot\..\database\migrations\002_seed_demo_data.sql"
