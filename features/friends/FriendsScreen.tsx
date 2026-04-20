import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useAppTheme } from "../../ui/ThemeContext";
import { useFriends } from "./hooks/useFriends";
import type { MD3Theme } from "react-native-paper";

export default function FriendsScreen() {
  const { friends, searchResults, query, setQuery, loading, addFriend } = useFriends();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search users..."
        placeholderTextColor={theme.colors.onSurfaceVariant}
        value={query}
        onChangeText={setQuery}
      />

      {loading && <ActivityIndicator style={styles.loader} color={theme.colors.primary} />}

      {query.length >= 2 && (
        <>
          <Text style={styles.title}>Search Results</Text>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.uid}
            contentContainerStyle={searchResults.length === 0 ? styles.emptyState : undefined}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No users found.</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.searchItem}>
                <Text style={styles.item}>{item.displayName}</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => addFriend(item)}
                >
                  <Text style={styles.addButtonText}>Add Friend</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}

      <Text style={styles.title}>My Friends</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={friends.length === 0 ? styles.emptyState : undefined}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No friends added yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.friendRow}>
            <Text style={styles.item}>{item.displayName}</Text>
          </View>
        )}
      />
    </View>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.background,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      color: theme.colors.onSurface,
      padding: 10,
      borderRadius: 8,
      marginBottom: 12,
    },
    loader: {
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      marginVertical: 8,
      color: theme.colors.onBackground,
    },
    item: {
      flex: 1,
      color: theme.colors.onSurface,
      fontSize: 16,
    },
    friendRow: {
      paddingVertical: 12,
      paddingHorizontal: 10,
      marginBottom: 8,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    searchItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 10,
      marginBottom: 8,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      gap: 12,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    addButtonText: {
      color: theme.colors.onPrimary,
      fontWeight: "bold",
    },
    emptyState: {
      paddingVertical: 12,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      paddingVertical: 12,
    },
  });
