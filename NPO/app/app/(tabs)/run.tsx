import { ActivityIndicator, StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { mqttInit } from "@/lib/mqttService";
import { Landmark, useRunStore } from "@/store/useRunStore";
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

export default function RunScreen() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const setLandmarks = useRunStore((state) => state.setLandmarks);
  const [loading, setLoading] = useState(false);

  const startRun = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/landmarks`);
      const data: Landmark[] = await res.json();
      setLandmarks(data);
      router.push("/map");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }

    useEffect(() => {
      mqttInit((msg) => {
        console.log("Got MQTT message:", msg);
      });
    }, []);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }
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
