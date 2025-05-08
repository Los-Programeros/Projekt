import ParallaxScrollView from "../ParallaxScrollView";
import { ThemedText } from "../ThemedText";

export function LoggedInProfile() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "transparent", dark: "transparent" }}
    >
      <ThemedText>Profil</ThemedText>
    </ParallaxScrollView>
  );
}
