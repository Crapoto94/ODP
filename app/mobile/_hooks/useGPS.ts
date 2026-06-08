"use client";
import { useState, useEffect } from 'react';

export type GPSState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; lat: number; lon: number; accuracy: number }
  | { status: 'denied' }
  | { status: 'unavailable' };

export function useGPS(): GPSState {
  const [state, setState] = useState<GPSState>({ status: 'idle' });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ status: 'unavailable' });
      return;
    }
    setState({ status: 'loading' });
    const id = navigator.geolocation.watchPosition(
      pos => setState({ status: 'ok', lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      err => setState(err.code === 1 ? { status: 'denied' } : { status: 'unavailable' }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return state;
}
