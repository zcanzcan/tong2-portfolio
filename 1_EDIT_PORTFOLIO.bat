@echo off
chcp 65001 > nul
echo ========================================================
echo [Developer Portfolio] 관리자 모드 실행 중...
echo ========================================================
echo.
echo 1. 로컬 서버를 실행합니다...
start "Portfolio Server" cmd /c "npm run dev"

echo 2. 서버가 켜질 때까지 5초간 대기합니다...
timeout /t 5 /nobreak > nul

echo 3. 관리자 페이지를 엽니다...
start http://localhost:3000/admin

echo.
echo ========================================================
echo 실행 완료!
echo 창을 닫아도 서버는 계속 실행됩니다.
echo 서버를 끄려면 "Portfolio Server" 창을 닫으세요.
echo ========================================================
pause
