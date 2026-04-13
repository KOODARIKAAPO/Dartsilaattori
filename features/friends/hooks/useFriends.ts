
import { useEffect, useState } from "react";
import { getFriends, searchUsers, addFriend } from "../services/userService";
import { getAuth } from "@firebase/auth";
import { User } from "../services/userService";




export function useFriends() {
  const [friends, setFriends] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);


  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error("User not logged in");
    return {
      friends: [],
      searchResults: [],
      query: "",
      loading: false,
      setQuery: () => {},
      addFriend: () => {},
    };
  }

  // hae kaverit alussa
  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
  try {
    setLoading(true);

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.log("No user logged in");
      return;
    }

    const data = await getFriends();
    setFriends(data);

  } catch (error) {
    console.error("Error loading friends:", error);
  } finally {
    setLoading(false);
  }
};

  const handleSearch = async (text: string) => {
    setQuery(text);

    if (text.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    const results = await searchUsers(text);
    setSearchResults(results);
    setLoading(false);
  };

  const handleAddFriend = async (friend: User) => {
    try {
      await addFriend(friend.uid, friend.displayName);
      // Reload friends list
      await loadFriends();
      // Optionally, remove from search results or show success
    } catch (error) {
      console.error("Error adding friend:", error);
      // Handle error, perhaps show alert
    }
  };

  return {
    friends,
    searchResults,
    query,
    loading,
    setQuery: handleSearch,
    addFriend: handleAddFriend,
  };
}