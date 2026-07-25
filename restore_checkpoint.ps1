# 사용법: .\restore_checkpoint.ps1 "체크포인트_이름"
param (
    [string]$name = "2026-07-25_STABLE_CHECKPOINT"
)
$src = "_checkpoints/$name"
if (Test-Path $src) {
    Copy-Item -Path "$src/*" -Destination "." -Recurse -Force
    Write-Host "🔄 [$name] 시점으로 100% 롤백 복원 완료되었습니다!" -ForegroundColor Green
} else {
    Write-Host "❌ 지정된 체크포인트를 찾을 수 없습니다: $src" -ForegroundColor Red
}
