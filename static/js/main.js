// ==================== 全局状态 ====================
let traverseResultData = [];
let levelingResultData = [];
let singleResultData = [];

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
    // 初始化默认行
    for (let i = 0; i < 5; i++) addTraverseRow();
    for (let i = 0; i < 5; i++) addLevelingRow();
    for (let i = 0; i < 5; i++) addSingleRow();
});

// ==================== 全站仪导线测量 ====================

function addTraverseRow() {
    const tbody = document.getElementById('tr_obs_body');
    const idx = tbody.rows.length + 1;
    const row = tbody.insertRow();
    row.innerHTML = `
        <td>${idx}</td>
        <td><input type="number" class="form-control form-control-sm" value="90" step="0.0001"></td>
        <td><input type="number" class="form-control form-control-sm" value="50" step="0.001"></td>
        <td class="text-center"><button class="btn btn-sm btn-outline-danger py-0" onclick="this.closest('tr').remove()" title="删除"><i class="fas fa-times"></i></button></td>
    `;
}

async function calculateTraverse() {
    const tbody = document.getElementById('tr_obs_body');
    const rows = tbody.rows;
    const angles = [];
    const dists = [];
    for (let i = 0; i < rows.length; i++) {
        const inputs = rows[i].querySelectorAll('input');
        if (inputs[0].value || inputs[1].value) {
            angles.push(parseFloat(inputs[0].value) || 0);
            dists.push(parseFloat(inputs[1].value) || 0);
        }
    }
    if (angles.length === 0) {
        alert('请至少输入一组观测数据！');
        return;
    }

    const data = {
        start_name: document.getElementById('tr_start_name').value,
        start_x: parseFloat(document.getElementById('tr_start_x').value),
        start_y: parseFloat(document.getElementById('tr_start_y').value),
        start_h: parseFloat(document.getElementById('tr_start_h').value),
        start_az: parseFloat(document.getElementById('tr_start_az').value),
        angles: angles,
        distances: dists
    };

    try {
        const resp = await fetch('/api/traverse', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const results = await resp.json();
        traverseResultData = results;
        renderTraverseResults(results);
    } catch (e) {
        alert('计算失败: ' + e.message);
    }
}

function renderTraverseResults(results) {
    const tbody = document.getElementById('tr_result_body');
    tbody.innerHTML = '';
    results.forEach(r => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><strong>${r.name}</strong></td>
            <td>${r.x.toFixed(3)}</td>
            <td>${r.y.toFixed(3)}</td>
            <td>${r.h.toFixed(3)}</td>
            <td>${r.azimuth.toFixed(6)}</td>
            <td>${r.direction_angle}</td>
            <td>${r.distance.toFixed(3)}</td>
        `;
    });
}

function exportTraverseCSV() {
    if (traverseResultData.length === 0) { alert('没有可导出的数据！'); return; }
    const headers = ['测站','X坐标','Y坐标','高程','方位角(度)','象限角','边长'];
    let csv = headers.join(',') + '\n';
    traverseResultData.forEach(r => {
        csv += [r.name, r.x.toFixed(3), r.y.toFixed(3), r.h.toFixed(3),
                r.azimuth.toFixed(6), r.direction_angle, r.distance.toFixed(3)].join(',') + '\n';
    });
    downloadCSV(csv, '导线计算结果.csv');
}

// ==================== 水准测量 ====================

function addLevelingRow() {
    const tbody = document.getElementById('lv_obs_body');
    const idx = tbody.rows.length + 1;
    const row = tbody.insertRow();
    row.innerHTML = `
        <td>${idx}</td>
        <td><input type="text" class="form-control form-control-sm" value="BM${idx}" style="width:60px"></td>
        <td><input type="number" class="form-control form-control-sm" value="1.234" step="0.001" style="width:70px"></td>
        <td><input type="text" class="form-control form-control-sm" value="TP${idx}" style="width:60px"></td>
        <td><input type="number" class="form-control form-control-sm" value="0.987" step="0.001" style="width:70px"></td>
        <td><input type="number" class="form-control form-control-sm" value="50" step="0.1" style="width:65px"></td>
        <td class="text-center"><button class="btn btn-sm btn-outline-danger py-0" onclick="this.closest('tr').remove()" title="删除"><i class="fas fa-times"></i></button></td>
    `;
}

async function calculateLeveling() {
    const tbody = document.getElementById('lv_obs_body');
    const rows = tbody.rows;
    const records = [];
    for (let i = 0; i < rows.length; i++) {
        const inputs = rows[i].querySelectorAll('input');
        if (inputs[1].value || inputs[3].value) {
            records.push({
                back_station: inputs[0].value,
                back_reading: parseFloat(inputs[1].value) || 0,
                front_station: inputs[2].value,
                front_reading: parseFloat(inputs[3].value) || 0,
                station_dist: parseFloat(inputs[4].value) || 0
            });
        }
    }
    if (records.length === 0) { alert('请至少输入一组观测数据！'); return; }

    const data = {
        records: records,
        known_start: parseFloat(document.getElementById('lv_known_start').value),
        known_end: parseFloat(document.getElementById('lv_known_end').value)
    };

    try {
        const resp = await fetch('/api/leveling', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await resp.json();
        levelingResultData = result.results;
        renderLevelingResults(result);
    } catch (e) {
        alert('计算失败: ' + e.message);
    }
}

function renderLevelingResults(result) {
    const tbody = document.getElementById('lv_result_body');
    tbody.innerHTML = '';
    result.results.forEach((r, i) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${r.back_station}</td>
            <td>${r.front_station}</td>
            <td>${r.back_reading.toFixed(3)}</td>
            <td>${r.front_reading.toFixed(3)}</td>
            <td style="color:${r.height_diff >= 0 ? '#198754' : '#dc3545'}">${r.height_diff >= 0 ? '+' : ''}${r.height_diff.toFixed(3)}</td>
            <td>${r.elevation.toFixed(3)}</td>
            <td>${r.accumulated_dist.toFixed(1)}</td>
        `;
    });

    // 闭合差
    const mc = result.misclosure;
    const div = document.getElementById('lv_misclosure');
    const status = mc.is_qualified ? '合格' : '不合格';
    const cls = mc.is_qualified ? 'misclosure-ok' : 'misclosure-fail';
    div.innerHTML = `
        <span class="${cls}">
            闭合差: ${mc.misclosure_mm >= 0 ? '+' : ''}${mc.misclosure_mm.toFixed(2)} mm
            (允许 ±${mc.allow_std_mm.toFixed(1)} mm)
            → ${status}
        </span>
        <br><small class="text-muted">总测站数: ${mc.station_count} | 总距离: ${mc.total_dist.toFixed(1)} m</small>
    `;
}

