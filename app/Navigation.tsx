import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../features/home/HomeScreen";
import FriendsScreen from "../features/friends/FriendsScreen";
import StatsScreen from "../features/stats/StatsScreen";
import SelectGameScreen from "../features/games/screens/SelectGameScreen";
import X01Screen from "../features/games/screens/X01Screen";

const Stack = createNativeStackNavigator();

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
          name="X01" 
          component={X01Screen} 
          options={{ title: "X01" }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
