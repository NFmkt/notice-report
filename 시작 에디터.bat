@echo off
chcp 65001
cd /d "%~dp0"
start http://localhost:5173/editor.html
python server.py
