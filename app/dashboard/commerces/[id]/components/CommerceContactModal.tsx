import React from 'react';
import ContactModal from '@/components/ContactModal';

export interface Contact {
  id: number;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  titre: string | null;
  role: string | null | undefined;
  pjPath: string | null;
  entreprise: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  newContact: Partial<Contact>;
  setNewContact: (contact: Partial<Contact>) => void;
  isSubmittingContact: boolean;
  onAddContact: (e: React.FormEvent) => void;
  onPhotoContact: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CommerceContactModal({
  isOpen,
  onClose,
  newContact,
  setNewContact,
  isSubmittingContact,
  onAddContact,
  onPhotoContact
}: Props) {
  return (
    <ContactModal
      isOpen={isOpen}
      onClose={onClose}
      newContact={newContact}
      setNewContact={setNewContact}
      isSubmittingContact={isSubmittingContact}
      onAddContact={onAddContact}
      onPhotoContact={onPhotoContact}
      title="Ajouter un Contact"
      subtitle="Personne référente pour ce commerce"
    />
  );
}
