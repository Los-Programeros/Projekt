import AsyncStorage from "@react-native-async-storage/async-storage";
import { Client, Message } from "paho-mqtt";
import init from "react_native_mqtt";

let client: any;
let mqttendopoint: string = process.env.EXPO_PUBLIC_MQTT_BROKER_URL || "server";
let port: number = 1883;

export const mqttInit = (onMessage: (msg: any) => void) => {
  init({
    size: 10000,
    storageBackend: AsyncStorage,
    defaultExpires: 1000 * 3600 * 24,
    enableCache: true,
    reconnect: true,
    sync: {},
  });

  const clientId = "id_" + parseInt(String(Math.random() * 100000));
  client = new Client("server", 1883, "/mqtt");

  client.onConnectionLost = (res: any) => {
    console.log("Connection lost:", res.errorMessage, clientId);
  };

  client.onMessageArrived = (message: any) => {
    console.log("Message received:", message.payloadString);
    onMessage(message.payloadString);
  };

  client.connect({
    onSuccess: () => {
      console.log("Connected to MQTT broker");
      client.subscribe("historyrun/topic", { qos: 0 });
    },
    onFailure: (err: any) => {
      console.log("Failed to connect:", err);
    },
    useSSL: false,
  });
};

export const sendMessage = (messageText: string) => {
  const message = new Message(messageText);
  message.destinationName = "historyrun/topic";
  client.send(message);
};
