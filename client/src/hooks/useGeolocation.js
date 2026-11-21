import { useState, useEffect } from 'react';

// Default central landmark: Kovur Junction, Nellore, AP
const DEFAULT_COORDS = {
  latitude: 14.466998,
  longitude: 79.999196
};

export const useGeolocation = (autoFetch = false) => {
  const [coordinates, setCoordinates] = useState(DEFAULT_COORDS);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isUsingGps, setIsUsingGps] = useState(false);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6))
        });
        setIsLocating(false);
        setIsUsingGps(true);
      },
      (err) => {
        console.warn('[Geolocation]:', err.message);
        setLocationError('Could not obtain live GPS. Using default Nellore coordinates.');
        setIsLocating(false);
        setIsUsingGps(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  useEffect(() => {
    if (autoFetch) {
      requestLocation();
    }
  }, [autoFetch]);

  return {
    coordinates,
    setCoordinates,
    isLocating,
    locationError,
    isUsingGps,
    requestLocation
  };
};

export default useGeolocation;
