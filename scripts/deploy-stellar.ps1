$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$contractDir = Join-Path $projectRoot "stellar-contracts/premium-signal-gate"
$identity = "autotrader-stellar"
$network = "testnet"

Write-Host "[stellar] Building contract..."
Push-Location $contractDir
stellar contract build --manifest-path Cargo.toml
Pop-Location

Write-Host "[stellar] Ensuring identity exists..."
$keysList = stellar keys ls 2>$null
if (-not ($keysList -match "\b$identity\b")) {
  stellar keys generate $identity
}

Write-Host "[stellar] Funding identity on testnet..."
stellar keys fund $identity --network $network

$wasmPath = Get-ChildItem -Path (Join-Path $contractDir "target/wasm32v1-none/release") -Filter "*.wasm" | Select-Object -First 1
if (-not $wasmPath) {
  throw "No wasm artifact found. Build step did not produce output."
}

Write-Host "[stellar] Deploying contract..."
$contractId = stellar contract deploy --wasm $wasmPath.FullName --source-account $identity --network $network --alias premium-signal-gate

$publicKey = stellar keys public-key $identity

$result = [PSCustomObject]@{
  network = "stellar-testnet"
  identity = $identity
  sourcePublicKey = $publicKey.Trim()
  contractId = $contractId.Trim()
  wasm = $wasmPath.FullName
}

$result | ConvertTo-Json -Depth 6
