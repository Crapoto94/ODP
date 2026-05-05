"use client";

import React, { use, useState, useEffect } from 'react';
import { Loader2, Store, MapPin, Mail, Phone, ArrowLeft, Calendar, Clock, Plus, Trash2, Pencil } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import CommerceDispositivesManager from '@/components/CommerceDispositivesManager';
import LigneArticleModal from '@/components/LigneArticleModal';
import CommerceStepper from './components/CommerceStepper';
import CommerceNotes from './components/CommerceNotes';
import CommerceSidebar from './components/CommerceSidebar';
import CommerceContactModal from './components/CommerceContactModal';
import CommerceUploadDocModal from './components/CommerceUploadDocModal';

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

interface Props {
  params: Promise<{ id: string }>;
}

export default function CommerceDetailPage({ params }: Props) {
  const { id: paramId } = use(params);
  const [commerce, setCommerce] = useState<any>(null);
  const [dispositifsByYear, setDisposifsByYear] = useState<any>({});
  const [years, setYears] = useState<number[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [occupations, setOccupations] = useState<any[]>([]);
  const [editingLigne, setEditingLigne] = useState<any>(null);
  const [isLigneModalOpen, setIsLigneModalOpen] = useState(false);

  // Contact Management State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    titre: '',
    entreprise: '',
    role: 'CONTACT_DIRECT',
    pjPath: ''
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [noteKey, setNoteKey] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const fetchCommerceDetails = async () => {
    try {
      const res = await axios.get(`/api/commerces/${paramId}`);
      setCommerce(res.data.commerce);
      setDisposifsByYear(res.data.dispositifsByYear);
      setYears(res.data.years);
      setTimeline(res.data.timeline || []);
      setChartData(res.data.chartData || []);
      if (res.data.years.length > 0) {
        setSelectedYear(res.data.years[0]);
      }
    } catch (err) {
      console.error('Failed to fetch commerce details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOccupations = async (year: number) => {
    try {
      const res = await axios.get('/api/occupations', {
        params: {
          type: 'COMMERCE',
          anneeTaxation: year
        }
      });
      const commerceOccs = (res.data || []).filter((occ: any) => occ.tiersId === parseInt(paramId));
      setOccupations(commerceOccs);
    } catch (err) {
      console.error('Failed to fetch occupations:', err);
    }
  };

  const getDispositivesTimeline = () => {
    const timelineByYear: Record<number, any[]> = {};

    years.forEach(year => {
      timelineByYear[year] = [];
      occupations.forEach((occ: any) => {
        (occ.lignes || []).forEach((ligne: any) => {
          const status = ligne.deletedAt ? 'supprimé' :
            (ligne.dateDebut && new Date(ligne.dateDebut).getFullYear() === year) ? 'nouveau' :
            'reconduit';

          timelineByYear[year].push({
            id: ligne.id,
            designation: ligne.article?.designation,
            status,
            date: ligne.deletedAt || ligne.dateDebut,
            quantite: ligne.quantite1,
            montant: ligne.quantite1 * (ligne.article?.montant || 0)
          });
        });
      });
    });

    return timelineByYear;
  };

  const getTotalAmountForYear = (year: number) => {
    let total = 0;
    occupations.forEach((occ: any) => {
      (occ.lignes || []).filter((ligne: any) => !ligne.deletedAt).forEach((ligne: any) => {
        total += ligne.quantite1 * (ligne.article?.montant || 0);
      });
    });
    return total;
  };

  const getStepperState = () => {
    const totalAmount = occupations.reduce((sum: number, occ: any) => {
      const occAmount = (occ.lignes || []).filter((l: any) => !l.deletedAt).reduce((s: number, l: any) => s + (l.quantite1 * (l.article?.montant || 0)), 0);
      return sum + occAmount;
    }, 0);

    // Get the most advanced status from all occupations
    let currentStatus = 'EN_ATTENTE';
    if (occupations.length > 0) {
      // Find the highest step among all occupations
      occupations.forEach((occ: any) => {
        const status = occ.statut || 'EN_ATTENTE';
        // Map to step IDs for comparison
        const statusPriority: Record<string, number> = {
          'EN_ATTENTE': 0,
          'INITIALISATION': 0,
          'INST': 1,
          'INSTRUCTION': 1,
          'PREP': 2,
          'PREPARATION_AOT': 2,
          'EN_COURS': 3,
          'VALIDE': 4,
          'VALIDÉ': 4,
          'VERIFIE': 4,
          'FACTURE': 5,
          'FACTURÉ': 5,
          'TITRE': 6,
          'TITRÉ': 6,
          'CLOS': 7,
          'PAYÉ': 7,
          'PAYE': 7
        };

        const currentPriority = statusPriority[currentStatus] ?? 0;
        const occPriority = statusPriority[status] ?? 0;

        if (occPriority > currentPriority) {
          currentStatus = status;
        }
      });
    }

    return { totalAmount, currentStatus };
  };

  // Document & Contact Management Functions
  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`/api/commerces/${paramId}/notes`);
      const docsFromNotes = (res.data || [])
        .filter((note: any) => note.pjPath && note.pjName)
        .map((note: any) => ({
          id: note.id,
          description: note.content,
          name: note.pjName,
          path: note.pjPath,
          created_at: note.created_at
        }));
      setDocuments(docsFromNotes);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`/api/commerces/${paramId}/contacts`);
      setContacts(res.data);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    try {
      if (editingContactId) {
        await axios.patch(`/api/commerces/${paramId}/contacts/${editingContactId}`, newContact);
      } else {
        await axios.post(`/api/commerces/${paramId}/contacts`, newContact);
      }
      await fetchContacts();
      setIsContactModalOpen(false);
      setEditingContactId(null);
      setNewContact({ nom: '', prenom: '', email: '', telephone: '', titre: '', entreprise: '', role: 'CONTACT_DIRECT', pjPath: '' });
    } catch (err) {
      console.error('Failed to save contact:', err);
      alert('Erreur lors de l\'enregistrement du contact');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleOpenEditContact = (contact: Contact) => {
    setEditingContactId(contact.id);
    setNewContact(contact);
    setIsContactModalOpen(true);
  };

  const handleDeleteContact = async (id: number) => {
    if (!confirm('Supprimer ce contact?')) return;
    try {
      await axios.delete(`/api/commerces/${paramId}/contacts/${id}`);
      await fetchContacts();
    } catch (err) {
      console.error('Failed to delete contact:', err);
      alert('Erreur lors de la suppression du contact');
    }
  };

  const handlePhotoContact = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('/api/upload', formData);
      setNewContact({ ...newContact, pjPath: res.data.url });
    } catch (err) {
      alert('Erreur lors de l\'upload de la photo');
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setCurrentUser(res.data);
    } catch (e) {}
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await axios.patch(`/api/commerces/${paramId}/status`, {
        statut: newStatus
      });
      // Refresh occupations to get updated status
      if (selectedYear) {
        await fetchOccupations(selectedYear);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddDocument = () => {
    setIsDocModalOpen(true);
  };

  const handleUploadDocument = async (docName: string, file: File) => {
    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('/api/upload', formData);
      // Create a note with the document
      await axios.post(`/api/commerces/${paramId}/notes`, {
        content: docName,
        pjPath: res.data.url,
        pjName: file.name,
        isEmail: false
      });
      // Refresh documents from the newly created note
      await fetchDocuments();
      setIsDocModalOpen(false);
    } catch (err) {
      console.error('Failed to upload document:', err);
      alert('Erreur lors de l\'ajout du document');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Supprimer ce document ?')) return;
    try {
      await axios.delete(`/api/commerces/${paramId}/notes/${docId}`);
      await fetchDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Erreur lors de la suppression du document');
    }
  };

  useEffect(() => {
    if (paramId) {
      fetchCommerceDetails();
    }
  }, [paramId]);

  useEffect(() => {
    if (selectedYear) {
      fetchOccupations(selectedYear);
    }
  }, [selectedYear]);

  useEffect(() => {
    if (paramId) {
      fetchContacts();
      fetchDocuments();
      fetchCurrentUser();
    }
  }, [paramId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement du commerce...</p>
      </div>
    );
  }

  if (!commerce) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-bold text-slate-900">Commerce non trouvé</p>
        <Link href="/dashboard/commerces" className="text-blue-600 hover:underline mt-4 inline-block">Retour à la liste</Link>
      </div>
    );
  }

  const displayedDispositions = selectedYear && dispositifsByYear[selectedYear] ? dispositifsByYear[selectedYear] : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/commerces"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Store size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">{commerce.nom}</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Tous les dispositifs</p>
          </div>
        </div>
      </div>

      {/* Commerce Info Card */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
        {commerce.adresse && (
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Adresse</p>
              <p className="text-sm font-medium text-slate-900">{commerce.adresse}</p>
            </div>
          </div>
        )}

        {commerce.email && (
          <div className="flex items-start gap-3">
            <Mail size={20} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Email</p>
              <p className="text-sm font-medium text-slate-900">{commerce.email}</p>
            </div>
          </div>
        )}

        {commerce.telephone && (
          <div className="flex items-start gap-3">
            <Phone size={20} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Téléphone</p>
              <p className="text-sm font-medium text-slate-900">{commerce.telephone}</p>
            </div>
          </div>
        )}

        {selectedYear && (
          <div className="flex items-start gap-3 border-t border-slate-200 pt-4">
            <Calendar size={20} className="text-blue-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase">Montant à facturer ({selectedYear})</p>
              <p className="text-2xl font-black text-blue-600">{getTotalAmountForYear(selectedYear).toFixed(2)} €</p>
            </div>
          </div>
        )}
      </div>

      {/* Commerce Workflow Stepper */}
      {(() => {
        const state = getStepperState();
        return (
          <CommerceStepper
            {...state}
            onStatusChange={handleStatusChange}
            isUpdating={isUpdatingStatus}
          />
        );
      })()}

      {/* Year Selector */}
      {years.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-700">Filtrer par année</label>
          <div className="flex flex-wrap gap-2">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  selectedYear === year
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Calendar size={16} />
                {year}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline par année */}
      {years.length > 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Clock size={20} />
              Chronologie des dispositifs par année
            </h2>
            <div className="text-sm text-slate-500 mt-2 flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Nouveau</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Supprimé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
                <span>Reconduit</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(getDispositivesTimeline()).reverse().map(([year, items]) => {
              const nouveau = items.filter((i: any) => i.status === 'nouveau').length;
              const supprime = items.filter((i: any) => i.status === 'supprimé').length;
              const reconduit = items.filter((i: any) => i.status === 'reconduit').length;
              const totalMontant = items.filter((i: any) => i.status !== 'supprimé').reduce((sum: number, i: any) => sum + i.montant, 0);

              return (
                <div key={year} className="bg-white rounded-xl border-2 border-blue-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-center">
                    <h3 className="text-3xl font-black text-blue-600 mb-2">{year}</h3>
                    <p className="text-xs font-bold text-slate-500 mb-4">{items.length} dispositif{items.length !== 1 ? 's' : ''}</p>

                    <div className="space-y-2 mb-4 text-sm">
                      {nouveau > 0 && <div className="flex items-center justify-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span className="text-slate-700">{nouveau} nouveau{nouveau !== 1 ? 'x' : ''}</span></div>}
                      {reconduit > 0 && <div className="flex items-center justify-center gap-2"><div className="w-2 h-2 bg-slate-500 rounded-full"></div><span className="text-slate-700">{reconduit} reconduit{reconduit !== 1 ? 's' : ''}</span></div>}
                      {supprime > 0 && <div className="flex items-center justify-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div><span className="text-slate-700">{supprime} supprimé{supprime !== 1 ? 's' : ''}</span></div>}
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-xs font-bold text-slate-500">Montant total</p>
                      <p className="text-xl font-black text-slate-900">{totalMontant.toFixed(2)} €</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart - Montants facturés par année */}
      {chartData.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Montants facturés par année</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Total et montants facturés</p>
          </div>

          {/* Check if we have any non-zero amounts */}
          {chartData.every((d: any) => d.total === 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-bold text-amber-900">
                ⚠️ Pas de montants définis pour ces dossiers
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Les montants des articles ne sont pas configurés ou les tarifs sont en erreur (ERREUR_TARIF).
                Veuillez vérifier la configuration des tarifs.
              </p>
            </div>
          )}
          <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
            {/* Legend */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs font-bold text-slate-700">Facturé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <span className="text-xs font-bold text-slate-700">Non facturé</span>
              </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(year) => `'${String(year).slice(-2)}`}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      const notBilled = (data.amount || 0) - (data.billed || 0);
                      return (
                        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
                          <p className="text-xs font-bold text-slate-900">Année {data.year}</p>
                          <p className="text-xs text-green-700 font-bold">
                            ✓ Facturé: {(data.billed || 0).toFixed(2)}€
                          </p>
                          <p className="text-xs text-amber-700 font-bold">
                            ✗ Non facturé: {notBilled.toFixed(2)}€
                          </p>
                          <p className="text-xs font-bold text-slate-900 mt-1">
                            Total: {(data.amount || 0).toFixed(2)}€
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {data.billedPercentage}% facturé
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="billed" stackId="amount" fill="#22c55e" name="Facturé" radius={[8, 8, 0, 0]} />
                <Bar dataKey="notBilled" stackId="amount" fill="#fbbf24" name="Non facturé" radius={[8, 8, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Status breakdown */}
            <div className="grid grid-cols-2 gap-4">
              {chartData.map((item, idx) => (
                <div key={idx} className="text-xs space-y-1">
                  <p className="font-bold text-slate-900">'{String(item.year).slice(-2)}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-slate-600">Facturé: {(item.billed || 0).toFixed(0)}€</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    <span className="text-slate-600">Non: {(item.notBilled || 0).toFixed(0)}€</span>
                  </div>
                  <p className="text-xs text-slate-500 font-bold">{item.billedPercentage}% facturé</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content + Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Dispositifs List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Dispositifs {selectedYear && `(${selectedYear})`}
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {displayedDispositions.length} dispositif{displayedDispositions.length !== 1 ? 's' : ''}
                </p>
              </div>
              {selectedYear && (
                <CommerceDispositivesManager
                  tiersId={parseInt(paramId)}
                  selectedYear={selectedYear}
                  onDispositivesAdded={fetchCommerceDetails}
                />
              )}
            </div>

            {/* Détail des lignes par occupation */}
            {selectedYear && occupations.length > 0 && (
              <div className="space-y-4 bg-slate-50 rounded-xl p-6">
                <h3 className="text-lg font-black text-slate-900">Détail des dispositifs</h3>
                <div className="space-y-3">
                  {occupations.flatMap((occ: any) =>
                    (occ.lignes || []).filter((ligne: any) => !ligne.deletedAt).map((ligne: any) => (
                      <div
                        key={ligne.id}
                        className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{ligne.article?.designation}</p>
                          <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-slate-600">
                            <div>
                              <span className="text-xs font-bold text-slate-400">Quantité</span>
                              <p className="font-bold text-slate-900">{ligne.quantite1}</p>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-400">Montant</span>
                              <p className="font-bold text-slate-900">{(ligne.quantite1 * (ligne.article?.montant || 0)).toFixed(2)} €</p>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-400">Période</span>
                              <p className="font-bold text-slate-900">
                                {ligne.dateDebut ? new Date(ligne.dateDebut).toLocaleDateString('fr-FR') : '-'}
                                {' à '}
                                {ligne.dateFin ? new Date(ligne.dateFin).toLocaleDateString('fr-FR') : '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingLigne(ligne);
                              setIsLigneModalOpen(true);
                            }}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                            title="Éditer"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Supprimer ce dispositif?')) {
                                try {
                                  await axios.delete(`/api/occupations/${occ.id}/lignes/${ligne.id}`);
                                  await fetchOccupations(selectedYear);
                                } catch (err) {
                                  console.error('Erreur suppression:', err);
                                  alert('Erreur lors de la suppression du dispositif');
                                }
                              }
                            }}
                            className="p-2 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Modal for editing ligne */}
            {editingLigne && selectedYear && (
              <LigneArticleModal
                isOpen={isLigneModalOpen}
                onClose={() => {
                  setIsLigneModalOpen(false);
                  setEditingLigne(null);
                }}
                onSave={() => {
                  setIsLigneModalOpen(false);
                  setEditingLigne(null);
                  fetchOccupations(selectedYear);
                }}
                occupationId={editingLigne.occupationId}
                annee={selectedYear}
                defaultDates={{
                  start: new Date(selectedYear, 0, 1).toISOString().split('T')[0],
                  end: new Date(selectedYear, 11, 31).toISOString().split('T')[0]
                }}
                initialData={editingLigne}
                occupationType="COMMERCE"
              />
            )}
          </div>

          {/* Discussion Thread */}
          {currentUser && (
            <CommerceNotes
              key={noteKey}
              tiersId={parseInt(paramId)}
              currentUser={currentUser}
            />
          )}
        </div>

        {/* Sidebar */}
        <CommerceSidebar
          tiersId={parseInt(paramId)}
          contacts={contacts}
          documents={documents}
          isFactured={commerce?.isFactured}
          onOpenContactModal={() => setIsContactModalOpen(true)}
          onDeleteContact={handleDeleteContact}
          onEditContact={handleOpenEditContact}
          isContactsLoading={false}
          onAddDocument={handleAddDocument}
          onDeleteDocument={handleDeleteDocument}
        />
      </div>

      {/* Contact Modal */}
      <CommerceContactModal
        isOpen={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
          setEditingContactId(null);
          setNewContact({ nom: '', prenom: '', email: '', telephone: '', titre: '', entreprise: '', role: 'CONTACT_DIRECT', pjPath: '' });
        }}
        newContact={newContact}
        setNewContact={setNewContact}
        isSubmittingContact={isSubmittingContact}
        onAddContact={handleAddContact}
        onPhotoContact={handlePhotoContact}
      />

      {/* Document Upload Modal */}
      <CommerceUploadDocModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onUpload={handleUploadDocument}
        isUploading={isUploadingDoc}
      />
    </div>
  );
}
