import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { COLORS, SPACING, FONTS, SHADOWS, BORDER_RADIUS } from '../config/theme';

type RootStackParamList = {
  Chat: { receiverId: string; receiverName: string };
  Login: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat' | 'Login'>;

interface User {
  _id: string;
  username?: string;
  name?: string;
  email: string;
  lastMessage?: string;
  timestamp?: string;
}

const ChatListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkAuthAndFetchUsers();
  }, []);

  const checkAuthAndFetchUsers = async () => {
    try {
      // Check authentication
      const token = await AsyncStorage.getItem('userToken');
      const userDataStr = await AsyncStorage.getItem('userData');
      
      console.log('Stored token:', token);
      console.log('Stored user data:', userDataStr);

      if (!token || !userDataStr) {
        console.log('No auth token or user data found, redirecting to login');
        navigation.replace('Login');
        return;
      }

      // If we have auth, fetch users
      await fetchUsers();
    } catch (error) {
      console.error('Error in checkAuthAndFetchUsers:', error);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userDataStr = await AsyncStorage.getItem('userData');
      
      if (!token || !userDataStr) {
        throw new Error('Authentication data missing');
      }

      const userData = JSON.parse(userDataStr);
      console.log('Fetching users with token:', token);
      console.log('Current user:', userData);

      const response = await axios.get(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('Users API response:', response.data);
      
      // Filter out the current user and normalize the data
      const filteredUsers = response.data
        .filter((user: User) => user._id !== userData.id)
        .map((user: User) => ({
          _id: user._id,
          username: user.username || user.name || 'Unknown User', // Use name as fallback
          email: user.email,
          lastMessage: user.lastMessage || 'No messages yet',
          timestamp: user.timestamp || 'Just now'
        }));

      console.log('Filtered users:', filteredUsers);

      setUsers(filteredUsers);
      setFilteredUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (axios.isAxiosError(error)) {
        console.log('Axios error details:', {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers
        });
        
        if (error.response?.status === 401) {
          Alert.alert(
            'Session Expired',
            'Please login again.',
            [{ text: 'OK', onPress: () => navigation.replace('Login') }]
          );
        } else {
          Alert.alert(
            'Error',
            'Failed to fetch users. Please try again later.',
            [{ text: 'OK' }]
          );
        }
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const filtered = users.filter(user => {
      const searchText = text.toLowerCase();
      const username = user.username?.toLowerCase() || '';
      const email = user.email.toLowerCase();
      return username.includes(searchText) || email.includes(searchText);
    });
    setFilteredUsers(filtered);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUsers();
  };

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigation.navigate('Chat', { 
        receiverId: item._id, 
        receiverName: item.username || 'Unknown User'
      })}
    >
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {(item.username?.[0] || '?').toUpperCase()}
        </Text>
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
      </View>
      <FlatList
        data={filteredUsers}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary.main]}
            tintColor={COLORS.primary.main}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.default,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  listContainer: {
    paddingVertical: 8,
    paddingBottom: 80, // Add padding for logout button
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    marginLeft: 15,
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  email: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
});

export default ChatListScreen; 