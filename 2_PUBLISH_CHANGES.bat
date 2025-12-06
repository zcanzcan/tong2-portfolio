@echo off
chcp 65001 > nul
echo ========================================================
echo [Developer Portfolio] 변경사항 배포(저장) 도구
echo ========================================================
echo.
echo 현재 변경된 파일 목록:
git status --short
echo.
echo.
echo 위 변경사항을 서버(Vercel)에 반영하시겠습니까?
echo (반영 후 약 2~3분 뒤 라이브 사이트가 업데이트됩니다)
echo.
pause

echo.
echo [1/3] 변경사항 등록 중...
git add .

echo [2/3] 변경사항 저장 중...
git commit -m "update: portfolio content update via script"

echo [3/3] 서버로 전송 중... (잠시만 기다려주세요)
git push origin main

echo.
echo ========================================================
echo 배포 완료! 약 3분 뒤 사이트를 확인하세요.
echo ========================================================
pause
