# =======================================================================
# SCRIPT TO RUN VS CODE SERVE-WEB IN A SPECIFIC PROJECT FOLDER
# =======================================================================

# 1. Set the absolute path of your project folder here
$ProjectPath = "C:\work\repos\plates-game"

# 2. Check if the folder exists before launching the server
if (Test-Path $ProjectPath) {
    Write-Host "Changing directory to project: $ProjectPath" -ForegroundColor Cyan
    Set-Location $ProjectPath

    Write-Host "Starting VS Code Server on LAN (Port 8000)..." -ForegroundColor Green
    Write-Host "Press Ctrl + C in this window to stop the server.`n" -ForegroundColor Yellow

    # 3. Run the VS Code command using the proper --default-folder flag
    code serve-web --without-connection-token --host 0.0.0.0 --default-folder $ProjectPath
} else {
    Write-Error "The specified path does not exist: $ProjectPath. Please check the script configuration."
}