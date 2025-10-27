import { GeoPoint } from 'firebase/firestore';

export interface LocationInfo {
  coordinates: GeoPoint;
  placeName: string;
  city?: string;
  state?: string;
  country?: string;
}

export const geocodingService = {
  // Convert coordinates to place name using reverse geocoding
  async getPlaceNameFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }
      
      const data = await response.json();
      
      // Build a readable place name
      const parts = [];
      if (data.city) parts.push(data.city);
      if (data.principalSubdivision) parts.push(data.principalSubdivision);
      if (data.countryName) parts.push(data.countryName);
      
      return parts.join(', ') || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
    } catch (error) {
      console.error('Error getting place name:', error);
      // Fallback to coordinates if geocoding fails
      return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
    }
  },

  // Convert place name to coordinates using forward geocoding
  async getCoordinatesFromPlaceName(placeName: string): Promise<GeoPoint> {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/forward-geocode-client?query=${encodeURIComponent(placeName)}&localityLanguage=en`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch coordinates');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return new GeoPoint(result.latitude, result.longitude);
      } else {
        throw new Error('No results found for the given place name');
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
      // Fallback to New York coordinates if geocoding fails
      return new GeoPoint(40.7128, -74.0060);
    }
  },

  // Get detailed location info from coordinates
  async getLocationInfo(latitude: number, longitude: number): Promise<LocationInfo> {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }
      
      const data = await response.json();
      
      const parts = [];
      if (data.city) parts.push(data.city);
      if (data.principalSubdivision) parts.push(data.principalSubdivision);
      if (data.countryName) parts.push(data.countryName);
      
      return {
        coordinates: new GeoPoint(latitude, longitude),
        placeName: parts.join(', ') || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
        city: data.city,
        state: data.principalSubdivision,
        country: data.countryName,
      };
    } catch (error) {
      console.error('Error getting location info:', error);
      return {
        coordinates: new GeoPoint(latitude, longitude),
        placeName: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
      };
    }
  }
};
