# 测量计算助手 - 浏览器访问版
import sys, os, time, webbrowser

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from flask import Flask, jsonify, request, send_file
from api import traverse_calc_from_data, calc_leveling, calc_leveling_misclosure, single_target_calc

app = Flask(__name__, static_folder=os.path.join(BASE_DIR, 'static'), static_url_path='/static')

@app.route('/')
def index():
    return send_file(os.path.join(BASE_DIR, 'templates', 'index.html'))

@app.route('/api/traverse', methods=['POST'])
def api_traverse():
    try:
        data = request.json
        results = traverse_calc_from_data(
            data['start_name'], data['start_x'], data['start_y'],
            data['start_h'], data['start_az'],
            data['angles'], data['distances'])
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/leveling', methods=['POST'])
def api_leveling():
    try:
        data = request.json
        results = calc_leveling(data['records'], data['known_start'])
        misclosure = calc_leveling_misclosure(data['records'], data['known_start'], data['known_end'])
        return jsonify({'results': results, 'misclosure': misclosure})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/single', methods=['POST'])
def api_single():
    try:
        data = request.json
        results = []
        for t in data['targets']:
            result = single_target_calc(
                data['station_x'], data['station_y'], data['station_h'],
                data['azimuth'], t['horizontal_angle'], t['vertical_angle'],
                t['slope_distance'], data.get('instrument_h', 1.3),
                data.get('target_h', 1.6))
            result['name'] = t.get('name', '')
            results.append(result)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    print('=' * 50)
    print('  测量计算助手 v1.0')
    print('=' * 50)
    print('  电脑访问: http://127.0.0.1:5555')
    print('  手机访问: http://<本机IP>:5555')
    print('  Ctrl+C 停止')
    print('=' * 50)
    time.sleep(1.5)
    try:
        webbrowser.open('http://127.0.0.1:5555')
    except:
        pass
    app.run(host='0.0.0.0', port=5555, debug=False, use_reloader=False)