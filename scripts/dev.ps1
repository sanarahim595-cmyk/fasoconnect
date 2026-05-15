Write-Host "Start the services in separate terminals:"
Write-Host "1. docker compose up -d postgres"
Write-Host "2. cd backend; .\.venv\Scripts\uvicorn.exe app.main:app --reload"
Write-Host "3. cd frontend; npm run dev"
