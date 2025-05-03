import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ChatListScreen from '../screens/ChatListScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ChatList" 
          component={ChatListScreen}
          options={{ 
            title: 'Chats',
            headerLeft: null,
            headerBackVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 