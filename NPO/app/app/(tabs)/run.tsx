import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { LandmarksList } from "@/components/ui/LandmarkList";
import React from "react";

export default function LandmarksListScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "transparent", dark: "transparent" }}
    >
      <ThemedText type="title" style={{ marginBottom: 16 }}>
        The Landmarks
      </ThemedText>
      <LandmarksList />
    </ParallaxScrollView>
  );
}
