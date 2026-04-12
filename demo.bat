@echo off
REM Crime Hotspot Analysis - Demo Script
REM Run this to demonstrate your project to your sir

echo.
echo ========================================
echo   CRIME HOTSPOT ANALYSIS - DEMO SCRIPT
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Checking if Docker containers are running...
echo.
docker-compose ps
echo.

echo [2/5] Showing Frontend Logs (Nginx)...
echo.
docker-compose logs frontend
echo.

echo [3/5] Showing Backend Logs (Node.js)...
echo.
docker-compose logs backend
echo.

echo [4/5] Showing Database Connection...
echo.
docker-compose logs mongo | findstr "Listening\|Ready\|mongod"
echo.

echo [5/5] Testing API Connection...
echo.
echo Testing if Backend API is responding...
curl -s http://localhost:3000 -o nul && echo "✅ Backend API is RUNNING on http://localhost:3000" || echo "❌ Backend API not responding"
echo.
echo Testing if Frontend is responding...
curl -s http://localhost -o nul && echo "✅ Frontend is RUNNING on http://localhost" || echo "❌ Frontend not responding"
echo.

echo ========================================
echo   DEMO POINTS TO SHOW YOUR SIR
echo ========================================
echo.
echo 1. FRONTEND (http://localhost):
echo    - Shows Crime Hotspot Analysis website
echo    - User login, signup pages
echo    - Police dashboard
echo.
echo 2. BACKEND API (http://localhost:3000):
echo    - POST /signup - User registration
echo    - POST /login - User login
echo    - POST /google-login - Google OAuth
echo.
echo 3. DATABASE (MongoDB on :27017):
echo    - Stores user accounts
echo    - Stores police records
echo    - Persists crime data
echo.
echo 4. ARCHITECTURE:
echo    - 3 Docker containers running together
echo    - Frontend → Backend → Database
echo    - All services communicate via Docker network
echo.
echo ========================================
echo.
pause
