param(
  [string]$Token,
  [string]$Site = "https://preview.neurocine.online",
  [string]$TaskName = "NeuroCine Preview Local Agent"
)

$ErrorActionPreference = "Stop"

if (-not $Token) {
  throw "Missing token. Open /trailer and copy the full site token, then run this script with -Token."
}

$startScript = Join-Path $PSScriptRoot "start-neurocine-agent-preview.ps1"
$taskArgs = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startScript`" -Site `"$Site`" -Token `"$Token`""
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $taskArgs
$logonTrigger = New-ScheduledTaskTrigger -AtLogOn
$watchdogTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1) -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger @($logonTrigger, $watchdogTrigger) -Settings $settings -Description "Keeps NeuroCine preview Local Agent online for phone-triggered ComfyUI jobs." -Force | Out-Null
Write-Host "Installed scheduled task: $TaskName"
