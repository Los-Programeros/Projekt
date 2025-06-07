import { User, UserActivity } from "@/types";
import { create } from "zustand";

type Stats = {
  landmarksVisited: number;
  totalKilometers: number;
  uniqueLandmarks: number;
};

type UserStore = {
  user: User | null;
  userActivity: UserActivity | null;
  stats: Stats;
  setUser: (user: User) => void;
  setUserActivity: (activity: UserActivity) => void;
  clearUser: () => void;
};

function calculateStats(activity: UserActivity): Stats {
  const visited = activity.visited || [];
  const uniqueIds = new Set(visited.map((v) => v.landmark._id));

  let totalKm = 0;
  for (let i = 1; i < visited.length; i++) {
    const prev = visited[i - 1].landmark;
    const curr = visited[i].landmark;

    if (!prev?.coordinates || !curr?.coordinates) continue;

    try {
      const [lat1, lon1] = prev.coordinates.split(",").map(Number);
      const [lat2, lon2] = curr.coordinates.split(",").map(Number);

      if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) continue;

      const R = 6371;
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalKm += R * c;
    } catch (e) {
      console.error("Error calculating distance:", e);
    }
  }

  return {
    landmarksVisited: visited.length,
    totalKilometers: Math.round(totalKm * 100) / 100,
    uniqueLandmarks: uniqueIds.size,
  };
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  userActivity: null,
  stats: {
    landmarksVisited: 0,
    totalKilometers: 0,
    uniqueLandmarks: 0,
  },
  setUser: (user) => set({ user }),
  setUserActivity: (activity) =>
    set({
      userActivity: activity,
      stats: calculateStats(activity),
    }),
  clearUser: () =>
    set({
      user: null,
      userActivity: null,
      stats: {
        landmarksVisited: 0,
        totalKilometers: 0,
        uniqueLandmarks: 0,
      },
    }),
}));
