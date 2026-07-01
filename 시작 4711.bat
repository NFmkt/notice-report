@echo off
chcp 65001
cd /d "%~dp0"
start http://localhost:4711
node admin/server.js
