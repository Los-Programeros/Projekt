import { Colors } from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
type Props = {
  title: string;
  subtitle: string;
  onPress: () => void;
  imageUrl?: any;
};

export function LandmarkCard({ title, subtitle, onPress, imageUrl }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <LinearGradient
        colors={["#FF6B35", "#994020"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* <Image
        source={
          imageUrl ? imageUrl : require("@/assets/images/monuments/default.png")
        }
        style={styles.image}
      /> */}
      <ThemedView style={styles.textContainer}>
        <ThemedText type="subtitle">{title}</ThemedText>
        <ThemedText
          style={styles.subtitle}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {subtitle}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    borderColor: Colors.white,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    borderColor: Colors.white,
    borderWidth: 1,
  },
  textContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  subtitle: {
    color: Colors.dark.textShade,
    fontSize: 12,
    marginTop: 4,
  },
});
