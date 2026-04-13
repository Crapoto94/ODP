
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  Serializable: 'Serializable'
});

exports.Prisma.TiersScalarFieldEnum = {
  id: 'id',
  nom: 'nom',
  siret: 'siret',
  email: 'email',
  adresse: 'adresse',
  latitude: 'latitude',
  longitude: 'longitude',
  code_sedit: 'code_sedit',
  statut: 'statut',
  created_at: 'created_at',
  updated_at: 'updated_at',
  natureJuridique: 'natureJuridique',
  etatAdministratif: 'etatAdministratif'
};

exports.Prisma.OccupationScalarFieldEnum = {
  id: 'id',
  nom: 'nom',
  tiersId: 'tiersId',
  type: 'type',
  statut: 'statut',
  dateDebut: 'dateDebut',
  dateFin: 'dateFin',
  anneeTaxation: 'anneeTaxation',
  adresse: 'adresse',
  latitude: 'latitude',
  longitude: 'longitude',
  description: 'description',
  photos: 'photos',
  montantCalcule: 'montantCalcule',
  facturePath: 'facturePath',
  created_at: 'created_at',
  updated_at: 'updated_at',
  numeroFacture: 'numeroFacture',
  datePaiement: 'datePaiement',
  dossierParentId: 'dossierParentId',
  agissantPour: 'agissantPour',
  isCourtMetrage: 'isCourtMetrage',
  aotGabaritId: 'aotGabaritId'
};

exports.Prisma.ContactScalarFieldEnum = {
  id: 'id',
  nom: 'nom',
  prenom: 'prenom',
  email: 'email',
  telephone: 'telephone',
  titre: 'titre',
  role: 'role',
  occupationId: 'occupationId',
  tiersId: 'tiersId',
  pjPath: 'pjPath',
  created_at: 'created_at',
  updated_at: 'updated_at',
  entreprise: 'entreprise'
};

exports.Prisma.NoteScalarFieldEnum = {
  id: 'id',
  occupationId: 'occupationId',
  content: 'content',
  author: 'author',
  pjPath: 'pjPath',
  pjName: 'pjName',
  pjThumb: 'pjThumb',
  isEmail: 'isEmail',
  externalId: 'externalId',
  fromEmail: 'fromEmail',
  toEmail: 'toEmail',
  origin: 'origin',
  created_at: 'created_at'
};

exports.Prisma.O365MessageScalarFieldEnum = {
  id: 'id',
  subject: 'subject',
  fromName: 'fromName',
  fromEmail: 'fromEmail',
  bodyPreview: 'bodyPreview',
  receivedAt: 'receivedAt',
  processed: 'processed',
  created_at: 'created_at'
};

exports.Prisma.CategorieScalarFieldEnum = {
  id: 'id',
  nom: 'nom',
  couleur: 'couleur',
  niveau: 'niveau',
  parentId: 'parentId'
};

exports.Prisma.ModeTaxationScalarFieldEnum = {
  id: 'id',
  nom: 'nom'
};

exports.Prisma.ArticleScalarFieldEnum = {
  id: 'id',
  numero: 'numero',
  designation: 'designation',
  categorieId: 'categorieId',
  modeTaxationId: 'modeTaxationId',
  annee: 'annee',
  montant: 'montant',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at',
  chapitre: 'chapitre',
  codeInterne: 'codeInterne',
  fonction: 'fonction',
  gestionnaire: 'gestionnaire',
  nature: 'nature',
  sens: 'sens',
  structure: 'structure',
  typeMouvement: 'typeMouvement'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  nom: 'nom',
  prenom: 'prenom',
  email: 'email',
  login: 'login',
  password: 'password',
  role: 'role',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.MobileLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  userAgent: 'userAgent',
  deviceInfo: 'deviceInfo',
  ip: 'ip',
  created_at: 'created_at'
};

exports.Prisma.AppSettingsScalarFieldEnum = {
  id: 'id',
  financeEmail: 'financeEmail',
  appUrl: 'appUrl',
  apmUrl: 'apmUrl',
  apmToken: 'apmToken',
  senderName: 'senderName',
  senderEmail: 'senderEmail',
  filienOrga: 'filienOrga',
  filienBudget: 'filienBudget',
  filienExercice: 'filienExercice',
  filienAvancement: 'filienAvancement',
  filienRejetDispo: 'filienRejetDispo',
  filienRejetCA: 'filienRejetCA',
  filienRejetMarche: 'filienRejetMarche',
  filienMouvement: 'filienMouvement',
  filienType: 'filienType',
  filienLibelle: 'filienLibelle',
  filienCalendrier: 'filienCalendrier',
  filienMonnaie: 'filienMonnaie',
  filienMouvementEx: 'filienMouvementEx',
  filienPreBordereau: 'filienPreBordereau',
  filienPoste: 'filienPoste',
  filienBordereau: 'filienBordereau',
  filienObjet: 'filienObjet',
  filienChapitre: 'filienChapitre',
  filienNature: 'filienNature',
  filienFonction: 'filienFonction',
  filienCodeInterne: 'filienCodeInterne',
  filienTypeMouvement: 'filienTypeMouvement',
  filienSens: 'filienSens',
  filienStructure: 'filienStructure',
  filienGestionnaire: 'filienGestionnaire',
  filienUncPj: 'filienUncPj',
  signataireRole: 'signataireRole',
  signataireDelegation: 'signataireDelegation',
  signataireNom: 'signataireNom',
  filienUncUser: 'filienUncUser',
  filienUncPass: 'filienUncPass',
  filienUncDomain: 'filienUncDomain',
  updated_at: 'updated_at'
};

