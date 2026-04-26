$ErrorActionPreference = "Stop"

$email = "admin@sistemamaestro.com"

Write-Host ""
Write-Host "=== AUTH COOKIE SMOKE TEST ===" -ForegroundColor Cyan
Write-Host "Email: $email"

$securePassword = Read-Host "Password actual de admin" -AsSecureString

$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)

if ([string]::IsNullOrWhiteSpace($password)) {
  Write-Host "Password vacía. Test cancelado." -ForegroundColor Red
  exit 1
}

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$body = @{
  email = $email
  password = $password
} | ConvertTo-Json -Compress

$password = $null

Write-Host ""
Write-Host "=== LOGIN ===" -ForegroundColor Cyan

$loginOk = $false

try {
  $login = Invoke-WebRequest `
    -Uri "http://127.0.0.1:8000/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -WebSession $session

  Write-Host "Login status: $($login.StatusCode)" -ForegroundColor Green
  $loginOk = $true
} catch {
  Write-Host "Login falló:" -ForegroundColor Red
  Write-Host $_.Exception.Message

  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $errorBody = $reader.ReadToEnd()
    Write-Host ""
    Write-Host "Detalle backend:" -ForegroundColor Yellow
    Write-Host $errorBody
  }
}

if (-not $loginOk) {
  Write-Host ""
  Write-Host "No se prueba /auth/me porque login no ha sido válido." -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "=== COOKIES GUARDADAS ===" -ForegroundColor Cyan

$session.Cookies.GetCookies("http://127.0.0.1:8000") |
  Select-Object Name, Domain, Path, Secure, Expires |
  Format-Table -AutoSize

Write-Host ""
Write-Host "=== AUTH ME ===" -ForegroundColor Cyan

try {
  $me = Invoke-WebRequest `
    -Uri "http://127.0.0.1:8000/api/auth/me" `
    -Method GET `
    -WebSession $session

  Write-Host "Auth/me status: $($me.StatusCode)" -ForegroundColor Green
  Write-Host ""
  Write-Host $me.Content
} catch {
  Write-Host "Auth/me falló:" -ForegroundColor Red
  Write-Host $_.Exception.Message

  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $errorBody = $reader.ReadToEnd()
    Write-Host ""
    Write-Host "Detalle backend:" -ForegroundColor Yellow
    Write-Host $errorBody
  }

  exit 1
}

Write-Host ""
Write-Host "AUTH OK: login + cookie + /auth/me funcionando." -ForegroundColor Green
