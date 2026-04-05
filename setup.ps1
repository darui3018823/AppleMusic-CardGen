#Requires -Version 7.0
# setup.ps1: Generates a systemd service file for the application.

[CmdletBinding()]
param(
    # The name for the systemd service and the compiled binary.
    [string]$ServiceName = "applemusiccg",

    # The port the service will run on. This is passed as an environment variable.
    [int]$Port = 8086,

    # The Linux user account that will run the service.
    # Defaults to the current user, or 'nobody' if run as root.
    [string]$ServiceUser = (whoami)
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($IsWindows) {
    throw "This script is intended to run on a Linux host to generate a systemd service file."
}

# The full path to the project directory (where this script is located).
$AppDirectory = $PSScriptRoot

# The name of the compiled Go binary.
$BinaryName = $ServiceName

# The full path to the compiled Go binary.
$ExecPath = Join-Path -Path $AppDirectory -ChildPath $BinaryName

Write-Host "==> Generating systemd service file for '$ServiceName'" -ForegroundColor Cyan
Write-Host "    Service Name: $ServiceName"
Write-Host "    Binary Path:  $ExecPath"
Write-Host "    Port:         $Port"
Write-Host "    User:         $ServiceUser"

# Define the content of the systemd service file.
$ServiceFileContent = @"
[Unit]
Description=Go Web Server ($ServiceName)
After=network.target

[Service]
Type=simple
User=$ServiceUser
WorkingDirectory=$AppDirectory

# Set the PORT environment variable for the Go application.
Environment="PORT=$Port"

ExecStart=$ExecPath
Restart=on-failure

[Install]
WantedBy=multi-user.target
"@

$OutputFileName = "$ServiceName.service"
$OutputFilePath = Join-Path -Path $AppDirectory -ChildPath $OutputFileName

# Write the content to the .service file in the project directory.
$ServiceFileContent | Out-File -FilePath $OutputFilePath -Encoding utf8

Write-Host ""
Write-Host "==> Success!" -ForegroundColor Green
Write-Host "Generated '$OutputFilePath'"
Write-Host ""
Write-Host "----------------- Next Steps -----------------" -ForegroundColor Yellow
Write-Host "1. Compile the Go application:"
Write-Host "   go build -o `"$BinaryName`" ."
Write-Host ""
Write-Host "2. Move the service file to the systemd directory:"
Write-Host "   sudo mv `"$OutputFilePath`" /etc/systemd/system/"
Write-Host ""
Write-Host "3. Reload systemd to recognize the new service:"
Write-Host "   sudo systemctl daemon-reload"
Write-Host ""
Write-Host "4. Enable and start the service:"
Write-Host "   sudo systemctl enable --now $ServiceName"
Write-Host ""
Write-Host "5. Check the service status:"
Write-Host "   systemctl status $ServiceName"
Write-Host "----------------------------------------------"
