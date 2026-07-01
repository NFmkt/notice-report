"""
server.py — 로컬 에디터용 Flask 서버 (포트 5173)
정적 파일 서빙 + JSON 저장 API
"""
from flask import Flask, send_from_directory, request, jsonify, send_file
import json
from pathlib import Path

BASE_DIR = Path(__file__).parent
REPORTS_DIR = BASE_DIR / "reports"

app = Flask(__name__)


@app.route('/')
def index():
    return send_file(BASE_DIR / 'index.html')


@app.route('/editor.html')
def editor():
    return send_file(BASE_DIR / 'editor.html')


@app.route('/reports/index.json')
def reports_index():
    return send_from_directory(str(REPORTS_DIR), 'index.json')


@app.route('/reports/<path:filename>')
def reports(filename):
    return send_from_directory(str(REPORTS_DIR), filename)


@app.route('/css/<path:filename>')
def css(filename):
    return send_from_directory(str(BASE_DIR / 'css'), filename)


@app.route('/js/<path:filename>')
def js(filename):
    return send_from_directory(str(BASE_DIR / 'js'), filename)


@app.route('/api/save/<slug>', methods=['POST'])
def save_report(slug):
    data = request.get_json()
    if not data:
        return jsonify({'ok': False, 'error': 'No JSON body'}), 400
    out_path = REPORTS_DIR / f'{slug}.json'
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    return jsonify({'ok': True, 'path': str(out_path)})


@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(str(BASE_DIR), filename)


if __name__ == '__main__':
    print("에디터 서버 시작: http://localhost:5173/editor.html")
    app.run(port=5173, debug=True)
