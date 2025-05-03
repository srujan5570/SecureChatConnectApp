import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChatListScreen = ({ navigation }) => {
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      navigation.replace('Login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Placeholder data for chat list
  const chats = [
    { id: '1', name: 'John Doe', lastMessage: 'Hello there!' },
    { id: '2', name: 'Jane Smith', lastMessage: 'How are you?' },
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.chatItem}>
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.lastMessage}>{item.lastMessage}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 10,
  },
  chatItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChatListScreen; 