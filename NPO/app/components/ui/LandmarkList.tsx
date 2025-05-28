import { LandmarkCard } from "@/components/LandmarkCard";
import { Colors } from "@/constants/Colors";
import { useRunStore } from "@/store/useRunStore";
import { useUserStore } from "@/store/useUserStore";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  ToastAndroid,
} from "react-native";

export function LandmarksList() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const { landmarks, setLandmarks } = useRunStore();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (landmarks.length === 0) {
      fetch(`${apiUrl}/landmarks`)
        .then((res) => res.json())
        .then((data) => {
          setLandmarks(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [landmarks.length, setLandmarks]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <FlatList
      data={landmarks}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <LandmarkCard
          title={item.name}
          subtitle={item.category}
          onPress={async () => {
            const user = useUserStore.getState().user;

            if (!user) {
              if (Platform.OS === "android") {
                ToastAndroid.show("Please login first", ToastAndroid.SHORT);
              } else {
                Alert.alert("Login required", "Please login first");
              }
              return;
            }

            try {
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/userActivities`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    userId: user._id,
                    visited: item._id,
                  }),
                }
              );

              const createdActivity = await response.json();

              useUserStore.getState().setUserActivity({
                ...createdActivity,
                user,
              });

              router.push({
                pathname: "/map",
                params: { landmark: JSON.stringify(item) },
              });
            } catch (err) {
              console.error("Failed to create activity", err);
            }
          }}
        />
      )}
    />
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
