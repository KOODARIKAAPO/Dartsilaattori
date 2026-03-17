import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import GameScreen from './features/games/screens/GameScreen';

export default function App() {
  return (
    <>
      <GameScreen />
      <StatusBar style="auto" />
    </>
  );
}
