param(
  [string]$Site = "https://preview.neurocine.online",
  [string]$Token = "",
  [string]$Provider = "comfyui",
  [string]$Worker = "http://127.0.0.1:8188",
  [string]$Checkpoint = "RealVisXL_V5.0_fp16.safetensors",
  [string]$ComfyUiDir = "C:\Users\Admin\AI\ComfyUI",
  [string]$Python = "C:\Users\Admin\AI\ComfyUI\.venv\Scripts\python.exe"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$Token = ($Token, $env:NEUROCINE_AGENT_TOKEN | Where-Object { $_ } | Select-Object -First 1)

if (-not $Token) {
  throw "Missing NeuroCine Local Agent token. Pass -Token or set NEUROCINE_AGENT_TOKEN."
}

$needle = "scripts/neurocine-local-agent.mjs"
$running = Get-CimInstance Win32_Process |
  Where-Object {
    $_.CommandLine -and
    $_.CommandLine.Contains($needle) -and
    $_.CommandLine.Contains($Token) -and
    $_.CommandLine.Contains($Site)
  }

if ($running) {
  Write-Host "NeuroCine Local Agent already running for $Site."
  exit 0
}

$npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
$npm = if ($npmCmd) { $npmCmd.Source } else { "npm" }
$outLog = Join-Path $RepoRoot "neurocine-local-agent.session.out.log"
$errLog = Join-Path $RepoRoot "neurocine-local-agent.session.err.log"

$args = @(
  "run", "local-agent", "--",
  "--site", $Site,
  "--token", $Token,
  "--provider", $Provider,
  "--worker", $Worker,
  "--checkpoint", $Checkpoint,
  "--comfyui-dir", $ComfyUiDir,
  "--python", $Python
)

Start-Process -FilePath $npm -ArgumentList $args -WorkingDirectory $RepoRoot -RedirectStandardOutput $outLog -RedirectStandardError $errLog -WindowStyle Hidden
Write-Host "NeuroCine Local Agent started for $Site."
