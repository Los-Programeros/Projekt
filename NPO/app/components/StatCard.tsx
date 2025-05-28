import { Colors } from "@/constants/Colors";
import { useUserStore } from "@/store/useUserStore";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export function StatCard() {
  const user = useUserStore((state) => state.user);

  console.log("StatCard user:", user);

  if (!user) {
    return (
      <ThemedView style={styles.card_container}>
        <LinearGradient
          colors={["#FF6B35", "#994020"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <TouchableOpacity onPress={() => router.push("/profile")}>
            <ThemedText
              type="link"
              style={{ color: "white", fontWeight: "600" }}
            >
              Log In
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.card_container}>
      <LinearGradient
        colors={["#FF6B35", "#994020"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ThemedText type="title" style={{ color: Colors.white }}>
        Welcome, {user.username}!
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card_container: {
    marginTop: 120,
    height: 210,
    borderColor: Colors.white,
    borderWidth: 1,
    width: "100%",
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    overflow: "hidden",
  },
});
