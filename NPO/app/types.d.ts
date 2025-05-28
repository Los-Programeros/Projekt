export type User = {
  _id: string;
  username: string;
  email: string;
};

export type Landmark = {
  _id: string;
  name: string;
  coordinates: string;
  category: string;
};

export type UserActivity = {
  _id: string;
  user: User;
  visited: {
    landmark: Landmark;
    visitedAt: string;
  }[];
};

export type MqttMessage = {
  user: User._id;
  date: string;
  userActivity?: UserActivity._id;
  coordinates: string;
  speed?: number | null;
};
