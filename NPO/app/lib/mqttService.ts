import AsyncStorage from "@react-native-async-storage/async-storage";
import { Client, Message } from "paho-mqtt";
import init from "react_native_mqtt";

let client: any;
let endopoint: string = "http://192.168.1.81";
let port: number = 3000;

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
  client = new Client(endopoint, port, "/mqtt", clientId);

  client.onConnectionLost = (res: any) => {
    console.log("Connection lost:", res.errorMessage);
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
