#!/usr/bin/env python3

import socket
import json
import datetime
import threading
import sys
import time
import math
import urllib.request
import urllib.error
import pyqtgraph as pg
from pyqtgraph.Qt import QtCore
import numpy as np

# Konfiguracija
HOST = '0.0.0.0'  # Poslušaj na vseh vmesnikih
PORT = 8080
BACKEND_URL = "http://server:3000"

packet_count = 0
last_data = None
is_active = False
current_activity_id = None
last_packet_ts = 0
current_speed = 0.0

USER_ID = None

MAX_POINTS = 500
x_data = np.zeros(MAX_POINTS)
y_data = np.zeros(MAX_POINTS)
z_data = np.zeros(MAX_POINTS)
data_lock = threading.Lock()

def get_api_data(endpoint):
    try:
        with urllib.request.urlopen(f"{BACKEND_URL}/{endpoint}") as response:
            if response.status == 200:
                return json.loads(response.read().decode())
    except Exception as e:
        print(f"Napaka pri pridobivanju {endpoint}: {e}")
    return []

def post_api_data(endpoint, data):
    try:
        req = urllib.request.Request(f"{BACKEND_URL}/{endpoint}")
        req.add_header('Content-Type', 'application/json; charset=utf-8')
        jsondata = json.dumps(data).encode('utf-8')
        req.add_header('Content-Length', len(jsondata))
        with urllib.request.urlopen(req, jsondata) as response:
            if response.status >= 200 and response.status < 300:
                 return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"HTTP Napaka pri pošiljanju na {endpoint}: {e.code} {e.reason}")
        try:
             print(e.read().decode())
        except: pass
    except Exception as e:
        print(f"Napaka pri pošiljanju na {endpoint}: {e}")
        return None

def init_ids():
    global USER_ID
    
    users = get_api_data("users")
    stm_username = "stm_device"
    
    found_user = None
    if users:
        for u in users:
            if u.get('username') == stm_username:
                found_user = u
                break
    
    if found_user:
        USER_ID = found_user['_id']
    else:
        new_user = {
            "username": stm_username,
            "email": "stm@device.com",
            "password": "secure_stm_password" 
        }
        created_user = post_api_data("users", new_user)
        if created_user and '_id' in created_user:
            USER_ID = created_user['_id']
            print(f"Uspešno ustvarjen uporabnik: {stm_username} (ID: {USER_ID})")

def start_activity():
    global is_active, current_activity_id, current_speed
    
    if not USER_ID:
        return

    print("Začenjam novo aktivnost...")
    data = {
        "userId": USER_ID
    } 

    resp = post_api_data("userActivities", data)
    if resp and '_id' in resp:
        current_activity_id = resp['_id']
        is_active = True
        current_speed = 0.0
        print(f"Aktivnost začeta: {current_activity_id}")
        post_api_data("users/active", {"userId": USER_ID, "active": True})
    else:
        print("Napaka pri ustvarjanju aktivnosti")

def stop_activity():
    global is_active, current_activity_id
    if is_active:
        print(f"Ustavljam aktivnost {current_activity_id}")
        is_active = False
        current_activity_id = None
        current_speed = 0.0
        post_api_data("users/active", {"userId": USER_ID, "active": False})

def process_sensor_data(sensor_json):
    global current_speed, last_packet_ts, is_active
    global x_data, y_data, z_data

    now = time.time()
    
    if not is_active:
        start_activity()
        last_packet_ts = now 
        return

    try:
        x = float(sensor_json.get('x', 0))
        y = float(sensor_json.get('y', 0))
        z = float(sensor_json.get('z', 0))
        
        with data_lock:
            x_data = np.roll(x_data, -1)
            x_data[-1] = x
            y_data = np.roll(y_data, -1)
            y_data[-1] = y
            z_data = np.roll(z_data, -1)
            z_data[-1] = z
        
        dt = now - last_packet_ts
        if dt > 1.0: dt = 0.0
        
        acc_mag = math.sqrt(x*x + y*y + z*z)
        acc_move = abs(acc_mag - 1.0)
        
        if acc_move < 0.05: acc_move = 0
        
        current_speed += acc_move * 9.81 * dt
            
    except Exception as e:
        print(f"Napaka pri izračunu hitrosti: {e}")
    
    last_packet_ts = now

    global last_sent_ts
    if 'last_sent_ts' not in globals():
        last_sent_ts = 0
        
    if is_active and current_activity_id:
        if now - last_sent_ts >= 2.0:
            payload = {
                "user": USER_ID,
                "userActivity": current_activity_id,
                "date": datetime.datetime.now().isoformat(),
                "coordinates": "0, 0, 0", 
                "speed": str(current_speed)
            }
            threading.Thread(target=post_api_data, args=("sensorData", payload)).start()
            last_sent_ts = now

def handle_client(conn, addr):
    global packet_count, last_data
    try:
        data = conn.recv(1024)
        if data:
            try:
                message = data.decode('utf-8').strip()
                try:
                    json_data = json.loads(message)
                    last_data = json_data
                    process_sensor_data(json_data)
                except json.JSONDecodeError:
                    last_data = message
                
                packet_count += 1
            except UnicodeDecodeError:
                pass
    except Exception as e:
        print(f"Napaka pri obravnavi povezave: {e}")
    finally:
        conn.close()

def server_status_thread():
    while True:
        time.sleep(1)
        if is_active and (time.time() - last_packet_ts > 3.0):
            print("\nUstavljam aktivnost")
            stop_activity()

def run_tcp_server():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server_socket:
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            server_socket.bind((HOST, PORT))
            server_socket.listen(5)
            server_socket.settimeout(1.0)
            print(f"[{datetime.datetime.now()}] Strežnik posluša na {HOST}:{PORT}")
            
            while True:
                try:
                    conn, addr = server_socket.accept()
                    threading.Thread(target=handle_client, args=(conn, addr)).start()
                except socket.timeout:
                    continue
                except OSError as e:
                    print(f"Socket error: {e}")
                    break
        except Exception as e:
            print(f"Napaka TCP strežnika: {e}")

def main():
    global USER_ID
    
    try:
        init_ids()
    except Exception as e:
        print(f"Napaka pri inicializaciji: {e}")

    threading.Thread(target=server_status_thread, daemon=True).start()
    
    tcp_thread = threading.Thread(target=run_tcp_server, daemon=True)
    tcp_thread.start()

    app = pg.mkQApp()
    win = pg.GraphicsLayoutWidget(title="STM32 pospešek")
    win.resize(1200, 600)
    
    plot = win.addPlot(title="Pospešek")
    plot.setYRange(-2.0, 2.0)
    plot.setLabel('left', 'Pospešek', units='g')
    plot.setLabel('bottom', 'Vzorci')
    plot.showGrid(x=True, y=True)
    plot.addLegend()
    
    curve_x = plot.plot(pen='r', name='X os')
    curve_y = plot.plot(pen='g', name='Y os')
    curve_z = plot.plot(pen='b', name='Z os')
    
    def update_plot():
        with data_lock:
            curve_x.setData(x_data)
            curve_y.setData(y_data)
            curve_z.setData(z_data)
            
    timer = QtCore.QTimer()
    timer.timeout.connect(update_plot)
    timer.start(50)
    
    win.show()
    
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()