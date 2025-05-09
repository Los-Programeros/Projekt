import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

type Landmark = {
  _id: string;
  name: string;
  coordinates: string; // "lat,lon"
  category: string;
};

export default function MapScreen() {
  const { landmark } = useLocalSearchParams<{ landmark: string }>();
  const [dest, setDest] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loc, setLoc] = useState<Location.LocationObjectCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const [distanceM, setDistanceM] = useState(0);
  const [etaMin, setEtaMin] = useState(0);

  useEffect(() => {
    if (landmark) {
      const lm: Landmark = JSON.parse(landmark);
      const [lat, lon] = lm.coordinates.split(",").map(Number);
      setDest({ latitude: lat, longitude: lon });
    }
  }, [landmark]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({});
      setLoc(coords);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (loc && dest) {
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      // Haversine formula
      const R = 6371000; // meters
      const dLat = toRad(dest.latitude - loc.latitude);
      const dLon = toRad(dest.longitude - loc.longitude);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(loc.latitude)) *
          Math.cos(toRad(dest.latitude)) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;
      setDistanceM(dist);
      // Predpostavimo hitrost 10 km/h -> 2.78 m/s
      const speed = 2.78;
      setEtaMin(dist / speed / 60);
    }
  }, [loc, dest]);

  if (loading || !loc || !dest) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker coordinate={loc} title="Ti si tukaj" pinColor="blue" />
        <Marker coordinate={dest} title="Cilj" pinColor="green" />
        <Polyline coordinates={[loc, dest]} strokeWidth={4} strokeColor="red" />
      </MapView>
      <View style={styles.info}>
        <Text>Razdalja: {(distanceM / 1000).toFixed(2)} km</Text>
        <Text>Predviden čas: {etaMin.toFixed(1)} min</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  info: {
    position: "absolute",
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 12,
    borderRadius: 8,
  },
});
