import axios from 'axios';
import { Platform } from 'react-native';

// Function to get the appropriate base URL based on platform and environment
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    // Try multiple URLs for Android
    return [
      'http://192.168.35.229:5000',  // WiFi IP
      'http://172.30.176.1:5000',    // Alternative IP
      'http://10.0.2.2:5000',        // Android Emulator
      'http://localhost:5000',       // localhost
      'http://127.0.0.1:5000'        // loopback
    ];
  } else {
    return ['http://localhost:5000'];
  }
};

// Create API instance with configuration
const createApiInstance = (baseURL: string) => {
  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
  });
};

// Create API instances for each base URL
const apiInstances = getBaseUrl().map(createApiInstance);

// Function to try request with all API instances
const tryRequest = async (requestFn: (api: ReturnType<typeof createApiInstance>) => Promise<any>) => {
  let lastError;
  
  for (const api of apiInstances) {
    try {
      console.log('Trying URL:', api.defaults.baseURL);
      const result = await requestFn(api);
      console.log('Success with URL:', api.defaults.baseURL);
      return result;
    } catch (error) {
      console.log('Failed with URL:', api.defaults.baseURL, error);
      lastError = error;
      continue;
    }
  }
  
  // If all attempts failed, throw the last error
  throw lastError;
};

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await tryRequest(api => 
        api.post<AuthResponse>('/api/auth/register', data)
      );
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Registration failed');
      }
      throw new Error('Network error. Please check your connection and server status.');
    }
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await tryRequest(api => 
        api.post<AuthResponse>('/api/auth/login', data)
      );
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Login failed');
      }
      throw new Error('Network error. Please check your connection and server status.');
    }
  },
};

export default apiInstances[0]; 