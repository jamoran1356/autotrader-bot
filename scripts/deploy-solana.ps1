$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$keyDir = Join-Path $projectRoot "solana-keys"
$keyPath = Join-Path $keyDir "autotrader-devnet.json"

if (-not (Test-Path $keyDir)) {
  New-Item -ItemType Directory -Path $keyDir | Out-Null
}

Write-Host "[solana] Ensuring devnet config..."
solana config set --url https://api.devnet.solana.com | Out-Null

if (-not (Test-Path $keyPath)) {
  Write-Host "[solana] Generating operator keypair..."
  solana-keygen new --no-bip39-passphrase --silent --force --outfile $keyPath | Out-Null
}

Write-Host "[solana] Switching signer to operator keypair..."
solana config set --keypair $keyPath | Out-Null

$pubkey = solana address

Write-Host "[solana] Funding operator account..."
solana airdrop 1 $pubkey --commitment confirmed | Out-Null

$balance = solana balance --commitment confirmed

$result = [PSCustomObject]@{
  network = "solana-devnet"
  keypairPath = $keyPath
  operatorAddress = $pubkey.Trim()
  balance = $balance.Trim()
}

$result | ConvertTo-Json -Depth 6
