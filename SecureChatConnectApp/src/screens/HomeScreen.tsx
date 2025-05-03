import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONTS, SHADOWS, BORDER_RADIUS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types/navigation';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { signOut } = useAuth();

  const handleStartChatting = () => {
    navigation.navigate('ChatList');
  };

  const handleCallHistory = () => {
    navigation.navigate('CallLog');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SecureChat Connect</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleStartChatting}
        >
          <Text style={styles.buttonIcon}>💬</Text>
          <Text style={styles.buttonText}>Start Chatting</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleCallHistory}
        >
          <Text style={styles.buttonIcon}>📞</Text>
          <Text style={styles.buttonText}>Call History</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.tagline}>Secure • Private • Connected</Text>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.default,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? SPACING.xl : 0,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    color: COLORS.primary.contrast,
    fontFamily: FONTS.families.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  button: {
    backgroundColor: COLORS.primary.main,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  buttonIcon: {
    fontSize: FONTS.sizes.xl,
  },
  buttonText: {
    color: COLORS.primary.contrast,
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: '600',
  },
  tagline: {
    textAlign: 'center',
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.secondary,
    paddingBottom: SPACING.md,
  },
  logoutButton: {
    backgroundColor: COLORS.error.main,
    marginHorizontal: SPACING.xl,
    marginBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  logoutText: {
    color: COLORS.error.contrast,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: '600',
  },
});

export default HomeScreen;
