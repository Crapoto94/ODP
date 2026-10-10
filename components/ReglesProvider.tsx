"use client";

import { useEffect } from 'react';
import axios from 'axios';
import { setReglesActives } from '@/lib/regles-metier';

// Charge les règles métier de facturation dans le navigateur : les totaux affichés (TLPE, durées…) suivent les mêmes règles que le serveur.
export default function ReglesProvider() {
  useEffect(() => {
    axios.get('/api/regles-metier').then((r) => { if (r.data?.valeurs) setReglesActives(r.data.valeurs); }).catch(() => {});
  }, []);
  return null;
}
