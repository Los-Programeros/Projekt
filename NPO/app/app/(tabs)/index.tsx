import { HelloWave } from "@/components/HelloWave";
import { LandmarkCard } from "@/components/LandmarkCard";
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
    </ParallaxScrollView>
  );
}
