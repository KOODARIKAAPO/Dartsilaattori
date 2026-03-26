import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { User } from "firebase/auth";

import { RootStackParamList } from "../types/NavigationType";

import HomeScreen from "../features/home/HomeScreen";
import FriendsScreen from "../features/friends/FriendsScreen";
import StatsScreen from "../features/stats/StatsScreen";
import SelectGameScreen from "../features/games/screens/SelectGameScreen";
import X01SetupScreen from "../features/games/screens/X01SetupScreen";
import X01Screen from "../features/games/screens/X01Screen";
import CheckoutWarmupScreen from "../features/games/screens/CheckoutWarmupScreen";
import Cricket from "../features/games/components/Cricket";
import CricketSetupScreen from "../features/games/screens/CricketSetupScreen";
import SettingsScreen from "../features/settings/SettingsScreen";
import LoginScreen from "../features/auth/LoginScreen";
import RegisterScreen from "../features/auth/RegisterScreen";

import { subscribeToAuthChanges } from "../firebase/Auth";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
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
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: "Kirjaudu" }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: "Rekisteröidy" }}
            />
          </>
        )}

        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: "Asetukset" }}
        />

        <Stack.Screen
          name="CheckoutWarmup"
          component={CheckoutWarmupScreen}
          options={{ title: "CheckoutWarmup" }}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
