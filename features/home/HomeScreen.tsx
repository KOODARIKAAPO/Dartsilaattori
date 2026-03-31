import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, FlatList, Dimensions } from "react-native";
import { Button, Title, Text, Card, Avatar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../../types/NavigationType";
import { logout, subscribeToAuthChanges, auth } from "../../firebase/Auth";
import { getUserStats, getRecentAverages } from "../../firebase/Firestore";
import { User } from "firebase/auth";
import { useAppTheme } from "../../ui/ThemeContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useAppTheme();

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [averages, setAverages] = useState<any>(null);

  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Käyttäjä
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(setUser);
    return unsubscribe;
  }, []);

  // Stats data
  useEffect(() => {
    const fetchData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      try {
        const statsData = await getUserStats(uid);
        const averagesData = await getRecentAverages(uid);
        setStats(statsData);
        setAverages(averagesData);
      } catch (e) {
        console.log("Stats fetch error:", e);
      }
    };

    fetchData();
  }, []);

  // Automaattisesti pyorivä karuselli
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % 3;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  // Karusellissa pyörivä data
  const carouselData = [
    { title: "Premium", value: "Päivitä premiumiin ja avaa uusia ominaisuuksia 🚀" },
    { title: "Keskiarvo", value: averages ? averages.last10Avg.toFixed(2) : "Ladataan..." },
    { title: "Tikat", value: stats ? stats.totalDartsThrown.toString() : "Ladataan..." },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Title style={styles.title}>Dartsilaattori 🎯</Title>
      {user && <Text style={styles.email}>{user.displayName ?? user.email}</Text>}

      {/* Profiili- ja Karuselli-kortit vierekkäin */}
      <View style={styles.cardsRow}>
        {/* Profiilikortti */}
        <Card style={styles.profileCard} onPress={() => navigation.navigate("Profile")}>
          <Card.Content style={{ padding: 0 }}>
            <Avatar.Icon size={48} icon="account" style={styles.avatar} />
          </Card.Content>
        </Card>

        {/* Karuselli-kortti */}
        <Card style={styles.carouselCard}>
          <FlatList
            ref={flatListRef}
            data={carouselData}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.carouselItem}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardValue}>{item.value}</Text>
              </View>
            )}
          />
        </Card>
      </View>

      {/* Navigaatiopainikkeet omassa kortissa */}
      <Card style={styles.buttonsCard}>
        <Card.Content style={styles.buttonsContainer}>
          <Button mode="contained" style={styles.button} onPress={() => navigation.navigate("Friends")}>
            Kaverit
          </Button>
          <Button mode="contained" style={styles.button} onPress={() => navigation.navigate("Stats")}>
            Tilastot
          </Button>
          <Button mode="contained" style={styles.button} onPress={() => navigation.navigate("Settings")}>
            Asetukset
          </Button>
          <Button mode="contained" style={styles.button} onPress={() => navigation.navigate("SelectGame")}>
            Pelaa
          </Button>
          <Button mode="outlined" style={styles.logout} onPress={handleLogout}>
            Kirjaudu ulos
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  email: {
    textAlign: "center",
    marginBottom: 16,
    opacity: 0.6,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  profileCard: {
    flex: 1,
    marginRight: 8,
    borderRadius: 16,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  carouselCard: {
    flex: 1.5,
    marginLeft: 8,
    borderRadius: 16,
    height: 150,
  },
  cardContent: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  carouselItem: {
    width: (width - 48) * 0.6,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  cardTitle: {
    opacity: 0.6,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  avatar: {
    marginBottom: 8,
  },
  profileText: {
    fontSize: 16,
    fontWeight: "500",
  },
  buttonsCard: {
    borderRadius: 16,
    paddingVertical: 16,
  },
  buttonsContainer: {
    alignItems: "center",
  },
  button: {
    width: "90%",
    marginVertical: 6,
  },
  logout: {
    width: "90%",
    marginTop: 12,
  },
});