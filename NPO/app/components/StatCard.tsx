import { Colors } from "@/constants/Colors";
import { useUserStore } from "@/store/useUserStore";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export function StatCard() {
  const { user, stats } = useUserStore();

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
              style={{ color: "white", fontWeight: "800", fontSize: 32 }}
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
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <ThemedText type="title" style={{ color: Colors.white, fontSize: 32 }}>
          Hi, {user.username}!
        </ThemedText>
        <ThemedText
          type="default"
          style={{
            color: Colors.white,
            marginTop: 8,
            fontSize: 16,
            fontWeight: "800",
          }}
        >
          Your progress:
        </ThemedText>
      </View>
      <View
        style={{
          flexDirection: "row",
          marginTop: 16,
          gap: 32,
          justifyContent: "space-between",
        }}
      >
        <View>
          <ThemedText type="default" style={{ fontWeight: 800 }}>
            Ran
          </ThemedText>
          <View
            style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}
          >
            <ThemedText
              type="default"
              style={{ fontSize: 32, fontWeight: 800, lineHeight: 32 }}
            >
              {stats.totalKilometers}
            </ThemedText>
            <ThemedText style={{ fontSize: 16, fontWeight: 800 }}>
              km
            </ThemedText>
          </View>
        </View>
        <View>
          <ThemedText type="default" style={{ fontWeight: 800 }}>
            Monuments count
          </ThemedText>
          <View
            style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}
          >
            <ThemedText
              type="default"
              style={{ fontSize: 32, fontWeight: 800, lineHeight: 32 }}
            >
              {stats.landmarksVisited}
            </ThemedText>
            <ThemedText style={{ fontSize: 16, fontWeight: "800" }}>
              sites
            </ThemedText>
          </View>
        </View>
      </View>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <ThemedText
            type="link"
            style={{
              color: "white",
              fontWeight: "800",
              textDecorationLine: "underline",
            }}
          >
            Your Profile
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card_container: {
    marginTop: 16,
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
