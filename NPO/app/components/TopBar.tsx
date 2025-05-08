import { Colors } from "@/constants/Colors";
import { spacing } from "@/constants/Spacing";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "./ui/IconSymbol";

export default function TopBar() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/HistoryRunLogo.png")}
        style={styles.logo}
      />
      <TouchableOpacity>
        <IconSymbol size={28} name="bell.fill" color={Colors.dark.icon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: spacing.appHorizontalPadding,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  logo: {
    width: 120,
    height: 30,
    resizeMode: "contain",
  },
});
