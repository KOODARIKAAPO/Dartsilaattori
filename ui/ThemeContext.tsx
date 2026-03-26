import React, { createContext, useContext, useState } from "react";
import { dartsTheme, lightTheme, darkTheme } from "./Theme";

export type ThemeType = "darts" | "light" | "dark";

type ThemeContextType = {
  theme: any;
  themeType: ThemeType;
  setThemeType: (type: ThemeType) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: dartsTheme,
  themeType: "darts",
  setThemeType: () => {},
});

type ThemeProviderProps = React.PropsWithChildren;

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const [themeType, setThemeType] = useState<ThemeType>("darts");

  const theme =
    themeType === "darts"
      ? dartsTheme
      : themeType === "light"
      ? lightTheme
      : darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, themeType, setThemeType }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);