import { HelloWave } from "@/components/HelloWave";
import { LandmarkCard } from "@/components/LandmarkCard";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { mqttInit, sendMessage } from "@/lib/mqttService";
import { Button } from "@react-navigation/elements";
import { useEffect } from "react";

let message = JSON.stringify({
  user: "60d21b4667d0d8992e610c85",
  userActivity: "60d21b5c67d0d8992e610c86",
  date: "2025-05-07T14:30:00.000Z",
  coordinates: "10.0,10.0",
  accelerometer: "0.02,9.81,0.15",
});

export default function HomeScreen() {
  useEffect(() => {
    mqttInit((msg) => {
      console.log("Received MQTT message in HomeScreen:", msg);
    });
  }, []);
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "transparent", dark: "transparent" }}
      headerContent={<HelloWave />}
    >
      <ThemedView>
        <ThemedText type="title">The Monuments</ThemedText>
      </ThemedView>
      <ThemedView style={{ marginTop: 16 }}>
        <LandmarkCard
          title="Statue of Liberty"
          subtitle="New York, USA"
          onPress={() => {}}
        />
        <LandmarkCard
          title="Eiffel Tower"
          subtitle="Paris, France"
          onPress={() => {}}
        />
        <LandmarkCard
          title="Great Wall of China"
          subtitle="China"
          onPress={() => {}}
        />
        <LandmarkCard title="Machu Picchu" subtitle="Peru" onPress={() => {}} />
      </ThemedView>
      <Button onPress={() => sendMessage(message)}>Test senzor</Button>
    </ParallaxScrollView>
  );
}
