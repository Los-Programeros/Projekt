import { ActivityIndicator, StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { mqttInit } from "@/lib/mqttService";
import { Button } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

//tak tip sporočil pošivlaš za vsajga userja pol //pokliči userStore.ts isto ko v profile.tsx pa AuthForm.tsx - user je kr userId
let message = JSON.stringify({
  user: "60d21b4667d0d8992e610c85",
  userActivity: "60d21b5c67d0d8992e610c86",
  date: "2025-05-07T14:30:00.000Z",
  coordinates: "10.0,10.0",
  accelerometer: "0.02,9.81,0.15",
});

export default function TabTwoScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const startRun = async () => {
    setLoading(true);
    try {
      // 1. Pridobi vse landmarke
      const res = await fetch("http://<tvoj-backend>/landmarks");
      const landmarks = await res.json(); // [{name, coordinates, category}, ...]

      // 2. Shrani v globalni store ali pa pošlji kot param
      //    tukaj pošljemo kot param JSON.stringify
      router.push({
        pathname: "/map",
        params: { markers: JSON.stringify(landmarks) },
      });
    } catch (err) {
      console.error(err);
      // prikaži toast/error - TODO
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    mqttInit((msg) => {
      console.log("Got MQTT message:", msg);
    });
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "transparent", dark: "transparent" }}
    >
      {loading ? (
        <ThemedView style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" />
        </ThemedView>
      ) : (
        <Button variant="filled" color={Colors.primary} onPress={startRun}>
          Start Run
        </Button>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
});
