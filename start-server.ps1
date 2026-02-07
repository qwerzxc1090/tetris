# 테트리스 로컬 서버 (http://localhost:5500) - 구글 로그인 테스트용
$Port = 5500
$Root = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location | Select-Object -ExpandProperty Path }

# 반드시 프로젝트 폴더에서 서버 실행
Push-Location $Root
try {
    Write-Host "Serving from: $Root" -ForegroundColor Gray
    Write-Host "Starting server at http://localhost:$Port" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
    Write-Host ""

    # Python 3 (0.0.0.0 바인딩으로 로컬 접속 안정화)
    $python = Get-Command python -ErrorAction SilentlyContinue
    if ($python) {
        python -m http.server $Port --bind 0.0.0.0
        exit
    }

    # Node.js (npx serve)
    $node = Get-Command node -ErrorAction SilentlyContinue
    if ($node) {
        npx --yes serve -l $Port .
        exit
    }

    Write-Host "Python or Node.js not found. Install one of them, or use VS Code Live Server on port 5500." -ForegroundColor Yellow
} finally {
    Pop-Location
}
