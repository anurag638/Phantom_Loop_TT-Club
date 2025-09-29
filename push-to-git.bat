@echo off
echo ========================================
echo   Phantom Loop TT Club - Git Push
echo ========================================
echo.

echo Checking Git installation...
git --version
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed or not in PATH
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo.
echo Initializing Git repository...
git init

echo.
echo Adding GitHub repository as remote origin...
git remote add origin https://github.com/anurag638/Phantom_Loop_TT-Club.git

echo.
echo Adding all files to staging area...
git add .

echo.
echo Creating commit with latest changes...
git commit -m "🚀 Enhanced Table Tennis Club Dashboard

✨ Major Updates:
- Automatic player stats updates when matches are added
- Real-time Firebase synchronization across devices
- Enhanced player dashboard with live performance tracking
- Improved match validation and error handling
- Better ranking system with automatic updates

🎯 Player Statistics Features:
- Wins/Losses automatically incremented after matches
- Current streak tracking (positive for wins, negative for losses)
- Win rate calculations update in real-time
- Rankings automatically adjusted based on performance

🏓 Club Management:
- Admin can add matches with instant stat updates
- Players see their stats update immediately
- Firebase database ensures consistency across all devices
- Email notifications for new player registrations"

echo.
echo Pushing to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS! Your code has been pushed to GitHub!
    echo 🌐 Repository: https://github.com/anurag638/Phantom_Loop_TT-Club
    echo.
    echo Next steps:
    echo 1. Visit your repository to verify everything is uploaded
    echo 2. Enable GitHub Pages for live website deployment
    echo 3. Share the live URL with your club members
) else (
    echo.
    echo ❌ Push failed. This might be due to:
    echo - Authentication issues (need GitHub username/password or token)
    echo - Repository already exists with different remote
    echo - Network connectivity issues
    echo.
    echo Please check the error messages above and try again.
)

echo.
pause
