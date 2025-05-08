import { StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { mqttInit, sendMessage } from "@/lib/mqttService";
import { Button } from "@react-navigation/elements";
import { useEffect } from "react";

//tak tip sporočil pošivlaš za vsajga userja pol
let message = JSON.stringify({
  user: "60d21b4667d0d8992e610c85",
  userActivity: "60d21b5c67d0d8992e610c86",
  date: "2025-05-07T14:30:00.000Z",
  coordinates: "10.0,10.0",
  accelerometer: "0.02,9.81,0.15",
});

export default function TabTwoScreen() {
  useEffect(() => {
    mqttInit((msg) => {
      console.log("Got MQTT message:", msg);
    });
  }, []);

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
      <Button onPress={() => sendMessage(message)}>Send Message</Button>
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
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
});
