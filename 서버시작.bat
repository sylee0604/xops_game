@echo off
echo XOPS 게임 서버 시작 중...
start "" "http://localhost:8080"
python -m http.server 8080
pause