function clearLeveling() {
    for (let i = 0; i < 5; i++) {
        const row = document.getElementById('lv_obs_body').rows[i];
        if (row) {
            const inputs = row.querySelectorAll('input');
            inputs[1].value = '1.234';
            inputs[3].value = '0.987';
            inputs[4].value = '50';
        }
    }
    document.getElementById('lv_misclosure').innerHTML = '闭合差结果将显示在这里';
    document.getElementById('lv_result_body').innerHTML =
        '<tr><td colspan="8" class="text-center text-muted py-4">点击"计算"按钮查看结果</td></tr>';
}

function exportLevelingCSV() {
    if (levelingResultData.length === 0) { alert('没有可导出的数据！'); return; }
    const headers = ['测站','后视站','前视站','后视(m)','前视(m)','高差(m)','高程(m)','累计距(m)'];
    let csv = headers.join(',') + '\n';
    levelingResultData.forEach((r, i) => {
        csv += [(i+1), r.back_station, r.front_station,
                r.back_reading.toFixed(3), r.front_reading.toFixed(3),
                r.height_diff.toFixed(3), r.elevation.toFixed(3),
                r.accumulated_dist.toFixed(1)].join(',') + '\n';
    });
    downloadCSV(csv, '水准测量结果.csv');
}

// ==================== 单点坐标计算 ====================

