import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
}

// Overridden hardcoded test coordinates: Kolkata, India
const MOCK_LOCATION: LocationData = {
  latitude: 22.5744,
  longitude: 88.3629,
  accuracy: 5,
  timestamp: Date.now(),
  address: "Mock Test Coordinates (Kolkata, India)",
};

export async function requestLocationPermission(): Promise<boolean> {
  return true;
}

export async function getCurrentLocation(): Promise<LocationData> {
  console.log("[Location] Overridden hardcoded Mock location coordinates triggered: 22.5744, 88.3629");
  return { ...MOCK_LOCATION, timestamp: Date.now() };
}
