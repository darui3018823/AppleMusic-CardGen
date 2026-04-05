#requires -Version 7.0

[CmdletBinding()]
param(
    [string]$ServiceName = "applemusiccg",
    [string]$Remote = "origin",
    [string]$Branch = "master",
    [string]$HealthUrl = "http://127.0.0.1:8086/",
    [int]$HealthRetries = 20,
    [int]$HealthDelaySeconds = 1,
    [switch]$AllowDirty,
    [switch]$AutoCommit,
    [string]$AutoCommitMessage = "rebuild: auto-commit before deploy",
    [switch]$ForceSync,
    [switch]$SkipTests,
    [switch]$SkipHealthCheck
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Require-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $Name"
    }
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter(Mandatory = $true)][string]$Description
    )

    Write-Host "[run] $Description"
    Write-Host "      $Command" -ForegroundColor DarkGray
    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed ($LASTEXITCODE): $Description"
    }
}

function Invoke-Systemctl {
    param(
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    $isRoot = $false
    if ($IsLinux) {
        $uid = & id -u
        $isRoot = ($uid -eq "0")
    }

    if ($isRoot) {
        & systemctl @Arguments
    }
    elseif (Get-Command sudo -ErrorAction SilentlyContinue) {
        & sudo systemctl @Arguments
    }
    else {
        throw "systemctl requires root privileges. Run as root or install sudo."
    }

    if ($LASTEXITCODE -ne 0) {
        throw "systemctl failed: systemctl $($Arguments -join ' ')"
    }
}

Write-Step "Environment checks"
if (-not $IsLinux) {
    throw "This script is intended to run on Linux (systemd host)."
}

Require-Command git
Require-Command go
Require-Command systemctl

Invoke-Checked -Command "git rev-parse --is-inside-work-tree" -Description "Verify current directory is a git repository"

$dirty = (git status --porcelain)
if (-not [string]::IsNullOrWhiteSpace(($dirty -join "`n"))) {
    if ($AutoCommit) {
        Write-Host "Local changes detected. Auto-committing..." -ForegroundColor Yellow
        Invoke-Checked -Command "git add -A" -Description "Stage all changes"
        Invoke-Checked -Command "git commit -m ""$AutoCommitMessage""" -Description "Commit staged changes"
    }
    elseif (-not $AllowDirty) {
        throw "Working tree has local changes. Commit/stash first, or use -AllowDirty or -AutoCommit."
    }
}

Write-Step "Sync source"
Invoke-Checked -Command "git fetch --prune $Remote" -Description "Fetch remote refs"

if ($ForceSync) {
    Invoke-Checked -Command "git reset --hard $Remote/$Branch" -Description "Force sync to $Remote/$Branch"
}
else {
    try {
        Invoke-Checked -Command "git pull --ff-only $Remote $Branch" -Description "Pull latest changes ($Remote/$Branch)"
    }
    catch {
        if ($AutoCommit) {
            Write-Host "Fast-forward failed after auto-commit. Retrying with rebase..." -ForegroundColor Yellow
            try {
                Invoke-Checked -Command "git pull --rebase $Remote $Branch" -Description "Rebase local commits onto $Remote/$Branch"
            }
            catch {
                Write-Host "Rebase failed. Resolve conflicts and run again, or use -ForceSync to discard local commits." -ForegroundColor Red
                throw $_
            }
        }
        else {
            Write-Host "Fast-forward failed (diverging branches detected). Use -ForceSync to force reset to remote." -ForegroundColor Red
            throw $_
        }
    }
}

Write-Step "Build checks"
Invoke-Checked -Command "go build ./..." -Description "Compile all packages"

if (-not $SkipTests) {
    Invoke-Checked -Command "go test ./..." -Description "Run tests"
}

Write-Step "Restart service"
Invoke-Systemctl -Arguments @("restart", $ServiceName)
Invoke-Systemctl -Arguments @("is-active", "--quiet", $ServiceName)
Write-Host "Service '$ServiceName' is active." -ForegroundColor Green

if (-not $SkipHealthCheck) {
    Write-Step "Health check"
    $ok = $false
    for ($i = 1; $i -le $HealthRetries; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $HealthUrl -Method Get -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                $ok = $true
                Write-Host "Health check OK: $HealthUrl" -ForegroundColor Green
                break
            }
        }
        catch {
            Write-Host "Attempt $i/${HealthRetries}: waiting for service..." -ForegroundColor DarkYellow
        }
        Start-Sleep -Seconds $HealthDelaySeconds
    }

    if (-not $ok) {
        throw "Health check failed after $HealthRetries attempts: $HealthUrl"
    }
}

Write-Host ""
Write-Host "Rebuild pipeline completed successfully." -ForegroundColor Green
