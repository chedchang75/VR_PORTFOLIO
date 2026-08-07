# 사용법: .\make_checkpoint.ps1 "원하는_체크포인트_이름"
param (
    [string]$name = (Get-Date -Format "yyyy-MM-dd_HHmmss")
)
$dest = "_checkpoints/$name"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item -Path "mobile_app.html", "css", "js", "strategies", "Mater_plan.md" -Destination $dest -Recurse -Force
Write-Host "✅ 체크포인트 생성 완료: $dest" -ForegroundColor Green
