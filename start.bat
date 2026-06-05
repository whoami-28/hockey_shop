@echo off
chcp 65001 > nul

echo Запуск сервера POWERPLAY HOCKEY...
start "POWERPLAY HOCKEY SERVER" cmd /k "npm start"

echo Ожидание инициализации сервера (3 секунды)...
timeout /t 3 /nobreak > nul

echo Открытие панели администратора...
start http://localhost:3000/Admin.html
start http://localhost:3000/Main.html