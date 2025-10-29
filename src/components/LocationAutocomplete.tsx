import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { geocodingService, LocationSuggestion } from "@/services/geocodingService";
import { LocationData } from "@/types/user";
import { GeoPoint } from "firebase/firestore";
import { MapPin, Loader2 } from "lucide-react";

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (locationData: LocationData) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export const LocationAutocomplete = ({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Enter your location",
  label = "Location",
  required = false,
  disabled = false,
}: LocationAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (value.length >= 2 && isFocused) {
        console.log('Searching for locations with query:', value);
        setIsLoading(true);
        try {
          const results = await geocodingService.getLocationSuggestions(value);
          console.log('Received suggestions:', results);
          // Ensure we always have an array
          setSuggestions(Array.isArray(results) ? results : []);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        } catch (error) {
          console.error('Error fetching location suggestions:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, isFocused]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSuggestionSelect = async (suggestion: LocationSuggestion) => {
    onChange(suggestion.displayName);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setIsFocused(false);
    
    // If we have a placeId, get the full details with coordinates
    if (suggestion.placeId) {
      try {
        const placeDetails = await geocodingService.getPlaceDetails(suggestion.placeId);
        if (placeDetails) {
          const locationData = geocodingService.convertToLocationData(placeDetails);
          onLocationSelect(locationData);
        } else {
          // Fallback to the suggestion coordinates if place details fail
          const locationData = geocodingService.convertToLocationData(suggestion);
          onLocationSelect(locationData);
        }
      } catch (error) {
        console.error('Error getting place details:', error);
        const locationData = geocodingService.convertToLocationData(suggestion);
        onLocationSelect(locationData);
      }
    } else {
      const locationData = geocodingService.convertToLocationData(suggestion);
      onLocationSelect(locationData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow for clicks on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="location">{label}</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          id="location"
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="pl-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Suggestions dropdown */}
        {showSuggestions && isFocused && Array.isArray(suggestions) && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.placeId ?? `suggestion-${index}`}
              type="button"
              className={`w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
              }`}
              onClick={() => handleSuggestionSelect(suggestion)}
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">{suggestion.displayName}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !isLoading && value.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg p-4">
          <p className="text-sm text-muted-foreground text-center">
            No locations found. Try searching for a city name like "New York" or "London".
          </p>
        </div>
      )}
    </div>
  );
};
