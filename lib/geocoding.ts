import axios from 'axios';

export interface GeocodeResult {
  label: string;
  latitude: number;
  longitude: number;
  city: string;
  postcode: string;
}

export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  try {
    const response = await axios.get(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&citycode=94041&limit=5`);
    const data = response.data;

    return data.features
      .filter((feature: any) => feature.properties.city === 'Ivry-sur-Seine' || feature.properties.postcode === '94200')
      .map((feature: any) => ({
        label: feature.properties.label,
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        city: feature.properties.city,
        postcode: feature.properties.postcode
      }));
  } catch (error) {
    console.error('[GEOCODING] Failed to search address:', error);
    return [];
  }
}
