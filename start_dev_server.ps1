Write-Host "Starting Adventure Game Development Server..." -ForegroundColor Green
Write-Host ""
Write-Host "Features:" -ForegroundColor Yellow
Write-Host "- Auto-refresh on file changes"
Write-Host "- CORS enabled for local development"
Write-Host "- Watching JS, HTML, CSS, Python, and GLB files"
Write-Host ""
Write-Host "Server will start at http://localhost:8000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""

try {
    python dev_server.py
} catch {
    Write-Host "Error starting server: $_" -ForegroundColor Red
    Write-Host "Make sure Python is installed and accessible from the command line."
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
