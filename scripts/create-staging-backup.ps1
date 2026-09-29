param(
  [string]$OutputDirectory = (Join-Path $env:USERPROFILE "RepassafeSecureBackups")
)

$ErrorActionPreference = "Stop"
$databasePassword = Read-Host "Senha do BANCO do projeto repassafe-staging (entrada oculta)" -AsSecureString
try {
  $encodedPassword = [Uri]::EscapeDataString(
    [System.Net.NetworkCredential]::new("", $databasePassword).Password
  )
  $env:SUPABASE_DB_URL = "postgresql://postgres.gfcbnfzyucggdwjtybnm:$encodedPassword@aws-0-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require"
  & (Join-Path $PSScriptRoot "create-logical-backup.ps1") -Environment staging -OutputDirectory $OutputDirectory
} finally {
  Remove-Item Env:\SUPABASE_DB_URL -ErrorAction SilentlyContinue
  $encodedPassword = $null
  $databasePassword.Dispose()
}
