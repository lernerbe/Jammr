import { GeoPoint } from 'firebase/firestore';
import { LocationData } from '@/types/user';

export interface LocationSuggestion {
  displayName: string;
  coordinates: GeoPoint;
  city?: string;
  state?: string;
  country?: string;
  placeId?: string;
}

// Google Maps types
declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export const geocodingService = {
  // Load Google Maps JavaScript SDK
  loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        resolve();
        return;
      }

      const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!googleApiKey || googleApiKey === 'your_google_maps_api_key_here') {
        reject(new Error('Google Maps API key not found'));
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        // Wait for it to load
        const checkLoaded = () => {
          if (window.google && window.google.maps && window.google.maps.places) {
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      // Set up callback
      window.initGoogleMaps = () => {
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps script'));
      };

      document.head.appendChild(script);
    });
  },

  // Get location suggestions using Google Maps JavaScript SDK (proper way)
  async getLocationSuggestions(query: string): Promise<LocationSuggestion[]> {
    if (!query || query.length < 2) {
      return [];
    }

    console.log('🔍 Searching for locations with query:', query);

    try {
      // Load Google Maps SDK if not already loaded
      await this.loadGoogleMapsScript();
      
      const sessionToken = new window.google.maps.places.AutocompleteSessionToken();
      const service = new window.google.maps.places.AutocompleteService();
      
      return await new Promise((resolve) => {
        service.getPlacePredictions(
          {
            input: query,
            types: ['(cities)'],
            sessionToken,
            language: 'en',
          },
          (predictions: any[] | null, status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && Array.isArray(predictions)) {
              const suggestions = predictions.slice(0, 5).map((p: any) => ({
                displayName: p.description,
                placeId: p.place_id,
                coordinates: new GeoPoint(0, 0), // Will be filled when selected
                city: '',
                state: '',
                country: '',
              }));
              console.log('✅ Suggestions:', suggestions);
              resolve(suggestions);
            } else {
              console.warn('❌ AutocompleteService error:', status);
              resolve([]); // Always resolve to empty array on error
            }
          }
        );
      });
    } catch (error) {
      console.error('❌ Google Maps SDK failed:', error);
      return [];
    }
  },

  // Get coordinates for a place ID (when user selects a suggestion)
  async getPlaceDetails(placeId: string): Promise<LocationSuggestion | null> {
    try {
      await this.loadGoogleMapsScript();
      
      // Use the new Place API instead of PlacesService
      const place = new window.google.maps.places.Place({
        id: placeId,
        requestedLanguage: 'en'
      });
      
      // Fetch the place details
      await place.fetchFields({
        fields: ['formattedAddress', 'location', 'addressComponents']
      });
      
      if (place.formattedAddress) {
        // Trust Google's formatting - don't try to parse it ourselves
        const result = {
          displayName: place.formattedAddress,
          coordinates: new GeoPoint(place.location?.lat() || 0, place.location?.lng() || 0),
          city: '',
          state: '',
          country: '',
        };
        
        console.log('📍 Place details:', result);
        return result;
      } else {
        console.warn('❌ Place details not available');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Get place details failed:', error);
      return null;
    }
  },

  // Convert LocationSuggestion to LocationData format
  convertToLocationData(suggestion: LocationSuggestion): LocationData {
    return {
      location: suggestion.displayName,
      coords: {
        lat: suggestion.coordinates.latitude,
        lng: suggestion.coordinates.longitude,
      },
      place_id: suggestion.placeId || this.generatePlaceId(),
    };
  },

  // Generate a random place ID for fallback
  generatePlaceId(): string {
    return `place_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
  },

  // Convert coordinates to place name using reverse geocoding (for backward compatibility)
  async getPlaceNameFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }
      
      const data = await response.json();
      
      // Build a readable place name with proper formatting
      const parts = [];
      if (data.city) parts.push(data.city);
      if (data.principalSubdivision) parts.push(data.principalSubdivision);
      
      // Format country name to be shorter and cleaner
      if (data.countryName) {
        const countryName = data.countryName
          .replace(/\(the\)/gi, '') // Remove "(the)" from country names
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .trim();
        parts.push(countryName);
      }
      
      return parts.join(', ') || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
    } catch (error) {
      console.error('Error getting place name:', error);
      // Fallback to coordinates if geocoding fails
      return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
    }
  },

};
