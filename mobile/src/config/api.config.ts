import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_SERVER_PORT = 5000;
const FALLBACK_LAN_IP = '10.237.222.252';

export const getDefaultApiBaseUrl = (): string => {
  // 1. Explicitly configured public env variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // 2. Derive host IP from Expo hostUri (reliable for Expo Go on physical devices)
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:${DEFAULT_SERVER_PORT}/api`;
    }
  }

  // 3. Platform specific defaults
  if (Platform.OS === 'android') {
    // Android emulator alias for host machine
    return `http://10.0.2.2:${DEFAULT_SERVER_PORT}/api`;
  }

  if (Platform.OS === 'web') {
    return `http://localhost:${DEFAULT_SERVER_PORT}/api`;
  }

  // 4. Physical device default fallback
  return `http://${FALLBACK_LAN_IP}:${DEFAULT_SERVER_PORT}/api`;
};

export const API_BASE_URL = getDefaultApiBaseUrl();
