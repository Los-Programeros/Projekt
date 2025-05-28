import ParallaxScrollView from "@/components/ParallaxScrollView";
import { StatCard } from "@/components/StatCard";
import { ThemedText } from "@/components/ThemedText";
import { LandmarksList } from "@/components/ui/LandmarkList";

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "transparent", dark: "transparent" }}
      headerContent={<StatCard />}
    >
      <ThemedText type="title" style={{ marginBottom: 16 }}>
        The Landmarks
      </ThemedText>
      <LandmarksList />
    </ParallaxScrollView>
  );
}
