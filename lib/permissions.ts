export type Role = 'SAISIE' | 'INSTRUCTEUR' | 'CONTROLEUR' | 'ADMINISTRATEUR';

export type Permission =
  | 'CREATE_DOSSIER'    // B: Création dossier / Ajout dispositif / Création tiers
  | 'MODIFY_DOSSIER'    // C: Modification/suppression dossier, dispositif et reconductions
  | 'MANAGE_TARIFS'     // D: Saisie des tarifs et reconductions
  | 'GENERATE_AOT'      // E: Génération de l'AOT et mise en signature
  | 'MANAGE_TRAMES'     // F: Création et Modification des trames
  | 'SEND_EMAILS'       // G: Envoi des mails et factures aux demandeurs et redevables
  | 'SEND_FILIEN'       // H: Envoi du filien
  | 'CONTROLE_TERRAIN'  // I: Contrôle terrain
  | 'MANAGE_USERS';     // J: Attribution des droits

export const PERMISSIONS: Permission[] = [
  'CREATE_DOSSIER',
  'MODIFY_DOSSIER',
  'MANAGE_TARIFS',
  'GENERATE_AOT',
  'MANAGE_TRAMES',
  'SEND_EMAILS',
  'SEND_FILIEN',
  'CONTROLE_TERRAIN',
  'MANAGE_USERS',
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  CREATE_DOSSIER:   'Création dossier / dispositif / tiers',
  MODIFY_DOSSIER:   'Modification / suppression dossier',
  MANAGE_TARIFS:    'Saisie des tarifs et reconductions',
  GENERATE_AOT:     'Génération AOT et mise en signature',
  MANAGE_TRAMES:    'Création et modification des trames',
  SEND_EMAILS:      'Envoi mails et factures',
  SEND_FILIEN:      'Envoi du filien',
  CONTROLE_TERRAIN: 'Contrôle terrain',
  MANAGE_USERS:     'Attribution des droits',
};

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SAISIE: [
    'CREATE_DOSSIER',
    'GENERATE_AOT',
  ],
  INSTRUCTEUR: [
    'CREATE_DOSSIER',
    'MODIFY_DOSSIER',
    'MANAGE_TARIFS',
    'GENERATE_AOT',
    'MANAGE_TRAMES',
    'SEND_EMAILS',
    'SEND_FILIEN',
    'CONTROLE_TERRAIN',
  ],
  CONTROLEUR: [
    'CREATE_DOSSIER',
    'CONTROLE_TERRAIN',
  ],
  ADMINISTRATEUR: [
    'CREATE_DOSSIER',
    'MODIFY_DOSSIER',
    'MANAGE_TARIFS',
    'GENERATE_AOT',
    'MANAGE_TRAMES',
    'SEND_EMAILS',
    'SEND_FILIEN',
    'CONTROLE_TERRAIN',
    'MANAGE_USERS',
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role as Role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export const ROLES: Role[] = ['SAISIE', 'INSTRUCTEUR', 'CONTROLEUR', 'ADMINISTRATEUR'];

export const ROLE_LABELS: Record<Role, string> = {
  SAISIE: 'Saisie',
  INSTRUCTEUR: 'Instructeur',
  CONTROLEUR: 'Contrôleur',
  ADMINISTRATEUR: 'Administrateur',
};

export const ROLE_COLORS: Record<Role, string> = {
  SAISIE: 'bg-slate-100 text-slate-600',
  INSTRUCTEUR: 'bg-blue-100 text-blue-700',
  CONTROLEUR: 'bg-amber-100 text-amber-700',
  ADMINISTRATEUR: 'bg-indigo-100 text-indigo-700',
};
