import React, {createContext, useState, useContext, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  signIn: (token: string, userData: User) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData(): Promise<void> {
    try {
      const storedToken = await AsyncStorage.getItem('@SecureChat:token');
      const storedUser = await AsyncStorage.getItem('@SecureChat:user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading storage data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(newToken: string, userData: User): Promise<void> {
    try {
      await AsyncStorage.setItem('@SecureChat:token', newToken);
      await AsyncStorage.setItem('@SecureChat:user', JSON.stringify(userData));
      
      setToken(newToken);
      setUser(userData);
      
      console.log('Auth data stored successfully:', { token: newToken, user: userData });
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  }

  async function signOut(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@SecureChat:token');
      await AsyncStorage.removeItem('@SecureChat:user');
      
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ token, user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext; 