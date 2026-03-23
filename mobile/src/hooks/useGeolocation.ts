import { useState, useEffect } from 'react';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function useGeolocation() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée par ce navigateur');
      return;
    }
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setError('Sécurité : HTTPS requis pour la géolocalisation sur mobile');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée par ce navigateur');
      return;
    }
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setError('Sécurité : HTTPS requis pour la géolocalisation sur mobile');
      return;
    }

    const watcher = navigator.geolocation.watchPosition(

      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  return { coords, error, loading, refresh };
}

