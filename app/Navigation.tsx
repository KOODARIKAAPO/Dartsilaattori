import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { User } from "firebase/auth";

import { RootStackParamList } from "../types/NavigationType";

import HomeScreen from "../features/home/HomeScreen";
import ProfileScreen from "../features/profile/ProfileScreen";
import FriendsScreen from "../features/friends/FriendsScreen";
import StatsScreen from "../features/stats/StatsScreen";
import ProgressScreen from "../features/progress/ProgressScreen";
import GameHistoryScreen from "../features/stats/GameHistoryScreen";
import SelectGameScreen from "../features/games/screens/SelectGameScreen";
import Screen101 from "../features/games/screens/101Screen";
import X01SetupScreen from "../features/games/screens/X01SetupScreen";
import X01Screen from "../features/games/screens/X01Screen";
import CheckoutWarmupScreen from "../features/games/screens/CheckoutWarmupScreen";
import Bobs27Screen from "../features/games/screens/Bobs27Screen";
import { AroundTheClockScreen } from "../features/games/screens/AroundTheClockScreen";
import Cricket from "../features/games/components/Cricket";
import CricketSetupScreen from "../features/games/screens/CricketSetupScreen";
import SettingsScreen from "../features/settings/SettingsScreen";
import CricketResultScreen from "../features/games/screens/CricketResultScreen";
import { IconButton } from "react-native-paper";

import { subscribeToAuthChanges } from "../firebase/Auth";
import LoginScreen from "../features/auth/LoginScreen";
import RegisterScreen from "../features/auth/RegisterScreen";
import { useAppTheme } from "../ui/ThemeContext";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Home Stack Navigator
function HomeStack() {
  const { theme } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: "Koti",
          headerRight: () => (
            <IconButton
              icon="cog"
              size={24}
              iconColor={theme.colors.onPrimary}
              onPress={() => navigation.navigate("Settings")}
            />
          ),
        })}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profiili" }}
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
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Asetukset" }}
      />
    </Stack.Navigator>
  );
}

// Games Stack Navigator
function GamesStack() {
  const { theme } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
      }}
    >
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
        name="CheckoutWarmup"
        component={CheckoutWarmupScreen}
        options={{ title: "CheckoutWarmup" }}
      />
      <Stack.Screen
        name="Bobs27"
        component={Bobs27Screen}
        options={{ title: "Bob's 27" }}
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
  );
}

export default function Navigation() {
  const { theme } = useAppTheme();
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
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
        }}
      >
        {user ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={({ navigation }) => ({
                title: "Koti",
                headerRight: () => (
                  <IconButton
                    icon="cog"
                    size={24}
                    iconColor={theme.colors.onPrimary}
                    onPress={() => navigation.navigate("Settings")}
                  />
                ),
              })}
            />

            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: "Profiili" }}
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
              name="GameHistory"
              component={GameHistoryScreen}
              options={{ title: "Pelihistoria" }}
            />

            <Stack.Screen
              name="Progress"
              component={ProgressScreen}
              options={{ title: "Kehitys" }}
            />

            <Stack.Screen
              name="SelectGame"
              component={SelectGameScreen}
              options={{ title: "Valitse peli" }}
            />

            <Stack.Screen
              name="Screen101"
              component={Screen101}
              options={{ title: "101" }}
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
              name="AroundTheClock"
              component={AroundTheClockScreen}
              options={{ title: "Around The Clock" }}
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
          name="Bobs27"
          component={Bobs27Screen}
          options={{ title: "Bob's 27" }}
        />

        <Stack.Screen
          name="Cricket"
          component={Cricket}
          options={{ title: "Cricket" }}
        />

        <Stack.Screen
        name="CricketResult"
        component={CricketResultScreen}
        options={{ title: "Tulos" }}
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
