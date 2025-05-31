import { Colors } from "@/constants/Colors";
import { spacing } from "@/constants/Spacing";
import { useUserStore } from "@/store/useUserStore";
import { useRouter } from "expo-router";
import { Image, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { IconSymbol } from "./ui/IconSymbol";

export default function TopBar() {
  const user = useUserStore((state) => state.user);
  const isUserLoggedIn = Boolean(user);
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <Image
        source={require("../assets/images/HistoryRunLogo.png")}
        style={styles.logo}
      />
      {isUserLoggedIn ? (
        <TouchableOpacity>
          <IconSymbol size={28} name="person.fill" color={Colors.dark.icon} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <ThemedText type="link" style={{ color: "white", fontWeight: "800" }}>
            Log In
          </ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: spacing.appHorizontalPadding,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.dark.background,
    position: "relative",
    zIndex: 100,
  },
  logo: {
    width: 120,
    height: 30,
    resizeMode: "contain",
  },
});
