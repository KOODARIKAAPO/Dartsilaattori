import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Modal } from "react-native";
import { Button, Text, useTheme, ActivityIndicator, Surface } from "react-native-paper";
import { getFriends } from "../../friends/services/userService";
import { User } from "../../friends/services/userService";
import type { MD3Theme } from "react-native-paper";

interface FriendSelectionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelectFriend: (friend: User) => void;
}

export function FriendSelectionModal({
  visible,
  onDismiss,
  onSelectFriend,
}: FriendSelectionModalProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadFriends();
    }
  }, [visible]);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const data = await getFriends();
      setFriends(data);
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFriend = (friend: User) => {
    onSelectFriend(friend);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onDismiss}
      transparent
    >
      <View style={styles.container}>
        <Surface style={styles.content} elevation={4}>
          <View style={styles.header}>
            <Text variant="headlineSmall">Valitse kaveri</Text>
            <Button onPress={onDismiss}>Peruuta</Button>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator animating size="large" />
            </View>
          ) : friends.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text>Sinulla ei ole vielä kavereita</Text>
            </View>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => (
                <Button
                  mode="outlined"
                  onPress={() => handleSelectFriend(item)}
                  style={styles.friendButton}
                >
                  {item.displayName}
                </Button>
              )}
              scrollEnabled
              style={styles.friendsList}
            />
          )}
        </Surface>
      </View>
    </Modal>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    content: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.roundness * 2,
      borderTopRightRadius: theme.roundness * 2,
      paddingTop: 16,
      maxHeight: "80%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    friendsList: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      maxHeight: "100%",
    },
    friendButton: {
      marginVertical: 4,
      justifyContent: "flex-start",
    },
    loadingContainer: {
      height: 200,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyContainer: {
      height: 150,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 16,
    },
  });
