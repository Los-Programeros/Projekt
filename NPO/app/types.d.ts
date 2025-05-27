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
  user: User;
  date: string;
  visited: Landmark[];
};

export type MqttMessage = {
  user: User._id;
  date: string;
  userActivity?: UserActivity;
  coordinates: string;
  speed?: number | null;
};
