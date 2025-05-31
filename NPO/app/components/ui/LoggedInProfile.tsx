import { Colors } from "@/constants/Colors";
import { Positions } from "@/constants/Positions";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "@react-navigation/elements";
import Toast from "react-native-toast-message";
import ParallaxScrollView from "../ParallaxScrollView";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

//zdaj si v pravem: SCRUM-56-Uporabniški-profil - TODO

export function LoggedInProfile() {
  const toastPosition: any = Positions.toastPosition;
  const { user } = useUserStore();

  let logout = async () => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;

    try {
      const response = await fetch(`${apiUrl}/users/logout`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        useUserStore.getState().clearUser();
        Toast.show({
          type: "success",
          text1: "Logged out successfully",
          position: toastPosition,
        });
      } else {
        const err = await response.json();
        throw new Error(err.message || "Logout failed");
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Logout failed",
        text2: err.message || "An error occurred",
        position: toastPosition,
      });
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "transparent", dark: "transparent" }}
    >
      <ThemedText type="title">{`Hello, ${user?.username}`}</ThemedText>
      <ThemedView style={{ gap: 16 }}>
        <ThemedText type="subtitle">Stats</ThemedText>
        <Button
          variant="filled"
          color={Colors.primary}
          style={{ borderRadius: 16, paddingVertical: 16 }}
          onPress={logout}
        >
          Logout
        </Button>
      </ThemedView>
    </ParallaxScrollView>
  );
}
