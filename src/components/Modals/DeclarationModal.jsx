import React, { useState } from 'react';
import { FiX, FiUpload, FiMapPin } from 'react-icons/fi';
import api from '../../api/client';
import toast from 'react-hot-toast';

function DeclarationModal({ isOpen, onClose, onSuccess, client }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [partialForm, setPartialForm] = useState({
    type_sinistre: 'AUTO',
    incident_date: new Date().toISOString().slice(0, 16),
    address: '',
    latitude: null,
    longitude: null
  });
  const [finalForm, setFinalForm] = useState({
    sinistre_id: null,
    description: '',
    damages: '',
    estimated_amount: '',
    media_ids: []
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => { setPartialForm({ ...partialForm, latitude: position.coords.latitude, longitude: position.coords.longitude }); toast.success('Position obtenue'); },
        () => toast.error('Impossible d\'obtenir la position')
      );
    } else { toast.error('Géolocalisation non supportée'); }
  };

  const handleCreatePartial = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const incidentDateTime = partialForm.incident_date;
    const incidentDate = incidentDateTime.split('T')[0];
    const incidentTime = incidentDateTime.split('T')[1] + ':00';
    const payload = {
      type_sinistre: partialForm.type_sinistre,
      incident_date: incidentDate,
      incident_time: incidentTime,
      address: partialForm.address,
      latitude: partialForm.latitude ? parseFloat(partialForm.latitude) : null,
      longitude: partialForm.longitude ? parseFloat(partialForm.longitude) : null,
      sinistre_id: client?.id
    };
    try {
      const response = await api.post('/sinistres/partial/', payload);
      toast.success('Déclaration partielle créée');
      setFinalForm({ ...finalForm, sinistre_id: response.data.id });
      setStep(2);
    } catch (error) { toast.error('Erreur lors de la création'); }
    finally { setSubmitting(false); }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!finalForm.sinistre_id) { toast.error('Aucun sinistre associé'); return; }
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} dépasse 10MB`); continue; }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('media_type', file.type.startsWith('image/') ? 'PHOTO' : 'DOCUMENT');
      try {
        const response = await api.post(`/sinistres/${finalForm.sinistre_id}/media/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setUploadedFiles([...uploadedFiles, { id: response.data.id, name: file.name }]);
        setFinalForm({ ...finalForm, media_ids: [...finalForm.media_ids, response.data.id] });
        toast.success(`${file.name} uploadé`);
      } catch (error) { toast.error(`Erreur upload ${file.name}`); }
    }
  };

  const handleFinalize = async (e) => {
    e.preventDefault();
    if (!finalForm.description) { toast.error('Veuillez décrire les circonstances'); return; }
    setSubmitting(true);
    try {
      await api.post('/sinistres/finalize/', {
        sinistre_id: finalForm.sinistre_id,
        description: finalForm.description,
        damages: finalForm.damages || '',
        estimated_amount: finalForm.estimated_amount ? parseFloat(finalForm.estimated_amount) : null,
        media_ids: finalForm.media_ids
      });
      toast.success('Déclaration finalisée');
      onSuccess?.();
      onClose();
    } catch (error) { toast.error('Erreur lors de la finalisation'); }
    finally { setSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-5 border-b">
          <div><h2 className="text-xl font-bold">Nouvelle déclaration</h2><p className="text-sm text-gray-500">Client: {client?.first_name} {client?.last_name}</p></div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><FiX size={22} /></button>
        </div>
        <div className="p-5">
          {step === 1 ? (
            <form onSubmit={handleCreatePartial} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Type de sinistre *</label><select name="type_sinistre" value={partialForm.type_sinistre} onChange={(e) => setPartialForm({...partialForm, type_sinistre: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="AUTO">Automobile</option><option value="HAB">Habitation</option><option value="SAN">Santé</option><option value="VOY">Voyage</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Date et heure *</label><input type="datetime-local" name="incident_date" value={partialForm.incident_date} onChange={(e) => setPartialForm({...partialForm, incident_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Adresse *</label><textarea name="address" rows={2} value={partialForm.address} onChange={(e) => setPartialForm({...partialForm, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <button type="button" onClick={getCurrentLocation} className="flex items-center gap-2 text-blue-500"><FiMapPin /> Obtenir ma position</button>
              {partialForm.latitude && <p className="text-xs text-gray-500">Lat: {partialForm.latitude}, Lng: {partialForm.longitude}</p>}
              <button type="submit" disabled={submitting} className="w-full bg-blue-500 text-white py-2 rounded-lg">Créer la déclaration partielle</button>
            </form>
          ) : (
            <form onSubmit={handleFinalize} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Description *</label><textarea name="description" rows={3} value={finalForm.description} onChange={(e) => setFinalForm({...finalForm, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Dégâts constatés</label><textarea name="damages" rows={2} value={finalForm.damages} onChange={(e) => setFinalForm({...finalForm, damages: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Montant estimé (FCFA)</label><input type="number" name="estimated_amount" value={finalForm.estimated_amount} onChange={(e) => setFinalForm({...finalForm, estimated_amount: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Pièces jointes</label><label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer"><FiUpload /> Upload fichiers<input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" /></label></div>
              {uploadedFiles.length > 0 && <div className="space-y-1">{uploadedFiles.map((f, idx) => (<div key={idx} className="flex justify-between text-sm"><span>{f.name}</span></div>))}</div>}
              <div className="flex gap-3"><button type="submit" disabled={submitting} className="flex-1 bg-blue-500 text-white py-2 rounded-lg">Finaliser</button><button type="button" onClick={() => setStep(1)} className="flex-1 border py-2 rounded-lg">Retour</button></div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeclarationModal;