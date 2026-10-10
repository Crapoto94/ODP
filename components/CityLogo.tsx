"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Logo de la ville (paramétrable dans Paramètres › Général), avec repli sur le logo par défaut.
export default function CityLogo({ className = '' }: { className?: string }) {
  const [v, setV] = useState<number | null>(null);
  useEffect(() => {
    axios.get('/api/branding/logo?info=1').then((r) => setV(r.data.version || 0)).catch(() => setV(0));
  }, []);
  return <img src={`/api/branding/logo?v=${v ?? 0}`} alt="Logo de la ville" className={className} />;
}
