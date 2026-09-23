param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("development", "staging", "production")]
  [string]$Environment,

  [Parameter(Mandatory = $true)]
  [string]$OutputDirectory
)

$ErrorActionPreference = "Stop"
if (-not $env:SUPABASE_DB_URL) {
  throw "SUPABASE_DB_URL is required and must be injected by the secret manager."
}

$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$backupRoot = [System.IO.Path]::GetFullPath($OutputDirectory)
if ($backupRoot.StartsWith($repositoryRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Backup output must be outside the repository."
}

$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$target = Join-Path $backupRoot "repassafe-$Environment-$timestamp"
New-Item -ItemType Directory -Path $target | Out-Null

$schemaFile = Join-Path $target "schema.sql"
$dataFile = Join-Path $target "data.sql"
$rolesFile = Join-Path $target "roles.sql"

& pnpm dlx supabase@2.117.0 db dump --db-url $env:SUPABASE_DB_URL --file $schemaFile
if ($LASTEXITCODE -ne 0) { throw "Schema backup failed." }
& pnpm dlx supabase@2.117.0 db dump --db-url $env:SUPABASE_DB_URL --data-only --use-copy --file $dataFile
if ($LASTEXITCODE -ne 0) { throw "Data backup failed." }
& pnpm dlx supabase@2.117.0 db dump --db-url $env:SUPABASE_DB_URL --role-only --file $rolesFile
if ($LASTEXITCODE -ne 0) { throw "Roles backup failed." }

$files = @($schemaFile, $dataFile, $rolesFile) | ForEach-Object {
  $item = Get-Item -LiteralPath $_
  if ($item.Length -eq 0) { throw "Backup artifact $($item.Name) is empty." }
  $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $_
  @{
    name = $item.Name
    bytes = $item.Length
    sha256 = $hash.Hash.ToLowerInvariant()
  }
}

$manifest = @{
  version = 1
  environment = $Environment
  createdAt = (Get-Date).ToUniversalTime().ToString("o")
  gitCommit = (git rev-parse HEAD).Trim()
  files = $files
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $target "manifest.json") -Encoding utf8NoBOM

Write-Output "Logical backup created at $target. Encrypt and move it to approved off-site storage."
