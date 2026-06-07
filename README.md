# 测量计算助手 v1.0

面向测绘专业学生的 Python 小程序，用于全站仪和水平测量数据的计算与导出。

## 功能特性

### 1. 全站仪导线测量
- 支持附合导线坐标计算
- 右角法计算方位角和坐标
- 最多支持 8 个测站
- 自动计算象限角
- 结果导出为 CSV

### 2. 水准测量
- 多测站水准测量计算
- 自动计算高差、高程
- 闭合差计算与合格性判断
- 绿色=合格，红色=不合格
- 结果导出为 CSV

### 3. 单点坐标计算
- 根据已知点和观测数据计算目标点坐标
- 支持批量处理多个目标点
- 自动计算水平距离、高差、方位角
- 结果导出为 CSV

## 运行方法

### 方式一：桌面窗口版（推荐）
双击 main.py 或使用命令行：
```
python main.py
```
会弹出一个独立的窗口，使用内嵌浏览器渲染，看起来像原生桌面应用。

### 方式二：浏览器模式（手机可以直接访问）
```
python run_server.py
```
然后在浏览器中打开 http://127.0.0.1:5555，手机扫电脑 IP 就能访问。

## 环境要求

- Python 3.7+
- 依赖: `pip install flask pywebview`

## 打包为 exe（可选）

```bash
pip install pyinstaller
pyinstaller --name "测量计算助手" --windowed --onefile main.py
```

## 技术栈

- 前端: Bootstrap 5 + HTML5 + CSS3 + JavaScript
- 后端: Flask
- 桌面封装: pywebview（内置 Chromium）
- 计算: 纯 Python 标准库

## 参考项目

- [GeoscienceAustralia/GeodePy](https://github.com/GeoscienceAustralia/GeodePy)
- [mikemost/geomatics](https://github.com/mikemost/geomatics)
- [geospace-code/pymap3d](https://github.com/geospace-code/pymap3d)