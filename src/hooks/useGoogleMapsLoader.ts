import { useState, useEffect, useRef } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

let loadPromise: Promise<void> | null = null;

/**
 * Google Maps JavaScript API をロードするフック
 * API キーが未設定の場合は isAvailable: false を返す
 */
export function useGoogleMapsLoader() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isAvailable, setIsAvailable] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const loadAttempted = useRef(false);

    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            setIsAvailable(false);
            return;
        }

        if (loadAttempted.current) return;
        loadAttempted.current = true;

        if (!loadPromise) {
            setOptions({
                key: apiKey,
                v: 'weekly',
                language: 'ja',
                region: 'JP',
            });
            loadPromise = importLibrary('places').then(() => {
                // places library loaded
            });
        }

        loadPromise
            .then(() => {
                setIsLoaded(true);
            })
            .catch((err: Error) => {
                setError(err.message || 'Failed to load Google Maps');
                setIsAvailable(false);
            });
    }, []);

    return { isLoaded, isAvailable, error };
}
