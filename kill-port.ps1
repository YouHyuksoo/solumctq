# @file kill-port.ps1
# @description 지정 포트를 사용하는 프로세스를 찾아서 종료
# 사용법: .\kill-port.ps1 3000

param([int]$Port = 3000)

$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

if (-not $connections) {
    Write-Host "포트 $Port 를 사용하는 프로세스가 없습니다." -ForegroundColor Green
    exit 0
}

$connections | ForEach-Object {
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    Write-Host "종료: PID $($_.OwningProcess), 프로세스: $($proc.ProcessName)" -ForegroundColor Yellow
    Stop-Process -Id $_.OwningProcess -Force
}

Write-Host "포트 $Port 정리 완료!" -ForegroundColor Green