exports.Prisma.LigneOccupationScalarFieldEnum = {
  id: 'id',
  occupationId: 'occupationId',
  articleId: 'articleId',
  quantite1: 'quantite1',
  quantite2: 'quantite2',
  dateDebut: 'dateDebut',
  dateFin: 'dateFin',
  dateDebutConstatee: 'dateDebutConstatee',
  dateFinConstatee: 'dateFinConstatee',
  montant: 'montant',
  created_at: 'created_at',
  updated_at: 'updated_at',
  photos: 'photos',
  note: 'note'
};

exports.Prisma.DispositifScalarFieldEnum = {
  id: 'id',
  nom: 'nom',
  statut: 'statut',
  occupationId: 'occupationId',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.GabaritScalarFieldEnum = {
  id: 'id',
  nom: 'nom',
  contenu: 'contenu',
  isDefault: 'isDefault',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.TlpeConfigScalarFieldEnum = {
  annee: 'annee',
  exoneration: 'exoneration',
  deliberationPath: 'deliberationPath',
  tarifsPath: 'tarifsPath'
};

exports.Prisma.TypeDossierConfigScalarFieldEnum = {
  id: 'id',
  type: 'type',
  filienObjet: 'filienObjet',
  filienChapitre: 'filienChapitre',
  filienNature: 'filienNature',
  filienFonction: 'filienFonction',
  filienCodeInterne: 'filienCodeInterne',
  filienTypeMouvement: 'filienTypeMouvement',
  filienSens: 'filienSens',
  filienStructure: 'filienStructure',
  filienGestionnaire: 'filienGestionnaire',
  invoiceTemplateId: 'invoiceTemplateId',
  updated_at: 'updated_at'
};

exports.Prisma.BacklogItemScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  type: 'type',
  priority: 'priority',
  status: 'status',
  versionId: 'versionId',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.BacklogCommentScalarFieldEnum = {
  id: 'id',
  backlogItemId: 'backlogItemId',
  content: 'content',
  author: 'author',
  created_at: 'created_at'
};

exports.Prisma.VersionReleaseScalarFieldEnum = {
  id: 'id',
  versionNumber: 'versionNumber',
  notes: 'notes',
  releasedAt: 'releasedAt',
  created_at: 'created_at'
};

exports.Prisma.PostgresConfigScalarFieldEnum = {
  id: 'id',
  host: 'host',
  port: 'port',
  database: 'database',
  schema: 'schema',
  user: 'user',
  password: 'password'
};

exports.Prisma.OdpConfigScalarFieldEnum = {
  annee: 'annee',
  deliberationPath: 'deliberationPath',
  tarifsTournagesPath: 'tarifsTournagesPath',
  tarifsOdpPath: 'tarifsOdpPath'
};

exports.Prisma.BillingRunScalarFieldEnum = {
  id: 'id',
  type: 'type',
  date: 'date',
  count: 'count',
  total: 'total',
  agent: 'agent',
  recapPath: 'recapPath',
  filienPath: 'filienPath'
};

exports.Prisma.BillingRunInvoiceScalarFieldEnum = {
  id: 'id',
  billingRunId: 'billingRunId',
  dossierId: 'dossierId',
  numero: 'numero',
  tiers: 'tiers',
  total: 'total',
  pdfPath: 'pdfPath'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  Tiers: 'Tiers',
  Occupation: 'Occupation',
  Contact: 'Contact',
  Note: 'Note',
  O365Message: 'O365Message',
  Categorie: 'Categorie',
  ModeTaxation: 'ModeTaxation',
  Article: 'Article',
  User: 'User',
  MobileLog: 'MobileLog',
  AppSettings: 'AppSettings',
  LigneOccupation: 'LigneOccupation',
  Dispositif: 'Dispositif',
  Gabarit: 'Gabarit',
  TlpeConfig: 'TlpeConfig',
  TypeDossierConfig: 'TypeDossierConfig',
  BacklogItem: 'BacklogItem',
  BacklogComment: 'BacklogComment',
  VersionRelease: 'VersionRelease',
  PostgresConfig: 'PostgresConfig',
  OdpConfig: 'OdpConfig',
  BillingRun: 'BillingRun',
  BillingRunInvoice: 'BillingRunInvoice'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
