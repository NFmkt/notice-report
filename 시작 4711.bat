@echo off
chcp 65001
cd /d "%~dp0admin"
start "" http://localhost:4711
npx nodemon server.js
