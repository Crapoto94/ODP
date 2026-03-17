import axios from 'axios';

export interface SireneInfo {
  nom: string;
  enseigne?: string;
  siret: string;
  adresse: string;
  ville: string;
  code_postal: string;
  activite_principale?: string;
  etat_administratif?: string;
  categorie_juridique?: string;
  date_creation?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export async function fetchSiretInfo(siret: string): Promise<SireneInfo | null> {
  try {
    // Clean SIRET (remove spaces)
    const cleanSiret = siret.replace(/\s+/g, '');
    
    if (cleanSiret.length !== 14) {
      throw new Error('SIRET doit faire 14 chiffres');
    }

    // Using the public API Sirene from data.gouv.fr (recherche-entreprises)
    const response = await axios.get(`https://recherche-entreprises.api.gouv.fr/search?q=${cleanSiret}`);
    const data = response.data;
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const siege = result.siege || {};
      
      return {
        nom: result.nom_complet || result.nom_raison_sociale,
        enseigne: siege.enseigne || result.enseigne,
        siret: siege.siret || cleanSiret,
        adresse: siege.adresse || result.adresse,
        ville: siege.libelle_commune || result.ville,
        code_postal: siege.code_postal || result.code_postal,
        activite_principale: result.activite_principale,
        etat_administratif: result.etat_administratif === 'A' ? 'Actif' : 'Cessée',
        categorie_juridique: result.nature_juridique,
        date_creation: result.date_creation
      };
    }
    return null;
  } catch (error) {
    console.error('[INSEE] Failed to fetch SIRET info:', error);
    return null;
  }
}
export async function fetchBusinessesByCity(codeCommune: string, page: number = 1): Promise<SireneInfo[]> {
  try {
    // API Recherche Entreprises limits per_page to 25
    const response = await axios.get(`https://recherche-entreprises.api.gouv.fr/search?code_commune=${codeCommune}&per_page=25&page=${page}`);
    const data = response.data;
    
    if (data.results && data.results.length > 0) {
      const allBusinesses: SireneInfo[] = [];

      for (const result of data.results) {
        const matching = (result.matching_etablissements || []).find((et: any) => et.commune === codeCommune) 
                        || result.matching_etablissements?.[0] 
                        || result.siege 
                        || {};

        allBusinesses.push({
          nom: result.nom_complet || result.nom_raison_sociale,
          enseigne: matching.enseigne || result.enseigne || result.nom_complet,
          siret: matching.siret || result.siren + '00000',
          adresse: matching.adresse || result.adresse,
          ville: matching.libelle_commune || result.ville,
          code_postal: matching.code_postal || result.code_postal,
          latitude: matching.latitude ? parseFloat(matching.latitude) : null,
          longitude: matching.longitude ? parseFloat(matching.longitude) : null,
          activite_principale: result.activite_principale,
          etat_administratif: result.etat_administratif === 'A' ? 'Actif' : 'Cessée',
          categorie_juridique: result.nature_juridique,
          date_creation: result.date_creation
        });
      }
      return { 
        results: allBusinesses, 
        totalPages: data.total_pages || 1,
        totalResults: data.total_results || allBusinesses.length
      } as any;
    }
    return { results: [], totalPages: 0, totalResults: 0 } as any;
  } catch (error) {
    console.error('[INSEE] Failed to fetch city businesses:', error);
    return [];
  }
}
