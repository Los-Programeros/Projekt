import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

//Populiraš za enga userja ko dobiš prek useUserStore pa daš id v user
let message = JSON.stringify({
  user: "60d21b4667d0d8992e610c85",
  userActivity: "60d21b5c67d0d8992e610c86",
  date: "2025-05-07T14:30:00.000Z",
  coordinates: "10.0,10.0",
  accelerometer: "0.02,9.81,0.15",
});

export type Landmark = {
  _id: string;
  name: string;
  coordinates: string; // "lat,lon"
  category: string;
};

interface RunState {
  landmarks: Landmark[];
  setLandmarks: (data: Landmark[]) => void;
  clearLandmarks: () => void;
}

export const useRunStore = create<RunState>()(
  persist(
    (set) => ({
      landmarks: [],
      setLandmarks: (data) => set({ landmarks: data }),
      clearLandmarks: () => set({ landmarks: [] }),
    }),
    {
      name: "run-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
