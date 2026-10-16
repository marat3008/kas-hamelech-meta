<#
.SYNOPSIS
  Starts the Grisha competitor/designer intelligence scanner for kas-hamelech-meta.

.DESCRIPTION
  Invokes the real existing scan engine (seo/run-designer-scan.js) - this is
  not a placeholder. It validates the project, runs one batch (or repeats on
  an interval in -Mode continuous), and reports the real exit code.

.PARAMETER Mode
  'once' (default): run the next eligible batch and exit.
  'continuous': run a batch, sleep -IntervalSeconds, repeat until stopped.

.PARAMETER IntervalSeconds
  Delay between batches in continuous mode. Default 1800 (30 minutes).

.PARAMETER NewCampaign
  Start a fresh campaign (resets scan status to pending for every known
  target). Snapshot history is never deleted by this.

.EXAMPLE
  .\start-grisha-intelligence.ps1
.EXAMPLE
  .\start-grisha-intelligence.ps1 -Mode continuous -IntervalSeconds 900
.EXAMPLE
  .\start-grisha-intelligence.ps1 -NewCampaign
#>
param(
  [ValidateSet('once', 'continuous')]
  [string]$Mode = 'once',
  [int]$IntervalSeconds = 1800,
  [switch]$NewCampaign
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Host "Grisha intelligence agent - project root: $ProjectRoot"

# --- Phase 1: validate before doing anything ---
$designersFile = Join-Path $ProjectRoot 'seo\config\designers.json'
$engineFile = Join-Path $ProjectRoot 'seo\run-designer-scan.js'

if (-not (Test-Path $designersFile)) {
  Write-Error "Missing $designersFile - the designer registry does not exist. Aborting."
  exit 1
}
if (-not (Test-Path $engineFile)) {
  Write-Error "Missing $engineFile - the scan engine does not exist. Aborting."
  exit 1
}
try {
  $nodeVersion = (node -v)
} catch {
  Write-Error "Node.js was not found on PATH. Install Node.js and retry."
  exit 1
}
Write-Host "Node.js: $nodeVersion"

if ($NewCampaign) {
  $env:SEO_DESIGNER_NEW_CAMPAIGN = '1'
}

function Invoke-ScanBatch {
  Write-Host "`n=== Grisha intelligence scan - $(Get-Date -Format o) ==="
  # Pipe through Out-Host so node's own console output is displayed directly
  # instead of leaking into this function's return value (a PowerShell
  # function's unredirected pipeline output all becomes part of what the
  # caller captures - without this, "$code = Invoke-ScanBatch" would get
  # node's entire log text glued to the exit code, not the exit code alone).
  & node $engineFile | Out-Host
  return $LASTEXITCODE
}

if ($Mode -eq 'once') {
  $code = Invoke-ScanBatch
  if ($code -eq 0) { Write-Host "`nBatch finished: success." }
  elseif ($code -eq 2) { Write-Host "`nBatch finished: partial completion (some targets failed - see log above)." }
  else { Write-Host "`nBatch finished: failure (exit code $code)." }
  exit $code
}

# --- Continuous mode ---
Write-Host "`nContinuous mode: one batch every $IntervalSeconds seconds."
Write-Host "Stop safely with Ctrl+C, or by creating the file: seo\data\STOP"
$stopFile = Join-Path $ProjectRoot 'seo\data\STOP'
# -NewCampaign only applies to the first batch of a continuous run.
$firstRun = $true

try {
  while ($true) {
    if (Test-Path $stopFile) {
      Write-Host "Stop file found - shutting down gracefully."
      Remove-Item $stopFile -Force
      break
    }
    Invoke-ScanBatch | Out-Null
    if ($firstRun -and $NewCampaign) {
      Remove-Item Env:\SEO_DESIGNER_NEW_CAMPAIGN -ErrorAction SilentlyContinue
      $firstRun = $false
    }
    Start-Sleep -Seconds $IntervalSeconds
  }
} finally {
  Write-Host "Grisha intelligence scanner stopped."
}
