import {
  LayoutGrid, Users, Clapperboard, Scale, FileText, Smartphone, Database, Clock, Mail, UserCog, ShieldCheck,
} from 'lucide-react';

// Onglets de la page Paramètres : partagés entre la page (contenu) et le menu latéral de la nouvelle interface (sous-menu).
export type TabType = 'general' | 'filien' | 'postgres' | 'users' | 'roles' | 'contact_roles' | 'mobile_logs' | 'backlog' | 'signature' | 'messages' | 'sql' | 'tournages' | 'regles';

export interface SettingsTab { id: TabType; label: string; icon: any; description: string; group: string }

export const SETTINGS_TABS: SettingsTab[] = [
  { id: 'general',        label: 'Général',            icon: LayoutGrid,  description: 'APM, mail, Filien…',            group: 'Configuration' },
  { id: 'filien',         label: 'Filien / Dépôt',     icon: FileText,    description: 'Export & dépôt des factures',   group: 'Configuration' },
  { id: 'signature',      label: 'Signatures',         icon: FileText,    description: 'Signataires & gabarits',        group: 'Configuration' },
  { id: 'messages',       label: "Modèles d'emails",   icon: Mail,        description: 'Messages contextuels',          group: 'Configuration' },
  { id: 'tournages',      label: 'Gestion des tournages', icon: Clapperboard, description: 'Délais, absences, accès public', group: 'Configuration' },
  { id: 'regles',         label: 'Règles de facturation', icon: Scale,       description: 'TLPE, commerces, chantiers…',   group: 'Configuration' },
  { id: 'users',          label: 'Utilisateurs',       icon: Users,       description: 'Comptes & accès',               group: 'Référentiels' },
  { id: 'roles',          label: 'Rôles',              icon: ShieldCheck, description: 'Droits par rôle',               group: 'Référentiels' },
  { id: 'contact_roles',  label: 'Types de contacts',  icon: UserCog,     description: 'Rôles des contacts',            group: 'Référentiels' },
  { id: 'postgres',       label: 'Base PostgreSQL',    icon: Database,    description: 'Connexion externe',             group: 'Technique' },
  { id: 'sql',            label: 'Console SQL',        icon: Database,    description: 'Requêtes directes',             group: 'Technique' },
  { id: 'backlog',        label: 'Backlog',            icon: Clock,       description: 'Suivi des évolutions',          group: 'Technique' },
  { id: 'mobile_logs',    label: 'Logs mobiles',       icon: Smartphone,  description: 'Activité terrain',              group: 'Technique' },
];

export const SETTINGS_GROUPS = ['Configuration', 'Référentiels', 'Technique'];

// Sans le droit « Attribution des droits » (MANAGE_USERS) : onglet des tournages et règles de tournage seulement
export const tabsPourDroits = (peutToutGerer: boolean) => (peutToutGerer ? SETTINGS_TABS : SETTINGS_TABS.filter((t) => t.id === 'tournages' || t.id === 'regles'));

export const isSettingsTab = (v: string | null | undefined): v is TabType => !!v && SETTINGS_TABS.some((t) => t.id === v);
