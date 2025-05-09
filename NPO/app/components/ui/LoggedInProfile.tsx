import { useUserStore } from "@/store/useUserStore";
import ParallaxScrollView from "../ParallaxScrollView";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

//zdaj si v pravem: SCRUM-56-Uporabniški-profil - TODO

export function LoggedInProfile() {
  const { user } = useUserStore();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "transparent", dark: "transparent" }}
    >
      <ThemedText type="title">{`Hello, ${user?.username}`}</ThemedText>
      <ThemedView>
        <ThemedText type="subtitle">Stats</ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}
