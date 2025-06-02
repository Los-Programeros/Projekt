import paho.mqtt.client as mqtt
import time
import requests
import json
import threading
from datetime import datetime, timedelta

node_url = "http://node-container:3000"
sensor_data_endpoint = f"{node_url}/sensorData"
user_activity_endpoint = f"{node_url}/users/active"

user_activity = {}
activity_lock = threading.Lock()

INACTIVITY_THRESHOLD = 5

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
            json=payload
        )
        
        status_text = "active" if is_active else "inactive"
        if response.status_code in [200, 201]:
            print(f"Successfully sent user {user_id} status: {status_text}")
        else:
            print(f"Error sending user status: {response.status_code} - {response.text}")
            
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
            send_user_status(user_id, True)
            print(f"New user detected: {user_id} - marked as active")
            
        else:
            user_data = user_activity[user_id]
            user_data['last_seen'] = current_time
            
            if not user_data['is_active']:
                user_data['is_active'] = True
                send_user_status(user_id, True)
                print(f"User {user_id} is active again")

def check_inactive_users():
    current_time = datetime.now()
    threshold_time = current_time - timedelta(seconds=INACTIVITY_THRESHOLD)
    
    with activity_lock:
        for user_id, user_data in user_activity.items():
            if user_data['is_active'] and user_data['last_seen'] < threshold_time:
                user_data['is_active'] = False
                send_user_status(user_id, False)
                print(f"User {user_id} marked as inactive (last seen: {user_data['last_seen']})")

def activity_monitor():
    while True:
        try:
            check_inactive_users()
            time.sleep(1)
        except Exception as e:
            print(f"Error in activity monitor: {e}")
            time.sleep(1)

def on_message(client, userdata, msg):
    message = msg.payload.decode()
    print(f"{msg.topic}: {message}")
    
    try:
        message_dict = json.loads(message)
        
        user_id = message_dict.get('user')
        if user_id:
            update_user_activity(user_id)
        
        response = requests.post(
            sensor_data_endpoint, 
            headers={'Content-Type': 'application/json'}, 
            json=message_dict
        )
        
        print(response.status_code)
        if response.status_code == 200 or response.status_code == 201:
            print("Uspešno poslal sensor data")
        else:
            print(f"Napaka pri pošiljanju sensor data: {response.status_code} - {response.text}")
            
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
    mqtt_client = connect_mqtt(broker="mosquitto-container", port=1883)
    
    if mqtt_client:
        subscribe(mqtt_client, "#")
        
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