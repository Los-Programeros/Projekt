import { Landmark } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
