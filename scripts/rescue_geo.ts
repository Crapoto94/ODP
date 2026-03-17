import { prisma } from '../lib/prisma';
import axios from 'axios';

async function geocodeAddress(address: string) {
  try {
    const res = await axios.get(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`);
    if (res.data.features && res.data.features.length > 0) {
      const coord = res.data.features[0].geometry.coordinates;
      return { longitude: coord[0], latitude: coord[1] };
    }
  } catch (err) {
    console.error(`Failed to geocode: ${address}`);
  }
  return null;
}

async function run() {
  console.log('Starting geocoding rescue...');
  
  const occupations = await (prisma as any).occupation.findMany({
    where: { latitude: null, longitude: null, adresse: { not: '' } }
  });
  
  console.log(`Found ${occupations.length} occupations to geocode.`);
  
  for (const occ of occupations) {
    const coords = await geocodeAddress(occ.adresse);
    if (coords) {
      await (prisma as any).occupation.update({
        where: { id: occ.id },
        data: coords
      });
      console.log(`Updated occupation ${occ.id}: ${occ.adresse}`);
    }
  }

  const tiers = await (prisma as any).tiers.findMany({
    where: { latitude: null, longitude: null, adresse: { not: '' } }
  });

  console.log(`Found ${tiers.length} tiers to geocode.`);

  for (const t of tiers) {
    const coords = await geocodeAddress(t.adresse);
    if (coords) {
      await (prisma as any).tiers.update({
        where: { id: t.id },
        data: coords
      });
      console.log(`Updated tier ${t.id}: ${t.adresse}`);
    }
  }

  console.log('Geocoding rescue finished.');
}

run().catch(console.error);
