# Flask 后端 API 服务
import json
import math


def angle_normalize(angle):
    """角度归一化到 [0, 360)"""
    return angle % 360


def angle_subtract(a, b):
    """计算 a - b 的角度差"""
    return (a - b) % 360


def calculate_quadrant_angle(azimuth):
    """将方位角转换为象限角表示"""
    if azimuth == 0:
        return "N 0"
    elif azimuth < 90:
        return f"N{azimuth:.4f}E"
    elif azimuth == 90:
        return "E 90"
    elif azimuth < 180:
        return f"S{180 - azimuth:.4f}E"
    elif azimuth == 180:
        return "S 180"
    elif azimuth < 270:
        return f"S{azimuth - 180:.4f}W"
    elif azimuth == 270:
        return "W 90"
    else:
        return f"N{360 - azimuth:.4f}W"


def traverse_calc_from_data(start_name, start_x, start_y, start_h, start_az,
                            observed_angles, distances):
    """计算附合导线坐标"""
    results = []
    results.append({
        "name": start_name,
        "x": round(start_x, 4),
        "y": round(start_y, 4),
        "h": round(start_h, 4),
        "azimuth": start_az,
        "distance": 0,
        "delta_h": 0,
        "direction_angle": calculate_quadrant_angle(start_az),
    })

    cur_x, cur_y, cur_az = start_x, start_y, start_az
    for i, (ang, dist) in enumerate(zip(observed_angles, distances)):
        cur_az = angle_normalize(cur_az + 180 - ang)
        dx = dist * math.sin(math.radians(cur_az))
        dy = dist * math.cos(math.radians(cur_az))
        cur_x += dx
        cur_y += dy
        results.append({
            "name": f"测点{i+1}",
            "x": round(cur_x, 4),
            "y": round(cur_y, 4),
            "h": round(start_h, 4),
            "azimuth": round(cur_az, 6),
            "distance": round(dist, 3),
            "delta_h": 0,
            "direction_angle": calculate_quadrant_angle(cur_az),
        })
    return results


def calc_leveling(records, known_start):
    """计算水准测量"""
    results = []
    cum_dist = 0.0
    current_elev = known_start

    for rec in records:
        back_r = rec.get("back_reading", 0.0)
        front_r = rec.get("front_reading", 0.0)
        h_diff = back_r - front_r
        station_dist = rec.get("station_dist", 0.0)
        cum_dist += station_dist

        front_elev = current_elev + h_diff

        results.append({
            "back_station": rec.get("back_station", ""),
            "front_station": rec.get("front_station", ""),
            "back_reading": round(back_r, 3),
            "front_reading": round(front_r, 3),
            "height_diff": round(h_diff, 3),
            "elevation": round(front_elev, 3),
            "station_dist": round(station_dist, 3),
            "accumulated_dist": round(cum_dist, 3),
        })
        current_elev = front_elev

    return results


def calc_leveling_misclosure(records, known_start, known_end):
    """计算水准闭合差"""
    total_diff = 0.0
    total_dist = 0.0
    for rec in records:
        total_diff += rec.get("back_reading", 0.0) - rec.get("front_reading", 0.0)
        total_dist += rec.get("station_dist", 0.0)

    measured_diff = total_diff
    known_diff = known_end - known_start
    misclosure = measured_diff - known_diff

    n = len(records)
    allow_std = 12 * (n ** 0.5)

    return {
        "measured_diff": round(measured_diff, 3),
        "known_diff": round(known_diff, 3),
        "misclosure_mm": round(misclosure * 1000, 2),
        "allow_std_mm": round(allow_std, 2),
        "is_qualified": abs(misclosure * 1000) <= allow_std,
        "total_dist": round(total_dist, 3),
        "station_count": n,
    }


def single_target_calc(station_x, station_y, station_h, azimuth,
                       horizontal_angle, vertical_angle, slope_dist,
                       instrument_h=1.3, target_h=1.6):
    """计算单点坐标"""
    target_az = angle_normalize(azimuth + horizontal_angle)
    h_dist = slope_dist * math.sin(math.radians(vertical_angle))
    d_h = slope_dist * math.cos(math.radians(vertical_angle)) + instrument_h - target_h
    dx = h_dist * math.sin(math.radians(target_az))
    dy = h_dist * math.cos(math.radians(target_az))

    return {
        "x": round(station_x + dx, 4),
        "y": round(station_y + dy, 4),
        "h": round(station_h + d_h, 4),
        "distance": round(h_dist, 3),
        "delta_h": round(d_h, 4),
        "azimuth": round(target_az, 6),
        "direction_angle": calculate_quadrant_angle(target_az),
    }
