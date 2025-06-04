import paho.mqtt.client as mqtt

def test_mqtt_broker():
    broker = "server"
    port = 1883
    timeout = 10

    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("✅ Connected to MQTT Broker")
            client.connected_flag = True
        else:
            print(f"❌ Failed to connect, return code {rc}")
            client.connected_flag = False

    mqtt.Client.connected_flag = False
    client = mqtt.Client()

    client.on_connect = on_connect

    try:
        client.connect(broker, port, timeout)
        client.loop_start()

        import time
        for _ in range(5):
            if client.connected_flag:
                break
            time.sleep(1)

        assert client.connected_flag, "❌ Could not connect to MQTT broker"

        client.loop_stop()
        client.disconnect()
    except Exception as e:
        assert False, f"❌ MQTT connection test failed: {str(e)}"

if __name__ == "__main__":
    test_mqtt_broker()
