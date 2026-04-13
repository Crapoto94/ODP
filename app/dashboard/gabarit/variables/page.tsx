'use client';

import React from 'react';
import { Copy, Check, FileText } from 'lucide-react';

export default function AotVariablesPage() {
  const [copiedVariable, setCopiedVariable] = React.useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVariable(text);
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  const Variable = ({ name, description }: { name: string; description: string }) => (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <code className="block font-mono font-bold text-blue-600 text-sm mb-2">{name}</code>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <button
          onClick={() => copyToClipboard(name)}
          className="shrink-0 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          title="Copier la variable"
        >
          {copiedVariable === name ? (
            <Check size={18} className="text-green-600" />
          ) : (
            <Copy size={18} />
          )}
        </button>
      </div>
    </div>
  );

  const VariableSection = ({
    title,
    description,
    variables,
  }: {
    title: string;
    description: string;
    variables: Array<{ name: string; description: string }>;
  }) => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-slate-950">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {variables.map((v) => (
          <Variable key={v.name} name={v.name} description={v.description} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-12 px-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-xl">
            <FileText className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-950">Variables AOT</h1>
            <p className="text-slate-500 mt-1">Documentation des variables pour les templates Word</p>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
        <h2 className="text-lg font-black text-blue-950 mb-3">Comment utiliser les variables?</h2>
        <ol className="space-y-2 text-sm text-blue-900">
          <li>
            <strong>1.</strong> Dans votre template Word, écrivez les variables exactement comme indiquées ci-dessous
            (ex: <code className="bg-white px-2 py-1 rounded border border-blue-200">{'{'}</code>
            <code className="bg-white px-2 py-1 rounded border border-blue-200 font-mono">id</code>
            <code className="bg-white px-2 py-1 rounded border border-blue-200">{'}'})</code>
          </li>
          <li>
            <strong>2.</strong> Cliquez sur l'icône <Copy size={14} className="inline" /> pour copier la variable
          </li>
          <li>
            <strong>3.</strong> Lors de la génération de l'AOT, toutes les variables seront remplacées automatiquement
          </li>
        </ol>
      </div>

      {/* Dossier section */}
      <VariableSection
        title="📋 Informations du Dossier"
        description="Variables relatives à l'occupation/dossier"
        variables={[
          { name: '{id}', description: 'Numéro unique du dossier (ex: 43)' },
          { name: '{nom}', description: 'Nom ou titre du dossier' },
          { name: '{adresse}', description: 'Adresse complète du lieu d\'occupation' },
          { name: '{type}', description: 'Type d\'occupation (COMMERCE, CHANTIER, TOURNAGE, TLPE)' },
          { name: '{statut}', description: 'Statut actuel du dossier' },
          { name: '{dateDebut}', description: 'Date de début de l\'occupation (format: JJ/MM/YYYY)' },
          { name: '{dateFin}', description: 'Date de fin de l\'occupation (format: JJ/MM/YYYY)' },
          { name: '{anneeTaxation}', description: 'Année de taxation (pour TLPE/COMMERCE)' },
          { name: '{description}', description: 'Description du dossier' },
        ]}
      />

      {/* Date section */}
      <VariableSection
        title="📅 Date"
        description="Variables de date"
        variables={[
          { name: '{today}', description: 'Date du jour actuel (format: "JJ Mois YYYY" ex: "13 avril 2026")' },
        ]}
      />

      {/* Tiers section */}
      <VariableSection
        title="👥 Informations du Tiers et Demandeur"
        description="Variables relatives au demandeur/bénéficiaire"
        variables={[
          { name: '{tiers.nom}', description: 'Nom ou raison sociale du tiers' },
          { name: '{tiers.siret}', description: 'Numéro SIRET du tiers' },
          { name: '{tiers.email}', description: 'Email du tiers' },
          { name: '{tiers.adresse}', description: 'Adresse du tiers' },
          {
            name: '{demandeurComplet}',
            description: 'Nom et prénom complet du demandeur/contact (ex: "Jean Dupont")',
          },
          { name: '{contact.nom}', description: 'Nom du contact principal' },
          { name: '{contact.prenom}', description: 'Prénom du contact principal' },
          { name: '{contact.email}', description: 'Email du contact principal' },
          { name: '{contact.telephone}', description: 'Téléphone du contact principal' },
          { name: '{contact.role}', description: 'Rôle du contact principal' },
        ]}
      />

      {/* Signataire section */}
      <VariableSection
        title="✍️ Informations du Signataire"
        description="Variables relatives à la signature (à configurer dans les paramètres)"
        variables={[
          { name: '{signataireNom}', description: 'Nom complet du signataire' },
          { name: '{signataireRole}', description: 'Fonction/titre du signataire (ex: "Maire")' },
          {
            name: '{signataireDelegation}',
            description: 'Délégation ou pouvoirs du signataire',
          },
        ]}
      />

      {/* Articles section */}
      <VariableSection
        title="📦 Informations des Articles"
        description="Variables pour les articles/lignes de taxe (remplacez le numéro: 1, 2, 3, etc.)"
        variables={[
          {
            name: '{article1.numero}',
            description: 'Numéro de code de l\'article 1',
          },
          {
            name: '{article1.designation}',
            description: 'Nom/designation de l\'article 1 (ex: "Occupation de voirie - Terrasse")',
          },
          {
            name: '{article1.montant}',
            description: 'Montant unitaire de l\'article 1 (ex: "15.50")',
          },
          {
            name: '{article1.quantite1}',
            description: 'Première quantité de l\'article 1 (ex: "50")',
          },
          {
            name: '{article1.quantite2}',
            description: 'Deuxième quantité de l\'article 1 (ex: "100")',
          },
          {
            name: '{article1.dateDebut}',
            description: 'Date de début de l\'article 1 (format: JJ/MM/YYYY)',
          },
          {
            name: '{article1.dateFin}',
            description: 'Date de fin de l\'article 1 (format: JJ/MM/YYYY)',
          },
        ]}
      />

      {/* Articles note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
        <h3 className="font-black text-amber-950 mb-2">📌 Note sur les articles multiples</h3>
        <p className="text-sm text-amber-900">
          Si votre dossier contient plusieurs articles, vous pouvez utiliser :
          <br />
          <code className="bg-white px-2 py-1 rounded border border-amber-200 mt-2 inline-block font-mono">
            {'{'}article1.designation{'}'}, {'{'}article2.designation{'}'}, {'{'}article3.designation{'}'}
          </code>
        </p>
        <p className="text-sm text-amber-900 mt-3">
          Chaque variable avec un numéro sera remplacée par les données correspondantes, ou laissée vide s'il n'y a pas
          cet article.
        </p>
      </div>

      {/* Example */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-950">📝 Exemple de Template</h3>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 font-mono text-sm overflow-auto">
          <pre className="whitespace-pre-wrap break-words text-slate-700">
{`ARRÊTÉ N° {id}

Vu la pétition par laquelle {demandeurComplet},

Considérant que le dossier a été approuvé,

ARTICLE 1: {article1.designation}
Période: {article1.dates}
Quantité: {article1.quantite}
Montant: {article1.pu}€

ARTICLE 2: {article2.designation}
Période: {article2.dates}

Le présent arrêté est établi le {today}.

Signé par: {signataireNom}
{signataireRole}
{signataireDelegation}`}
          </pre>
        </div>
      </div>

      {/* Footer tip */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
        <h3 className="font-black text-green-950 mb-2">💡 Conseil</h3>
        <p className="text-sm text-green-900">
          Téléchargez votre template Word avec les variables, modifiez-le comme vous le souhaitez (ajoutez des logos,
          changez les polices, la mise en page), puis uploadez-le dans l'onglet "Templates DOCX (AOT)" de la page
          Gabarits.
        </p>
      </div>
    </div>
  );
}
