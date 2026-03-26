import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

export const dartsTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,

    // Darts päävärit
    primary: "rgb(0, 128, 0)", // vihreä
    onPrimary: "rgb(255, 255, 255)",
    primaryContainer: "rgb(0, 80, 0)",
    onPrimaryContainer: "rgb(200, 255, 200)",

    secondary: "rgb(180, 0, 0)", // punainen
    onSecondary: "rgb(255, 255, 255)",
    secondaryContainer: "rgb(100, 0, 0)",
    onSecondaryContainer: "rgb(255, 200, 200)",

    tertiary: "rgb(240, 240, 240)", // valkoinen segmentti
    onTertiary: "rgb(0, 0, 0)",
    tertiaryContainer: "rgb(200, 200, 200)",
    onTertiaryContainer: "rgb(0, 0, 0)",

    error: "rgb(255, 80, 80)",
    onError: "rgb(0, 0, 0)",
    errorContainer: "rgb(140, 0, 0)",
    onErrorContainer: "rgb(255, 200, 200)",

    // Tausta
    background: "rgb(10, 10, 10)",
    onBackground: "rgb(255, 255, 255)",

    surface: "rgb(20, 20, 20)",
    onSurface: "rgb(255, 255, 255)",

    surfaceVariant: "rgb(40, 40, 40)",
    onSurfaceVariant: "rgb(200, 200, 200)",

    outline: "rgb(120, 120, 120)",
    outlineVariant: "rgb(80, 80, 80)",

    shadow: "rgb(0, 0, 0)",
    scrim: "rgb(0, 0, 0)",

    inverseSurface: "rgb(230, 230, 230)",
    inverseOnSurface: "rgb(20, 20, 20)",
    inversePrimary: "rgb(0, 200, 0)",

    elevation: {
      level0: "transparent",
      level1: "rgb(25, 25, 25)",
      level2: "rgb(30, 30, 30)",
      level3: "rgb(35, 35, 35)",
      level4: "rgb(40, 40, 40)",
      level5: "rgb(45, 45, 45)",
    },

    surfaceDisabled: "rgba(255, 255, 255, 0.12)",
    onSurfaceDisabled: "rgba(255, 255, 255, 0.38)",
    backdrop: "rgba(0, 0, 0, 0.5)",
  },
};


// Light
export const lightTheme = {
  ...MD3LightTheme,
};

// Dark
export const darkTheme = {
  ...MD3DarkTheme,
};