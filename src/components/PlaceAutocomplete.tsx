/// <reference types="google.maps" />
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGoogleMapsLoader } from '../hooks/useGoogleMapsLoader';
import { MapPin, Search, Loader2 } from 'lucide-react';

export interface PlaceResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
}

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  defaultValue?: string;
  label?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export default function PlaceAutocomplete({
  onPlaceSelect,
  placeholder = '施設名を入力して検索',
  defaultValue = '',
  label,
  required = false,
  className = '',
  id,
}: PlaceAutocompleteProps) {
  const { isLoaded, isAvailable } = useGoogleMapsLoader();
  const [inputValue, setInputValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService =
    useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dummyDiv = useRef<HTMLDivElement | null>(null);

  // defaultValue が外部から変更された場合に反映
  useEffect(() => {
    setInputValue(defaultValue);
  }, [defaultValue]);

  // Google Places サービスの初期化
  useEffect(() => {
    if (isLoaded && isAvailable) {
      autocompleteService.current =
        new google.maps.places.AutocompleteService();
      if (!dummyDiv.current) {
        dummyDiv.current = document.createElement('div');
      }
      placesService.current = new google.maps.places.PlacesService(
        dummyDiv.current
      );
    }
  }, [isLoaded, isAvailable]);

  // 外部クリックで候補を閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete 検索
  const searchPlaces = useCallback((query: string) => {
    if (!autocompleteService.current || query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    autocompleteService.current.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'jp' },
        types: ['establishment'],
      },
      (
        predictions: google.maps.places.AutocompletePrediction[] | null,
        status: google.maps.places.PlacesServiceStatus
      ) => {
        setIsSearching(false);
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          predictions
        ) {
          setSuggestions(predictions);
          setIsOpen(true);
          setSelectedIndex(-1);
        } else {
          setSuggestions([]);
          setIsOpen(false);
        }
      }
    );
  }, []);

  // 入力変更ハンドラ（デバウンス後に検索）
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (value.trim().length >= 2) {
      debounceTimer.current = setTimeout(() => {
        searchPlaces(value.trim());
      }, 300);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  // 候補を選択
  const handleSelectPlace = (
    prediction: google.maps.places.AutocompletePrediction
  ) => {
    if (!placesService.current) return;

    setIsSearching(true);
    setIsOpen(false);

    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: [
          'name',
          'formatted_address',
          'geometry',
          'formatted_phone_number',
          'website',
        ],
      },
      (
        place: google.maps.places.PlaceResult | null,
        status: google.maps.places.PlacesServiceStatus
      ) => {
        setIsSearching(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const result: PlaceResult = {
            name:
              place.name || prediction.structured_formatting.main_text,
            address: place.formatted_address || '',
            latitude: place.geometry?.location?.lat() || 0,
            longitude: place.geometry?.location?.lng() || 0,
            phone: place.formatted_phone_number || undefined,
            website: place.website || undefined,
          };

          setInputValue(result.name);
          onPlaceSelect(result);
        }
      }
    );
  };

  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectPlace(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // API が利用不可の場合は通常のテキスト入力にフォールバック
  if (!isAvailable) {
    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label} {required && <span className="text-red-600">*</span>}
          </label>
        )}
        <input
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        />
      </div>

      {/* 候補ドロップダウン */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelectPlace(prediction)}
              className={`w-full text-left px-4 py-3 flex items-start space-x-3 transition ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="font-medium text-gray-800 truncate">
                  {prediction.structured_formatting.main_text}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {prediction.structured_formatting.secondary_text}
                </div>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 text-xs text-gray-400 border-t flex items-center justify-end">
            Powered by Google
          </div>
        </div>
      )}
    </div>
  );
}
