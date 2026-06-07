# 公网隧道启动脚本 - 一键将本程序暴露到公网
import subprocess, sys, os, time, re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

print("=" * 55)
print("  测量计算助手 - 公网隧道模式")
print("=" * 55)
print()

print("[1/2] 启动 Flask 服务器...")
flask_proc = subprocess.Popen(
    [sys.executable, os.path.join(BASE_DIR, "run_server.py")],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    cwd=BASE_DIR)
time.sleep(2)
print("      Flask 已启动 (127.0.0.1:5555)")
print()

print("[2/2] 建立公网隧道 (serveo.net)...")
tunnel = subprocess.Popen(
    ["ssh", "-o", "StrictHostKeyChecking=no",
     "-o", "ExitOnForwardFailure=yes",
     "-R", "80:127.0.0.1:5555", "serveo.net"],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

# 读取 URL
public_url = ""
for _ in range(10):
    line = tunnel.stdout.readline()
    if not line:
        break
    m = re.search(r'(https://[^\s\x1b]+)', line)
    if m:
        public_url = m.group(1)
        break

time.sleep(1)

print()
print("=" * 55)
print("  >>> 公网访问地址 <<<")
print(f"  {public_url}")
print("=" * 55)
print()
print("  任何人用手机或电脑浏览器打开上面网址即可使用")
print("  不需要连接同一个WiFi，不需要安装任何软件")
print()
print("  按 Ctrl+C 停止服务")
print()

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print()
    print("正在关闭...")
    tunnel.terminate()
    flask_proc.terminate()
    print("已停止")