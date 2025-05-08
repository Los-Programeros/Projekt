import { Colors } from "@/constants/Colors";
import { Image, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

type Props = {
  monumentName: string;
  monumentDescription: string;
  monumentDistance?: number;
  monumentRating?: number;
  imageUrl: any;
};

export function MonumentCard({
  monumentName,
  monumentDescription,
  monumentDistance,
  monumentRating,
  imageUrl,
}: Props) {
  return (
    <ThemedView style={styles.card}>
      <Image source={imageUrl} style={styles.image} />
      <ThemedView style={styles.textContainer}>
        <ThemedView style={styles.textContainer_title_info}>
          <ThemedText type="subtitle">{monumentName}</ThemedText>
          <ThemedText
            style={{ color: Colors.dark.textShade }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {monumentDescription}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.textContainer_Rating_Distance}>
          <ThemedText type="default">
            Distance:
            <ThemedText type="defaultSemiBold">
              {" "}
              {monumentDistance} km
            </ThemedText>
          </ThemedText>
          <ThemedText type="default">
            Rating:
            <ThemedText type="defaultSemiBold">
              {" "}
              {monumentRating} / 5
            </ThemedText>
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    textAlign: "justify",
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 8,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
    flexDirection: "column",
    gap: 16,
    backgroundColor: "transparent",
  },
  textContainer_title_info: {
    flexDirection: "column",
    gap: 4,
    backgroundColor: "transparent",
    flexShrink: 1,
    flex: 1,
    overflow: "hidden",
  },
  textContainer_Rating_Distance: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "transparent",
  },
});
