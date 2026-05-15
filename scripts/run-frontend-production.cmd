@echo off
cd /d "%~dp0..\frontend"
if not exist "..\.runtime\logs" mkdir "..\.runtime\logs"
node "node_modules\next\dist\bin\next" start --hostname 127.0.0.1 --port 3001 >> "..\.runtime\logs\frontend.out.log" 2>> "..\.runtime\logs\frontend.err.log"
