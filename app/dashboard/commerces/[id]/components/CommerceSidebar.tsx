import React from 'react';
import { Pencil, Clock, Plus, Loader2 } from 'lucide-react';
import CommerceContacts from './CommerceContacts';
import DocumentList from './DocumentList';

interface Contact {
  id: number;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  titre?: string;
  entreprise?: string;
  role: string;
  pjPath?: string;
}

interface Document {
  id: number;
  description: string;
  name: string;
  path: string;
  created_at: string;
}

interface Props {
  tiersId: number;
  contacts: Contact[];
  documents?: Document[];
  isFactured?: boolean;
  onOpenContactModal: () => void;
  onDeleteContact: (id: number) => void;
  onEditContact?: (contact: Contact) => void;
  isContactsLoading?: boolean;
  onAddDocument?: () => void;
  onDeleteDocument?: (id: number) => Promise<void>;
  observations?: string | null;
  onUpdateObservations?: (value: string) => Promise<void>;
  occupation?: any;
  onSendAot?: () => void;
  isSendingAot?: boolean;
  aotSentMsg?: string | null;
}

export default function CommerceSidebar({
  tiersId,
  contacts,
  documents = [],
  isFactured,
  onOpenContactModal,
  onDeleteContact,
  onEditContact,
  isContactsLoading,
  onAddDocument,
  onDeleteDocument,
  observations,
  onUpdateObservations,
  occupation,
  onSendAot,
  isSendingAot,
  aotSentMsg,
}: Props) {
  const [isEditingObs, setIsEditingObs] = React.useState(false);
  const [obsValue, setObsValue] = React.useState(observations || '');
  const [savingObs, setSavingObs] = React.useState(false);

  React.useEffect(() => {
    setObsValue(observations || '');
  }, [observations]);

  const handleSaveObs = async () => {
    if (!onUpdateObservations) return;
    setSavingObs(true);
    try {
      await onUpdateObservations(obsValue);
      setIsEditingObs(false);
    } catch (err) {
      console.error('Failed to save observations:', err);
      alert('Erreur lors de la sauvegarde des notes');
    } finally {
      setSavingObs(false);
    }
  };

  return (
    <aside className="lg:col-span-4 space-y-12">
      {/* Documents Section */}
      <DocumentList
        documents={documents}
        docCount={documents.length}
        isFactured={isFactured}
        onOpenUploadModal={onAddDocument}
        onDeleteDocument={onDeleteDocument}
        occupation={occupation}
        onSendAot={onSendAot}
        isSendingAot={isSendingAot}
        aotSentMsg={aotSentMsg}
      />

      {/* Contacts Section */}
      <CommerceContacts
        contacts={contacts}
        isLoading={isContactsLoading}
        onOpenContactModal={onOpenContactModal}
        onDeleteContact={onDeleteContact}
        onEditContact={onEditContact}
        isFactured={isFactured}
      />

      {/* Observations Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
            <Clock size={16} className="text-amber-500" /> Notes Techniques
          </h3>
          {!isFactured && !isEditingObs && (
            <button
              onClick={() => setIsEditingObs(true)}
              className="w-8 h-8 bg-amber-50 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center"
              title="Modifier les notes"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden min-h-[160px]">
          {!isEditingObs && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[4rem] flex items-center justify-center -mr-10 -mt-10 opacity-50">
              <Clock size={32} className="text-amber-200" />
            </div>
          )}
          {isEditingObs ? (
            <div className="space-y-4">
              <textarea
                value={obsValue}
                onChange={e => setObsValue(e.target.value)}
                rows={6}
                autoFocus
                placeholder="Notes techniques, remarques complémentaires..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditingObs(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs uppercase transition-all"
                >
                  Annuler
                </button>
                <button
                  disabled={savingObs}
                  onClick={handleSaveObs}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase transition-all disabled:opacity-50"
                >
                  {savingObs ? <span className="flex items-center gap-2 justify-center"><Loader2 className="animate-spin" size={12} />...</span> : 'Enregistrer'}
                </button>
              </div>
            </div>
          ) : (
            <div className="relative z-10">
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{obsValue || '(Aucune note)'}</p>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}
