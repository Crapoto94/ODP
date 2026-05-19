export interface StatusConfig {
    label: string;
    color: string; // text color class
    bg: string;    // bg color class
    border?: string; // border color class
}

export const STANDARD_STATUS_MAP: Record<string, StatusConfig> = {
    'EN_ATTENTE': { label: 'En attente', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
    'EN_COURS': { label: 'En cours', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    'TERMINE': { label: 'Terminé', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    'VERIFIE': { label: 'Vérifié', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    'FACTURE': { label: 'Facturé', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    'INVOICED': { label: 'Facturé', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    'TITRE': { label: 'Titré', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    'PAYE': { label: 'Payé', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
    'PAYÉ': { label: 'Payé', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
};

export const CHANTIER_STATUS_MAP: Record<string, StatusConfig> = {
    'INIT': { label: 'Initialisation', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
    'INITIALISATION': { label: 'Initialisation', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
    'EN_ATTENTE': { label: 'Initialisation', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
    'INST': { label: 'Instruction', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    'INSTRUCTION': { label: 'Instruction', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    'PREP': { label: 'Préparation des AOT', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    'PREPARATION_AOT': { label: 'Préparation des AOT', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    'EN_COURS': { label: 'En cours', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    'VALIDE': { label: 'Validé', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    'VERIFIE': { label: 'Validé', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    'FACTURE': { label: 'Facturé', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    'TITRE': { label: 'Titré', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    'CLOS': { label: 'Clos', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
    'PAYE': { label: 'Clos', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
};

export const TOURNAGE_STATUS_MAP: Record<string, StatusConfig> = {
    'INIT': { label: 'Initialisation', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
    'INITIALISATION': { label: 'Initialisation', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
    'EN_ATTENTE': { label: 'Initialisation', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
    'INST': { label: 'Instruction', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    'INSTRUCTION': { label: 'Instruction', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    'PREP': { label: 'Préparation des AOT', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    'PREPARATION_AOT': { label: 'Préparation des AOT', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    'EN_COURS': { label: 'En cours', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    'VALIDE': { label: 'Validé', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    'VERIFIE': { label: 'Validé', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    'FACTURE': { label: 'Facturé', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    'TITRE': { label: 'Titré', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    'CLOS': { label: 'Clos', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
    'PAYE': { label: 'Clos', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
};

/**
 * Returns the status configuration based on occupation type and status code.
 */
export function getStatusConfig(type: string | undefined, status: string): StatusConfig {
    if (type === 'CHANTIER') {
        return CHANTIER_STATUS_MAP[status] || CHANTIER_STATUS_MAP['INIT'] || STANDARD_STATUS_MAP[status] || { label: status, color: 'text-slate-500', bg: 'bg-slate-50' };
    }
    if (type === 'TOURNAGE') {
        return TOURNAGE_STATUS_MAP[status] || TOURNAGE_STATUS_MAP['INIT'] || STANDARD_STATUS_MAP[status] || { label: status, color: 'text-slate-500', bg: 'bg-slate-50' };
    }
    return STANDARD_STATUS_MAP[status] || { label: status, color: 'text-slate-500', bg: 'bg-slate-50' };
}

/**
 * Returns all available statuses for a given type.
 */
export function getAvailableStatuses(type: string | undefined): Record<string, StatusConfig> {
    if (type === 'CHANTIER') {
        return {
            'INIT': CHANTIER_STATUS_MAP['INIT'],
            'INST': CHANTIER_STATUS_MAP['INST'],
            'PREP': CHANTIER_STATUS_MAP['PREP'],
            'EN_COURS': CHANTIER_STATUS_MAP['EN_COURS'],
            'VALIDE': CHANTIER_STATUS_MAP['VALIDE'],
            'FACTURE': CHANTIER_STATUS_MAP['FACTURE'],
            'TITRE': CHANTIER_STATUS_MAP['TITRE'],
            'CLOS': CHANTIER_STATUS_MAP['CLOS'],
        };
    }
    if (type === 'TOURNAGE') {
        return {
            'INIT': TOURNAGE_STATUS_MAP['INIT'],
            'INST': TOURNAGE_STATUS_MAP['INST'],
            'PREP': TOURNAGE_STATUS_MAP['PREP'],
            'EN_COURS': TOURNAGE_STATUS_MAP['EN_COURS'],
            'VALIDE': TOURNAGE_STATUS_MAP['VALIDE'],
            'FACTURE': TOURNAGE_STATUS_MAP['FACTURE'],
            'TITRE': TOURNAGE_STATUS_MAP['TITRE'],
            'CLOS': TOURNAGE_STATUS_MAP['CLOS'],
        };
    }
    return {
        'EN_ATTENTE': STANDARD_STATUS_MAP['EN_ATTENTE'],
        'EN_COURS': STANDARD_STATUS_MAP['EN_COURS'],
        'TERMINE': STANDARD_STATUS_MAP['TERMINE'],
        'VERIFIE': STANDARD_STATUS_MAP['VERIFIE'],
        'FACTURE': STANDARD_STATUS_MAP['FACTURE'],
        'TITRE': STANDARD_STATUS_MAP['TITRE'],
        'PAYE': STANDARD_STATUS_MAP['PAYE'],
    };
}
