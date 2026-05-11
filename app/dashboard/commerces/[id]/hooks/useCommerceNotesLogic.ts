import { useState, useEffect } from 'react';
import axios from 'axios';

interface Note {
  id: number;
  tiersId: number;
  content: string;
  author?: string;
  pjPath?: string;
  pjName?: string;
  isEmail: boolean;
  created_at: Date;
}

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

export function useCommerceNotesLogic(tiersId: number, currentUser: any) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pj, setPj] = useState<{ path: string, name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const fetchNotes = async () => {
    try {
      const res = await axios.get(`/api/commerces/${tiersId}/notes`);
      setNotes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`/api/commerces/${tiersId}/contacts`);
      setContacts(res.data);
      if (res.data.length > 0) {
        setSelectedContactId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleHarvest = async () => {
    setIsHarvesting(true);
    try {
      const res = await axios.post('/api/messaging/harvest');
      if (res.data.imported > 0) {
        fetchNotes();
      }
    } catch (err) {
      console.error('Harvest failed:', err);
    } finally {
      setIsHarvesting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/upload', formData);
      setPj({ path: res.data.url, name: res.data.name });
    } catch (err) {
      alert('Erreur lors de l\'envoi du fichier');
    } finally {
      setUploading(false);
    }
  };

  const startDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewNote((prev: string) => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() && !pj) return;
    setSubmitting(true);
    try {
      await axios.post(`/api/commerces/${tiersId}/notes`, {
        content: newNote || (pj ? `Pièce jointe : ${pj.name}` : ''),
        pjPath: pj?.path,
        pjName: pj?.name,
        sendEmail: isEmailMode,
        contactId: isEmailMode ? selectedContactId : null
      });
      setNewNote('');
      setPj(null);
      setIsEmailMode(false);
      fetchNotes();
    } catch (err) {
      alert('Erreur lors de l\'envoi de la note');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchContacts();
  }, [tiersId]);

  return {
    notes,
    loading,
    newNote,
    setNewNote,
    submitting,
    isRecording,
    pj,
    setPj,
    uploading,
    isEmailMode,
    setIsEmailMode,
    selectedContactId,
    setSelectedContactId,
    isHarvesting,
    contacts,
    handleHarvest,
    handleFileUpload,
    startDictation,
    handleSubmit
  };
}
