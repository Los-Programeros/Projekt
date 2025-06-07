import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { Positions } from "@/constants/Positions";
import { useRunStore } from "@/store/useRunStore";
import { useUserStore } from "@/store/useUserStore";
import { UserActivity } from "@/types";
import { Button } from "@react-navigation/elements";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

export function LoggedInProfile() {
  const toastPosition: any = Positions.toastPosition;
  const { user, userActivity, setUserActivity } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    landmarksVisited: 0,
    totalKilometers: 0,
    uniqueLandmarks: 0,
  });
  const { landmarks } = useRunStore();

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const calculateStats = (activity: UserActivity) => {
    const landmarksVisited = activity.visited.length;
    const uniqueLandmarkIds = new Set(
      activity.visited.map((visit) => visit.landmark._id)
    );
    const uniqueLandmarks = uniqueLandmarkIds.size;

    let totalKilometers = 0;
    if (activity.visited.length > 1) {
      for (let i = 1; i < activity.visited.length; i++) {
        const prev = activity.visited[i - 1].landmark;
        const curr = activity.visited[i].landmark;

        if (!prev?.coordinates || !curr?.coordinates) {
          continue;
        }

        try {
          const [prevLat, prevLon] = prev.coordinates.split(",").map(Number);
          const [currLat, currLon] = curr.coordinates.split(",").map(Number);

          if (
            isNaN(prevLat) ||
            isNaN(prevLon) ||
            isNaN(currLat) ||
            isNaN(currLon)
          ) {
            continue;
          }

          totalKilometers += calculateDistance(
            prevLat,
            prevLon,
            currLat,
            currLon
          );
        } catch (error) {
          console.log("Error parsing coordinates:", error);
          continue;
        }
      }
    }

    setStats({
      landmarksVisited,
      totalKilometers: Math.round(totalKilometers * 100) / 100,
      uniqueLandmarks,
    });
  };

  const fetchUserActivity = async () => {
    if (!user) return;

    setLoading(true);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;

    try {
      const response = await fetch(`${apiUrl}/userActivities`, {
        method: "GET",
        credentials: "include",
      });

      console.log(response);

      if (response.ok) {
        const activity: UserActivity = await response.json();
        console.log("User activity fetched:", activity);
        setUserActivity(activity);
        calculateStats(activity);
      } else {
        const err = await response.json();
        throw new Error(err.message || "Failed to fetch user activity");
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to load stats",
        text2: err.message || "An error occurred",
        position: toastPosition,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !userActivity) {
      fetchUserActivity();
    } else if (
      userActivity &&
      userActivity.visited &&
      userActivity.visited.length > 0
    ) {
      calculateStats(userActivity);
    }
  }, [user, userActivity]);

  const getLandmarkName = (landmarkId: string): string | undefined => {
    return landmarks.find((lm) => lm._id === landmarkId)?.name;
  };

  const logout = async () => {
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

      <ThemedView style={styles.container}>
        <ThemedText type="subtitle">Your Running Stats</ThemedText>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <ThemedText style={styles.loadingText}>Loading stats...</ThemedText>
          </View>
        ) : (
          <ThemedView style={styles.statsContainer}>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statNumber}>
                {stats.landmarksVisited}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Visits</ThemedText>
            </ThemedView>

            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statNumber}>
                {stats.uniqueLandmarks}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Unique Landmarks</ThemedText>
            </ThemedView>

            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statNumber}>
                {stats.totalKilometers} km
              </ThemedText>
              <ThemedText style={styles.statLabel}>
                Distance Traveled
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {userActivity &&
          userActivity.visited &&
          userActivity.visited.length > 0 && (
            <ThemedView style={styles.recentSection}>
              <ThemedText type="subtitle">Recent Landmarks</ThemedText>
              {userActivity.visited.reverse().map((visit, index) => (
                <ThemedView
                  key={`${visit.landmark._id}-${index}`}
                  style={styles.recentItem}
                >
                  <ThemedText style={styles.landmarkName}>
                    {getLandmarkName(visit.landmark) || "Unknown Landmark"}
                  </ThemedText>
                  <ThemedText style={styles.visitDate}>
                    {new Date(visit.visitedAt).toLocaleDateString()}
                  </ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          )}

        <Button
          variant="filled"
          color={Colors.primary}
          style={styles.logoutButton}
          onPress={logout}
        >
          Logout
        </Button>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.primary + "15",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.8,
    textAlign: "center",
  },
  recentSection: {
    gap: 12,
  },
  recentItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.background + "05",
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  landmarkName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  landmarkCategory: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  visitDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  logoutButton: {
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
});
