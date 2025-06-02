import paho.mqtt.client as mqtt
import time
import requests
import json
import threading
from datetime import datetime, timedelta

node_endpoint = "http://node-container:3000/sensorData"
user_activity_endpoint = "http://node-container:3000/users/active"

user_activity = {}
activity_lock = threading.Lock()

INACTIVITY_THRESHOLD = 5
REQUEST_TIMEOUT = 10

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT broker")
    else:
        print(f"Connection failed with code {rc}")

def send_user_status(user_id, is_active):
    try:
        payload = {
            "userId": user_id,
            "active": is_active
        }
        
        response = requests.post(
            user_activity_endpoint, 
            headers={'Content-Type': 'application/json'}, 
            json=payload,
            timeout=REQUEST_TIMEOUT
        )
        
        status_text = "active" if is_active else "inactive"
        if response.status_code in [200, 201]:
            print(f"Successfully sent user {user_id} status: {status_text}")
            print(f"Response: {response.text}")
        else:
            print(f"Error sending user status: {response.status_code} - {response.text}")
            
    except requests.exceptions.Timeout:
        print(f"Timeout sending user status for {user_id}")
    except requests.exceptions.RequestException as e:
        print(f"Request error sending user status: {e}")
    except Exception as e:
        print(f"Error sending user status: {e}")

def update_user_activity(user_id):
    current_time = datetime.now()
    
    with activity_lock:
        if user_id not in user_activity:
            user_activity[user_id] = {
                'last_seen': current_time,
                'is_active': True
            }
            print(f"New user detected: {user_id} - marking as active")
            threading.Thread(target=send_user_status, args=(user_id, True), daemon=True).start()
            
        else:
            user_data = user_activity[user_id]
            user_data['last_seen'] = current_time
            
            if not user_data['is_active']:
                user_data['is_active'] = True
                print(f"User {user_id} is active again")
                threading.Thread(target=send_user_status, args=(user_id, True), daemon=True).start()

def check_inactive_users():
    current_time = datetime.now()
    threshold_time = current_time - timedelta(seconds=INACTIVITY_THRESHOLD)
    
    with activity_lock:
        inactive_users = []
        for user_id, user_data in user_activity.items():
            if user_data['is_active'] and user_data['last_seen'] < threshold_time:
                user_data['is_active'] = False
                inactive_users.append(user_id)
                print(f"User {user_id} marked as inactive (last seen: {user_data['last_seen']})")
        
        for user_id in inactive_users:
            threading.Thread(target=send_user_status, args=(user_id, False), daemon=True).start()

def activity_monitor():
    while True:
        try:
            check_inactive_users()
            time.sleep(1)
        except Exception as e:
            print(f"Error in activity monitor: {e}")
            time.sleep(1)

def process_sensor_data(message_dict):
    try:
        response = requests.post(
            node_endpoint, 
            headers={'Content-Type': 'application/json'}, 
            json=message_dict,
            timeout=REQUEST_TIMEOUT
        )
        
        print(f"Sensor data response: {response.status_code}")
        if response.status_code in [200, 201]:
            print("Successfully sent sensor data")
        else:
            print(f"Error sending sensor data: {response.status_code} - {response.text}")
            
    except requests.exceptions.Timeout:
        print("Timeout sending sensor data")
    except requests.exceptions.RequestException as e:
        print(f"Request error sending sensor data: {e}")
    except Exception as e:
        print(f"Error processing sensor data: {e}")

def on_message(client, userdata, msg):
    message = msg.payload.decode()
    print(f"{msg.topic}: {message}")
    
    try:
        message_dict = json.loads(message)
        
        user_id = message_dict.get('user')
        if user_id:
            update_user_activity(user_id)
        
        threading.Thread(target=process_sensor_data, args=(message_dict,), daemon=True).start()
            
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
    except Exception as e:
        print(f"Error processing message: {e}")

client = mqtt.Client(transport="websockets")

client.on_connect = on_connect
client.on_message = on_message

def connect_mqtt(broker, port, username=None, password=None):
    if username and password:
        client.username_pw_set(username, password)
    
    try:
        client.connect(broker, port)
        client.loop_start()
        return client
    except Exception as e:
        print(f"Failed to connect: {e}")
        return None

def subscribe(client, topic):
    client.subscribe(topic)
    print(f"Subscribed to {topic}")

if __name__ == "__main__":
    print("Starting MQTT client...")
    mqtt_client = connect_mqtt(broker="mosquitto-container", port=1883)
    
    if mqtt_client:
        print("MQTT client connected successfully")
        subscribe(mqtt_client, "#")
        print("Subscribed to all topics")
        
        monitor_thread = threading.Thread(target=activity_monitor, daemon=True)
        monitor_thread.start()
        print("Activity monitor started")
        
        try:
            print("Client is running. Press Ctrl+C to exit.")
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("Disconnecting...")
            mqtt_client.loop_stop()
            mqtt_client.disconnect()
    else:
        print("Failed to connect to MQTT broker")