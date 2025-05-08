import { StyleSheet } from "react-native";

import { HelloWave } from "@/components/HelloWave";
import { MonumentCard } from "@/components/MonumentCard";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "transparent", dark: "transparent" }}
      headerContent={<HelloWave />}
    >
      <ThemedView>
        <ThemedText type="title">The Monuments</ThemedText>
      </ThemedView>
      <ThemedView style={styles.monument_Card_Holder}>
        <MonumentCard
          imageUrl={require("@/assets/images/monuments/default.png")}
          monumentName="Main Square Of Maribor"
          monumentDescription="There is not much to see at the square. The buildings around it are much more interesting."
          monumentDistance={1.2}
          monumentRating={4.5}
        />
        <MonumentCard
          imageUrl={require("@/assets/images/monuments/default.png")}
          monumentName="Main Square Of Maribor"
          monumentDescription="There is not much to see at the square. The buildings around it are much more interesting."
          monumentDistance={1.2}
          monumentRating={4.5}
        />
        <MonumentCard
          imageUrl={require("@/assets/images/monuments/default.png")}
          monumentName="Main Square Of Maribor"
          monumentDescription="There is not much to see at the square. The buildings around it are much more interesting."
          monumentDistance={1.2}
          monumentRating={4.5}
        />
        <MonumentCard
          imageUrl={require("@/assets/images/monuments/default.png")}
          monumentName="Main Square Of Maribor"
          monumentDescription="There is not much to see at the square. The buildings around it are much more interesting."
          monumentDistance={1.2}
          monumentRating={4.5}
        />
        <MonumentCard
          imageUrl={require("@/assets/images/monuments/default.png")}
          monumentName="Main Square Of Maribor"
          monumentDescription="There is not much to see at the square. The buildings around it are much more interesting."
          monumentDistance={1.2}
          monumentRating={4.5}
        />
        <MonumentCard
          imageUrl={require("@/assets/images/monuments/default.png")}
          monumentName="Main Square Of Maribor"
          monumentDescription="There is not much to see at the square. The buildings around it are much more interesting."
          monumentDistance={1.2}
          monumentRating={4.5}
        />
        <MonumentCard
          imageUrl={require("@/assets/images/monuments/default.png")}
          monumentName="Main Square Of Maribor"
          monumentDescription="There is not much to see at the square. The buildings around it are much more interesting."
          monumentDistance={1.2}
          monumentRating={4.5}
        />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  monument_Card_Holder: {
    flexDirection: "column",
    marginTop: 16,
    gap: 16,
  },
});