function addSingleRow() {
    const tbody = document.getElementById('s_target_body');
    const idx = tbody.rows.length + 1;
    const row = tbody.insertRow();
    row.innerHTML = `
        <td><input type="text" class="form-control form-control-sm" value="点${idx}" style="width:80px"></td>
        <td><input type="number" class="form-control form-control-sm" value="0" step="0.0001"></td>
        <td><input type="number" class="form-control form-control-sm" value="90" step="0.0001"></td>
        <td><input type="number" class="form-control form-control-sm" value="50" step="0.001"></td>
        <td class="text-center"><button class="btn btn-sm btn-outline-danger py-0" onclick="this.closest('tr').remove()" title="删除"><i class="fas fa-times"></i></button></td>
    `;
}

async function calculateSingle() {
    const tbody = document.getElementById('s_target_body');
    const rows = tbody.rows;
    const data = {
        station_x: parseFloat(document.getElementById('s_st_x').value),
        station_y: parseFloat(document.getElementById('s_st_y').value),
        station_h: parseFloat(document.getElementById('s_st_h').value),
        azimuth: parseFloat(document.getElementById('s_st_az').value),
        instrument_h: parseFloat(document.getElementById('s_inst_h').value),
        target_h: parseFloat(document.getElementById('s_tgt_h').value),
    };
    const targets = [];
    for (let i = 0; i < rows.length; i++) {
        const inputs = rows[i].querySelectorAll('input');
        if (inputs[1].value || inputs[2].value || inputs[3].value) {
            targets.push({
                name: inputs[0].value,
                horizontal_angle: parseFloat(inputs[1].value) || 0,
                vertical_angle: parseFloat(inputs[2].value) || 0,
                slope_distance: parseFloat(inputs[3].value) || 0,
            });
        }
    }
    if (targets.length === 0) { alert('请至少输入一个目标点数据！'); return; }
    data.targets = targets;

    try {
        const resp = await fetch('/api/single', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const results = await resp.json();
        singleResultData = results;
        renderSingleResults(results);
    } catch (e) {
        alert('计算失败: ' + e.message);
    }
}

function renderSingleResults(results) {
    const tbody = document.getElementById('s_result_body');
    tbody.innerHTML = '';
    results.forEach(r => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><strong>${r.name}</strong></td>
            <td>${r.x.toFixed(3)}</td>
            <td>${r.y.toFixed(3)}</td>
            <td>${r.h.toFixed(3)}</td>
            <td>${r.distance.toFixed(3)}</td>
            <td style="color:${r.delta_h >= 0 ? '#198754' : '#dc3545'}">${r.delta_h >= 0 ? '+' : ''}${r.delta_h.toFixed(3)}</td>
            <td>${r.azimuth.toFixed(6)}</td>
            <td>${r.direction_angle}</td>
        `;
    });
}

function exportSingleCSV() {
    if (singleResultData.length === 0) { alert('没有可导出的数据！'); return; }
    const headers = ['目标点','X','Y','H','水平距(m)','高差(m)','方位角','象限角'];
    let csv = headers.join(',') + '\n';
    singleResultData.forEach(r => {
        csv += [r.name, r.x.toFixed(3), r.y.toFixed(3), r.h.toFixed(3),
                r.distance.toFixed(3), r.delta_h.toFixed(3),
                r.azimuth.toFixed(6), r.direction_angle].join(',') + '\n';
    });
    downloadCSV(csv, '单点坐标计算结果.csv');
}

// ==================== 通用：下载CSV ====================
function downloadCSV(csv, filename) {
    // 添加BOM头，让Excel正确打开中文
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}
