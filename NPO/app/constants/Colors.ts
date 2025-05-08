/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  primary: "#FF6B35",
  primaryShade: "#F7C59F",
  seconard: "#004E89",
  secondaryShade: "#1A659E",
  error: "#FF3C35",
  success: "#35FF4D",
  light: {
    text: "#1a1a1a",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    primary: "#FF6B35",
  },
  dark: {
    text: "#fff",
    textShade: "#EDEDED",
    background: "#1a1a1a",
    tint: tintColorDark,
    icon: tintColorDark,
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    primary: "#FF6B35",
  },
};
