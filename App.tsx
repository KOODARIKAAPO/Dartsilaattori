import 'react-native-gesture-handler';
import React from 'react';
import { PaperProvider } from 'react-native-paper';
import Navigation from './app/Navigation';
import React from "react";
import { Provider as PaperProvider } from "react-native-paper";
import Navigation from "./app/Navigation";
import { ThemeProvider, useAppTheme } from "./ui/ThemeContext";

function AppContent() {
  const { theme } = useAppTheme();

  return (
    <PaperProvider>
      <Navigation />
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

