import { LandmarkCard } from "@/components/LandmarkCard";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Colors } from "@/constants/Colors";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet } from "react-native";

type Landmark = {
  _id: string;
  name: string;
  coordinates: string; // "lat,lon"
  category: string;
};

export default function LandmarksListScreen() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`${apiUrl}/landmarks`)
      .then((res) => res.json())
      .then((data) => setLandmarks(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <>
      <ParallaxScrollView
        headerBackgroundColor={{ light: "transparent", dark: "transparent" }}
      ></ParallaxScrollView>
      <FlatList
        data={landmarks}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <LandmarkCard
            title={item.name}
            subtitle={item.category}
            onPress={() =>
              router.push({
                pathname: "/map",
                params: { landmark: JSON.stringify(item) },
              })
            }
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  name: { fontSize: 16, fontWeight: "bold", color: "white" },
  cat: { fontSize: 12, color: "white", marginTop: 4 },
});
