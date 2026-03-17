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
    const response = await axios.get(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
    const data = response.data;

    return data.features
      .filter((feature: any) => 
        feature.properties.citycode === '94041' || 
        feature.properties.postcode === '94200' ||
        feature.properties.city.toLowerCase().includes('ivry')
      )
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
