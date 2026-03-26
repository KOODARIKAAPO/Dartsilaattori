import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/NavigationType";
import HomeScreen from "../features/home/HomeScreen";
import FriendsScreen from "../features/friends/FriendsScreen";
import StatsScreen from "../features/stats/StatsScreen";
import SelectGameScreen from "../features/games/screens/SelectGameScreen";
import X01SetupScreen from "../features/games/screens/X01SetupScreen";
import X01Screen from "../features/games/screens/X01Screen";
import Cricket from "../features/games/components/Cricket";
import CricketSetupScreen from "../features/games/screens/CricketSetupScreen";
import SettingsScreen from "../features/settings/SettingsScreen";


const Stack = createNativeStackNavigator<RootStackParamList>()

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator>

        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: "Koti" }}
        />

        <Stack.Screen 
          name="Friends" 
          component={FriendsScreen} 
          options={{ title: "Kaverit" }}
        />

        <Stack.Screen 
          name="Stats" 
          component={StatsScreen} 
          options={{ title: "Tilastot" }}
        />

        <Stack.Screen 
          name="SelectGame" 
          component={SelectGameScreen} 
          options={{ title: "Valitse peli" }}
        />

        <Stack.Screen 
          name="X01Setup" 
          component={X01SetupScreen} 
          options={{ title: "X01 asetukset" }}
        />

        <Stack.Screen 
          name="X01" 
          component={X01Screen} 
          options={{ title: "X01" }}
        />

        <Stack.Screen 
          name="Cricket" 
          component={Cricket} 
          options={{ title: "Cricket" }}
        />

        <Stack.Screen 
          name="CricketSetup" 
          component={CricketSetupScreen} 
          options={{ title: "Cricket asetukset" }}
        />

        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: "Asetukset" }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
