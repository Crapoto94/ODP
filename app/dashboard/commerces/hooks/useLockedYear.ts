import { useState, useEffect } from 'react';

const LOCKED_YEAR_KEY = 'odp_locked_year';

export function useLockedYear() {
  const [lockedYear, setLockedYearState] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCKED_YEAR_KEY);
    if (stored) {
      setLockedYearState(stored);
    }
    setIsHydrated(true);
  }, []);

  // Set locked year
  const setLockedYear = (year: string | null) => {
    setLockedYearState(year);
    if (year) {
      localStorage.setItem(LOCKED_YEAR_KEY, year);
    } else {
      localStorage.removeItem(LOCKED_YEAR_KEY);
    }
  };

  return { lockedYear, setLockedYear, isHydrated };
}
