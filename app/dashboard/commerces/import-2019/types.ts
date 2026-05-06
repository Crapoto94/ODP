export interface MatchReportItem {
    pdf: {
        codeTiers2019: string;
        pdfName: string;
        pdfAddress: string;
        totalFacture: number;
        numFacture: string;
        lines: {
            entityName: string;
            designation: string;
            qty: number;
            unitP: number;
            totalP: number;
        }[];
    };
    matchedTiers: {
        id: number;
        nom: string;
        adresse: string;
        siret: string;
    } | null;
    tiersScore: number;
    matchedLines: {
        entityName: string;
        designation: string;
        qty: number;
        unitP: number;
        totalP: number;
        matchedArticle: {
            id: number;
            designation: string;
            montant: number;
            modeTaxation: { nom: string };
        } | null;
        artScore: number;
    }[];
    approved?: boolean;
    forceCreate?: boolean;
}
