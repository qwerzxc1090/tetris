# 테트리스 로컬 서버 (http://localhost:5500) - 구글 로그인 테스트용
$Port = 5500
$Root = $PSScriptRoot

Write-Host "Starting server at http://localhost:$Port" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

# Python 3
$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
    Set-Location $Root
    python -m http.server $Port
    exit
}

# Node.js (npx serve)
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    Set-Location $Root
    npx --yes serve -l $Port
    exit
}

Write-Host "Python or Node.js not found. Install one of them, or use VS Code Live Server on port 5500." -ForegroundColor Yellow
