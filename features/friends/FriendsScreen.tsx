import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from "react-native";
import { useAppTheme } from "../../ui/ThemeContext";
import { useFriends } from "./hooks/useFriends";

export default function FriendsScreen() {
  const { friends, searchResults, query, setQuery, loading, addFriend } = useFriends();



  return (
    <View style={styles.container}>
      
      {/* 🔍 Haku */}
      <TextInput
        style={styles.input}
        placeholder="Search users..."
        value={query}
        onChangeText={setQuery}
      />

      {/* 🔍 Hakutulokset */}
      {query.length >= 2 && (
        <>
          <Text style={styles.title}>Search Results</Text>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.uid}
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

      {/* 👥 Kaverit */}
      <Text style={styles.title}>My Friends</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <Text style={styles.item}>{item.displayName}</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 8,
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  addButton: {
    backgroundColor: "#007bff",
    padding: 8,
    borderRadius: 4,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});