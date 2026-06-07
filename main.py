import sys, os, time, subprocess, tempfile

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

if __name__ == '__main__':
    flask_code = '''import sys, os, time
BASE_DIR = r"%s"
sys.path.insert(0, BASE_DIR)
from flask import Flask, jsonify, request, send_file
from api import traverse_calc_from_data, calc_leveling, calc_leveling_misclosure, single_target_calc

app = Flask(__name__, static_folder=os.path.join(BASE_DIR, "static"), static_url_path="/static")

@app.route("/")
def index():
    return send_file(os.path.join(BASE_DIR, "templates", "index.html"))

@app.route("/api/traverse", methods=["POST"])
def api_traverse():
    try:
        d = request.json
        return jsonify(traverse_calc_from_data(d["start_name"], d["start_x"], d["start_y"], d["start_h"], d["start_az"], d["angles"], d["distances"]))
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/leveling", methods=["POST"])
def api_leveling():
    try:
        d = request.json
        results = calc_leveling(d["records"], d["known_start"])
        mc = calc_leveling_misclosure(d["records"], d["known_start"], d["known_end"])
        return jsonify({"results": results, "misclosure": mc})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/single", methods=["POST"])
def api_single():
    try:
        d = request.json
        results = []
        for t in d["targets"]:
            r = single_target_calc(d["station_x"], d["station_y"], d["station_h"], d["azimuth"], t["horizontal_angle"], t["vertical_angle"], t["slope_distance"], d.get("instrument_h", 1.3), d.get("target_h", 1.6))
            r["name"] = t.get("name", "")
            results.append(r)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5555, debug=False)
''' % BASE_DIR

    flask_script = os.path.join(tempfile.gettempdir(), '_measure_flask_server.py')
    with open(flask_script, 'w', encoding='utf-8') as f:
        f.write(flask_code)

    flask_process = subprocess.Popen(
        [sys.executable, flask_script],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    time.sleep(2)

    try:
        import webview
        window = webview.create_window(
            '测量计算助手 v1.0',
            url='http://127.0.0.1:5555',
            width=1200, height=800,
            resizable=True, min_size=(800, 600),
        )
        webview.start()
    except ImportError:
        print("pywebview not installed. Run: pip install pywebview flask")
    finally:
        flask_process.terminate()