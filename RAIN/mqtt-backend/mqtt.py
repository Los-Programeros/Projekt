import paho.mqtt.client as mqtt
import time
import requests
import json

api = "http://localhost:3000/sensorData"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT broker")
    else:
        print(f"Connection failed with code {rc}")

def on_message(client, userdata, msg):
    message = msg.payload.decode()
    print(f"{msg.topic}: {message}")
    try:
        message_dict = json.loads(message)
        response = requests.post(api, headers={'Content-Type': 'application/json'}, json=message_dict)
        print(response.status_code)
        if response.status_code == 200 or response.status_code == 201:
            print("Uspešno poslal")
        else:
            print(f"Napaka: {response.status_code} - {response.text}")
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
                

client = mqtt.Client()

client.on_connect = on_connect
client.on_message = on_message

def connect_mqtt(broker="localhost", port=1883, username=None, password=None):
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

    mqtt_client = connect_mqtt(broker="localhost", port=1883)
    
    if mqtt_client:

        subscribe(mqtt_client, "sensor_data")

        
        try:
            print("Client is running. Press Ctrl+C to exit.")
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("Disconnecting...")
            mqtt_client.loop_stop()
            mqtt_client.disconnect()