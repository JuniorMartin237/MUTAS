import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateClientPDF = (client, souscriptions = [], sinistres = []) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const currentDate = new Date().toLocaleString();

  // En-tête
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('MUTAS', 14, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('FICHE CLIENT', pageWidth - 14, 25, { align: 'right' });
  
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(`Généré le: ${currentDate}`, pageWidth - 14, 35, { align: 'right' });
  
  doc.setDrawColor(14, 165, 233);
  doc.setLineWidth(1);
  doc.line(14, 45, pageWidth - 14, 45);

  // Informations client
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 165, 233);
  doc.text('Informations client', 14, 60);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Code client: ${client.code || '-'}`, 14, 75);
  doc.text(`Nom complet: ${client.user?.first_name || ''} ${client.user?.last_name || ''}`, 14, 83);
  doc.text(`Nom d'utilisateur: ${client.user?.username || '-'}`, 14, 91);
  doc.text(`Email: ${client.user?.email || '-'}`, 14, 99);
  doc.text(`Téléphone: ${client.user?.phone || '-'}`, 14, 107);
  doc.text(`Genre: ${client.genre === 'M' ? 'Masculin' : 'Féminin'}`, 14, 115);
  doc.text(`Date naissance: ${client.date_naissance ? new Date(client.date_naissance).toLocaleDateString() : '-'}`, 14, 123);
  doc.text(`Lieu naissance: ${client.lieu_naissance || '-'}`, 14, 131);
  doc.text(`Profession: ${client.profession || '-'}`, 14, 139);
  doc.text(`Entreprise: ${client.entreprise || '-'}`, 14, 147);

  // Souscriptions
  let yPosition = 165;
  if (souscriptions.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(14, 165, 233);
    doc.text('Souscriptions actives', 14, yPosition);
    yPosition += 10;
    
    const tableData = souscriptions.map(s => [
      s.assurance_name || s.assurance?.name || '-',
      `${s.taux_prise_en_charge}%`,
      new Date(s.date_debut).toLocaleDateString(),
      new Date(s.date_fin).toLocaleDateString(),
      s.status || 'ACTIVE'
    ]);
    
    doc.autoTable({
      startY: yPosition,
      head: [['Assurance', 'Taux', 'Date début', 'Date fin', 'Statut']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233], textColor: 255 },
      margin: { left: 14, right: 14 }
    });
    yPosition = doc.lastAutoTable.finalY + 10;
  }

  // Sinistres
  if (sinistres.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(14, 165, 233);
    doc.text('Historique des sinistres', 14, yPosition);
    yPosition += 10;
    
    const sinistresData = sinistres.map(s => [
      s.reference,
      s.type_sinistre,
      new Date(s.incident_date).toLocaleDateString(),
      s.status,
      s.estimated_amount ? `${s.estimated_amount.toLocaleString()} FCFA` : '-'
    ]);
    
    doc.autoTable({
      startY: yPosition,
      head: [['Référence', 'Type', 'Date incident', 'Statut', 'Montant estimé']],
      body: sinistresData,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233], textColor: 255 },
      margin: { left: 14, right: 14 }
    });
    yPosition = doc.lastAutoTable.finalY + 10;
  }

  // Pied de page
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Document généré par MUTAS - Page 1`, pageWidth / 2, footerY, { align: 'center' });

  doc.save(`client_${client.code}.pdf`);
};

export const generateSinistrePDF = (sinistre, documents = []) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const currentDate = new Date().toLocaleString();

  // En-tête
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('MUTAS', 14, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('FICHE SINISTRE', pageWidth - 14, 25, { align: 'right' });
  
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(`Généré le: ${currentDate}`, pageWidth - 14, 35, { align: 'right' });
  
  doc.setDrawColor(14, 165, 233);
  doc.setLineWidth(1);
  doc.line(14, 45, pageWidth - 14, 45);

  // Informations sinistre
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 165, 233);
  doc.text('Informations du sinistre', 14, 60);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Référence: ${sinistre.reference || '-'}`, 14, 75);
  doc.text(`Type: ${sinistre.type_sinistre || '-'}`, 14, 83);
  doc.text(`Statut: ${sinistre.status || '-'}`, 14, 91);
  doc.text(`Date incident: ${new Date(sinistre.incident_date).toLocaleString()}`, 14, 99);
  doc.text(`Adresse: ${sinistre.address || '-'}`, 14, 107);
  
  if (sinistre.latitude && sinistre.longitude) {
    doc.text(`Coordonnées: ${sinistre.latitude}, ${sinistre.longitude}`, 14, 115);
  }

  // Description
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 165, 233);
  doc.text('Description', 14, 135);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const description = doc.splitTextToSize(sinistre.description || '-', pageWidth - 28);
  doc.text(description, 14, 145);
  
  let yPosition = 155 + (description.length * 5);
  
  // Dégâts
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 165, 233);
  doc.text('Dégâts constatés', 14, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const damages = doc.splitTextToSize(sinistre.damages || '-', pageWidth - 28);
  doc.text(damages, 14, yPosition);
  yPosition += (damages.length * 5) + 10;
  
  // Montant
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 165, 233);
  doc.text('Informations financières', 14, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Montant estimé: ${sinistre.estimated_amount ? `${sinistre.estimated_amount.toLocaleString()} FCFA` : 'Non renseigné'}`, 14, yPosition);
  yPosition += 10;
  doc.text(`Montant approuvé: ${sinistre.approved_amount ? `${sinistre.approved_amount.toLocaleString()} FCFA` : 'Non renseigné'}`, 14, yPosition);

  // Documents
  if (documents.length > 0) {
    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(14, 165, 233);
    doc.text('Documents joints', 14, yPosition);
    yPosition += 10;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    documents.forEach((docFile, idx) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${idx + 1}. ${docFile.file_name || 'Document'} - ${docFile.media_type}`, 14, yPosition);
      yPosition += 5;
    });
  }

  // Pied de page
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Document généré par MUTAS - Page 1`, pageWidth / 2, footerY, { align: 'center' });

  doc.save(`sinistre_${sinistre.reference}.pdf`);
};