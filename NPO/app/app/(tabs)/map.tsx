import { ThemedView } from "@/components/ThemedView";
import { Landmark, useRunStore } from "@/store/useRunStore";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function MapScreen() {
  const landmarks = useRunStore((state) => state.landmarks);
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setLoading(false);
    })();
  }, []);

  if (loading || !location) {
    return (
      <ThemedView style={styles.loader}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}
    >
      <Marker coordinate={location} title="Tukaj si" pinColor="blue" />
      {landmarks.map((lm: Landmark) => {
        const [lat, lon] = lm.coordinates.split(",").map(Number);
        return (
          <Marker
            key={lm._id}
            coordinate={{ latitude: lat, longitude: lon }}
            title={lm.name}
            description={lm.category}
          />
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
