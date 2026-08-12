$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root "dist"
$version = (Get-Content -Raw (Join-Path $root "manifest.json") | ConvertFrom-Json).version
$zip = Join-Path $dist "ruler_bar-v$version.zip"
$xpi = Join-Path $dist "ruler_bar-v$version.xpi"
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "rulerbar"
$tempZip = Join-Path $tempDir ("ruler_bar-v{0}.{1}.zip" -f $version, [Guid]::NewGuid().ToString("N"))

New-Item -ItemType Directory -Force -Path $dist | Out-Null
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

Push-Location $root
try {
  Compress-Archive `
    -Path @("manifest.json", "icon.png", "api", "options", "_locales") `
    -DestinationPath $tempZip
  Copy-Item -Force -Path $tempZip -Destination $zip
  Copy-Item -Force -Path $tempZip -Destination $xpi
}
finally {
  if (Test-Path -LiteralPath $tempZip) {
    for ($attempt = 1; $attempt -le 5; $attempt++) {
      try {
        Remove-Item -Force -LiteralPath $tempZip -ErrorAction Stop
        break
      } catch {
        if ($attempt -eq 5) {
          Write-Warning "Could not remove temporary archive: $tempZip"
        } else {
          Start-Sleep -Milliseconds 200
        }
      }
    }
  }
  Pop-Location
}

Write-Host "Built $xpi"
