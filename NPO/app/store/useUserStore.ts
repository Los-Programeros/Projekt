import { User, UserActivity } from "@/types";
import { create } from "zustand";

type UserStore = {
  user: User | null;
  userActivity: UserActivity | null;
  setUser: (user: User) => void;
  setUserActivity: (activity: UserActivity) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  userActivity: null,
  setUser: (user) => set({ user }),
  setUserActivity: (activity) => set({ userActivity: activity }),
  clearUser: () => set({ user: null, userActivity: null }),
}));
