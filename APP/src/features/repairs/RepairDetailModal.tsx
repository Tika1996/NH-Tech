import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui/Toast';
import {
  X,
  User,
  Phone,
  Laptop,
  Wrench,
  Search,
  Plus,
  Trash2,
  Printer,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  PhoneOff,
  MessageSquare,
  ChevronDown,
  DollarSign,
  Settings2,
  FileText,
  UserCog,
  Package,
  Loader2,
  Edit2,
  Save,
  Tag,
  Check,
  Zap,
  Building2,
  History,
  Edit3
} from 'lucide-react';
import {
  repairsCollection,
  staffCollection,
  type RepairDossier,
  type RepairStatus,
  type RepairPart,
  type ContactLogEntry,
  type RepairDiagnostic
} from '../../lib/firebase';
import { REPAIR_STATUS_CONFIG } from './RepairsPage';
import { DepositSlip } from './DepositSlip';

interface RepairDetailModalProps {
  repair: RepairDossier;
  onClose: () => void;
  onUpdated: () => void;
}

const STATUS_ACTIONS: Record<RepairStatus, { label: { fr: string; ar: string; en: string }; nextStatus: RepairStatus; color: string }[]> = {
  deposited: [
    { label: { fr: 'Commencer le diagnostic', ar: 'بدء التشخيص', en: 'Start Diagnosis' }, nextStatus: 'diagnosing', color: '#0057FF' },
  ],
  diagnosing: [
    { label: { fr: 'Diagnostic terminé (Devis)', ar: 'تم التشخيص', en: 'Diagnosis Completed (Quote)' }, nextStatus: 'waiting_approval', color: '#ea580c' },
    { label: { fr: 'Réparer directement', ar: 'إصلاح مباشر', en: 'Repair Directly' }, nextStatus: 'repairing', color: '#2563eb' },
  ],
  waiting_approval: [
    { label: { fr: 'Client approuve le devis', ar: 'العميل يوافق', en: 'Client Approved Quote' }, nextStatus: 'approved', color: '#16a34a' },
    { label: { fr: 'Client refuse le devis', ar: 'العميل يرفض', en: 'Client Rejected Quote' }, nextStatus: 'cancelled', color: '#dc2626' },
  ],
  approved: [
    { label: { fr: 'Commencer la réparation', ar: 'بدء الإصلاح', en: 'Start Repair' }, nextStatus: 'repairing', color: '#2563eb' },
  ],
  repairing: [
    { label: { fr: 'En attente de pièces', ar: 'في انتظار القطع', en: 'Waiting for Parts' }, nextStatus: 'waiting_parts', color: '#ca8a04' },
    { label: { fr: 'Réparation terminée', ar: 'تم الإصلاح', en: 'Repair Completed' }, nextStatus: 'completed', color: '#16a34a' },
  ],
  waiting_parts: [
    { label: { fr: 'Pièces reçues — Reprendre', ar: 'استئناف الإصلاح', en: 'Parts Received — Resume' }, nextStatus: 'repairing', color: '#2563eb' },
  ],
  completed: [
    { label: { fr: 'Contacter le client', ar: 'الاتصال بالعميل', en: 'Contact Client' }, nextStatus: 'notified', color: '#059669' },
  ],
  notified: [
    { label: { fr: 'Client a récupéré l\'appareil', ar: 'تم التسليم', en: 'Device Picked Up' }, nextStatus: 'picked_up', color: '#64748b' },
    { label: { fr: 'Client non joignable', ar: 'العميل غير متاح', en: 'Client Unreachable' }, nextStatus: 'unreachable', color: '#dc2626' },
  ],
  picked_up: [],
  unreachable: [
    { label: { fr: 'Relancer appel client', ar: 'إعادة المحاولة', en: 'Retry Calling Client' }, nextStatus: 'notified', color: '#059669' },
    { label: { fr: 'Client a récupéré', ar: 'تم التسليم', en: 'Device Picked Up' }, nextStatus: 'picked_up', color: '#64748b' },
  ],
  cancelled: [],
};

export function RepairDetailModal({ repair: initialRepair, onClose, onUpdated }: RepairDetailModalProps) {
  const { language, currentUser } = useAppStore();
  const isAr = language === 'ar';
  const { showToast } = useToast();

  const [repair, setRepair] = useState<RepairDossier>(initialRepair);
  const [saving, setSaving] = useState(false);
  const [showDepositSlip, setShowDepositSlip] = useState(false);

  // Diagnostic form
  const [showDiagForm, setShowDiagForm] = useState(false);
  const [diagDesc, setDiagDesc] = useState(repair.diagnostic?.description || '');
  const [diagCost, setDiagCost] = useState(repair.diagnostic?.estimatedCost?.toString() || '');
  const [diagDuration, setDiagDuration] = useState(repair.diagnostic?.estimatedDuration || '');

  // Parts form
  const [showAddPart, setShowAddPart] = useState(false);
  const [partName, setPartName] = useState('');
  const [partSource, setPartSource] = useState<'stock_nh' | 'external'>('stock_nh');
  const [partPurchasePrice, setPartPurchasePrice] = useState('');
  const [partSellingPrice, setPartSellingPrice] = useState('');
  const [partQty, setPartQty] = useState('1');

  // Contact log form
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMethod, setContactMethod] = useState<'phone' | 'sms' | 'whatsapp'>('phone');
  const [contactResult, setContactResult] = useState<'answered' | 'no_answer' | 'voicemail' | 'callback_requested'>('answered');
  const [contactNotes, setContactNotes] = useState('');

  // Labor cost
  const [laborCost, setLaborCost] = useState(repair.laborCost?.toString() || '0');

  // Reassignment
  const [showReassign, setShowReassign] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [reassignType, setReassignType] = useState<'technician' | 'partner_shop'>('technician');
  const [reassignStaffId, setReassignStaffId] = useState('');
  const [reassignShopName, setReassignShopName] = useState('');

  useEffect(() => {
    staffCollection.getAll().then(data => {
      setStaff(data.filter((s: any) => s.isActive !== false));
    }).catch(() => {});
  }, []);

  const conf = REPAIR_STATUS_CONFIG[repair.status] || REPAIR_STATUS_CONFIG.deposited;
  const actions = STATUS_ACTIONS[repair.status] || [];

  // Updates
  const updateRepair = async (updates: Partial<RepairDossier>) => {
    setSaving(true);
    try {
      await repairsCollection.update(repair.id, updates);
      setRepair(prev => ({ ...prev, ...updates }));
      onUpdated();
      showToast(isAr ? 'تم تحديث الملف' : 'Dossier mis à jour !', 'success');
    } catch (err) {
      console.error('Update error:', err);
      showToast(isAr ? 'خطأ في التحديث' : 'Erreur de mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (nextStatus: RepairStatus) => {
    const updates: Partial<RepairDossier> = { status: nextStatus };
    if (nextStatus === 'completed') updates.completedDate = new Date().toISOString().split('T')[0];
    if (nextStatus === 'picked_up') updates.pickupDate = new Date().toISOString().split('T')[0];
    await updateRepair(updates);
  };

  const handleSaveDiag = async () => {
    const diagnostic: RepairDiagnostic = {
      description: diagDesc.trim(),
      estimatedCost: parseFloat(diagCost) || 0,
      estimatedDuration: diagDuration.trim(),
      diagnosedAt: new Date().toISOString().split('T')[0],
      diagnosedBy: currentUser?.name || currentUser?.email || 'Staff',
    };
    await updateRepair({ diagnostic });
    setShowDiagForm(false);
  };

  const handleAddPart = async () => {
    if (!partName.trim()) return;
    const newPart: RepairPart = {
      id: `part-${Date.now()}`,
      name: partName.trim(),
      source: partSource,
      purchasePrice: parseFloat(partPurchasePrice) || 0,
      sellingPrice: parseFloat(partSellingPrice) || 0,
      quantity: parseInt(partQty) || 1,
    };
    const updatedParts = [...repair.parts, newPart];
    const totalPartsCost = updatedParts.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
    const labor = parseFloat(laborCost) || 0;
    await updateRepair({ parts: updatedParts, totalPartsCost, totalAmount: labor + totalPartsCost });
    setPartName(''); setPartPurchasePrice(''); setPartSellingPrice(''); setPartQty('1');
    setShowAddPart(false);
  };

  const handleRemovePart = async (partId: string) => {
    const updatedParts = repair.parts.filter(p => p.id !== partId);
    const totalPartsCost = updatedParts.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
    const labor = parseFloat(laborCost) || 0;
    await updateRepair({ parts: updatedParts, totalPartsCost, totalAmount: labor + totalPartsCost });
  };

  const handleAddContact = async () => {
    const now = new Date();
    const entry: ContactLogEntry = {
      id: `contact-${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      method: contactMethod,
      result: contactResult,
      notes: contactNotes.trim() || undefined,
      calledBy: currentUser?.name || currentUser?.email || 'Staff',
    };
    await updateRepair({ contactLog: [...repair.contactLog, entry] });
    setContactNotes(''); setShowContactForm(false);
  };

  const handleSaveLaborCost = async () => {
    const labor = parseFloat(laborCost) || 0;
    const totalPartsCost = repair.parts.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
    await updateRepair({ laborCost: labor, totalPartsCost, totalAmount: labor + totalPartsCost });
  };

  const [reassignNotes, setReassignNotes] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleReassign = async () => {
    let assignedTo: RepairDossier['assignedTo'] = null;
    if (reassignType === 'technician' && reassignStaffId) {
      const s = staff.find((st: any) => st.id === reassignStaffId);
      if (s) assignedTo = { type: 'technician', id: s.id, name: s.name || s.email };
    } else if (reassignType === 'partner_shop' && reassignShopName.trim()) {
      assignedTo = { type: 'partner_shop', id: `shop-${Date.now()}`, name: reassignShopName.trim() };
    }

    const now = new Date();
    const historyEntry = {
      id: `assign-${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      assignedTo,
      previousAssignedTo: repair.assignedTo || null,
      changedBy: currentUser?.name || currentUser?.email || 'Staff',
      notes: reassignNotes.trim() || undefined,
    };

    const updatedHistory = [...(repair.assignmentHistory || []), historyEntry];
    await updateRepair({ assignedTo, assignmentHistory: updatedHistory });
    setReassignNotes('');
    setShowReassign(false);
  };

  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) return;

    const partsRows = repair.parts.map(p => `
      <tr>
        <td>${p.name}</td>
        <td>${p.source === 'stock_nh' ? 'Stock NH' : 'Externe'}</td>
        <td>${p.quantity}</td>
        <td>${p.sellingPrice.toLocaleString()} DA</td>
        <td>${(p.sellingPrice * p.quantity).toLocaleString()} DA</td>
      </tr>
    `).join('');

    printWindow.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8" />
      <title>Facture Réparation — ${repair.id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, sans-serif; padding: 30px; color: #1a1a2e; max-width: 600px; margin: 0 auto; }
        .inv-header { text-align: center; border-bottom: 2px solid #1a1a2e; padding-bottom: 12px; margin-bottom: 20px; }
        .inv-header h1 { font-size: 1.4rem; color: #0055ff; }
        .inv-title { text-align: center; font-size: 1rem; font-weight: 800; background: #0055ff; color: #fff; padding: 8px; border-radius: 4px; margin-bottom: 20px; }
        .inv-info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 0.85rem; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f0f0f0; padding: 8px; text-align: left; font-size: 0.78rem; text-transform: uppercase; color: #666; border-bottom: 2px solid #ccc; }
        td { padding: 8px; border-bottom: 1px solid #eee; font-size: 0.85rem; }
        .totals { text-align: right; margin-top: 10px; }
        .totals .row { display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0; font-size: 0.88rem; }
        .totals .grand { font-size: 1.15rem; font-weight: 800; color: #0055ff; border-top: 2px solid #1a1a2e; padding-top: 8px; margin-top: 8px; }
      </style>
    </head><body>
      <div class="inv-header"><h1>NH TECH</h1><p style="font-size:0.75rem;color:#555">Facture de Réparation</p></div>
      <div class="inv-title">FACTURE RÉPARATION — ${repair.id}</div>
      <div class="inv-info">
        <div><strong>Client:</strong> ${repair.customerName}<br/><strong>Tél:</strong> ${repair.customerPhone}</div>
        <div style="text-align:right"><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}<br/><strong>Appareil:</strong> ${repair.deviceBrand} ${repair.deviceModel}</div>
      </div>
      <table><thead><tr><th>Désignation</th><th>Source</th><th>Qté</th><th>P.U.</th><th>Total</th></tr></thead><tbody>${partsRows}</tbody></table>
      <div class="totals">
        <div class="row"><span>Pièces:</span><strong>${repair.totalPartsCost.toLocaleString()} DA</strong></div>
        <div class="row"><span>Main d'œuvre:</span><strong>${repair.laborCost.toLocaleString()} DA</strong></div>
        <div class="row grand"><span>TOTAL:</span><strong>${repair.totalAmount.toLocaleString()} DA</strong></div>
      </div>
      <script>window.onload=function(){window.print();window.close();};</script>
    </body></html>`);
    printWindow.document.close();
  };

  if (showDepositSlip) {
    return <DepositSlip repair={repair} onClose={() => setShowDepositSlip(false)} />;
  }

  return (
    <div className="nh-modal-backdrop" onClick={onClose}>
      <div className="nh-modern-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 740 }}>
        {/* Header */}
        <div className="nh-modal-header">
          <div className="nh-header-icon-box">
            <Wrench size={22} color="#0057FF" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h3 className="nh-modal-title" style={{ fontSize: '1.2rem' }}>{repair.id}</h3>
              <span className="repair-status-badge" style={{ background: conf.bg, color: conf.color }}>
                {conf.label[language] || conf.label.fr}
              </span>
            </div>
            <p className="nh-modal-subtitle">
              {isAr ? 'تفاصيل ملف الصيانة ومتابعة الحالة' : 'Gestion du dossier de réparation & suivi technique'}
            </p>
          </div>
          <button className="nh-modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="nh-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Client & Device Card */}
          <div className="nh-summary-preview-box">
            <div className="nh-summary-head">
              <User size={16} />
              <span>{isAr ? 'معلومات العميل والجهاز' : 'Fiche Client & Appareil Déposé'}</span>
            </div>
            <div className="nh-summary-grid">
              <div>
                <span className="lbl">{isAr ? 'العميل' : 'Nom Client'}</span>
                <strong className="val">{repair.customerName}</strong>
              </div>
              <div>
                <span className="lbl">{isAr ? 'الهاتف' : 'Téléphone'}</span>
                <strong className="val" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Phone size={13} color="#0057FF" /> {repair.customerPhone}
                </strong>
              </div>
              <div>
                <span className="lbl">{isAr ? 'الجهاز' : 'Appareil'}</span>
                <strong className="val">{repair.deviceBrand} {repair.deviceModel} ({repair.deviceType})</strong>
              </div>
              <div>
                <span className="lbl">{isAr ? 'تاريخ الإيداع' : 'Date d\'échéance / Dépôt'}</span>
                <strong className="val">{repair.depositDate}</strong>
              </div>
            </div>
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border-secondary)', fontSize: '0.85rem' }}>
              <span className="lbl" style={{ marginBottom: 2 }}>{isAr ? 'الأعطال المصرح بها' : 'Symptômes & Problème Déclaré'}:</span>
              <strong className="val" style={{ color: '#EF4444' }}>{repair.issueDescription}</strong>
            </div>
          </div>

          {/* Section: Assignment */}
          <div className="nh-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="nh-label">
                <UserCog size={16} color="#0057FF" />
                <span>{isAr ? 'المسؤول المكلف' : 'Responsable de la réparation'}</span>
              </label>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#0057FF', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={() => setShowReassign(!showReassign)}
              >
                <span>{isAr ? 'تغيير' : 'Changer'}</span>
                <Edit3 size={13} />
              </button>
            </div>
            {repair.assignedTo ? (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                {repair.assignedTo.type === 'partner_shop' ? <Building2 size={16} color="#0057FF" /> : <User size={16} color="#0057FF" />}
                <span>{repair.assignedTo.type === 'partner_shop' ? 'Magasin Partenaire: ' : 'Technicien: '}</span>
                <span style={{ color: '#0057FF' }}>{repair.assignedTo.name}</span>
              </div>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                {isAr ? 'لم يتم التعيين بعد' : 'Non assigné (À attribuer)'}
              </span>
            )}
            {showReassign && (
              <div style={{ marginTop: 8, padding: 14, background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-secondary)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setReassignType('technician')} className={`nh-chip ${reassignType === 'technician' ? 'active' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <User size={13} /> Technicien
                  </button>
                  <button type="button" onClick={() => setReassignType('partner_shop')} className={`nh-chip ${reassignType === 'partner_shop' ? 'active' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Building2 size={13} /> Magasin Partenaire
                  </button>
                </div>
                {reassignType === 'technician' ? (
                  <select className="nh-select" value={reassignStaffId} onChange={e => setReassignStaffId(e.target.value)}>
                    <option value="">-- Sélectionner Technicien --</option>
                    {staff.map((s: any) => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
                  </select>
                ) : (
                  <input className="nh-input" value={reassignShopName} onChange={e => setReassignShopName(e.target.value)} placeholder="Nom du magasin externe..." />
                )}
                <input className="nh-input" value={reassignNotes} onChange={e => setReassignNotes(e.target.value)} placeholder="Motif du changement (optionnel)..." />
                <button type="button" className="nh-btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', alignSelf: 'flex-start' }} onClick={handleReassign}>Enregistrer l'assignation</button>
              </div>
            )}

            {/* Assignment History Timeline Toggle */}
            {(repair.assignmentHistory && repair.assignmentHistory.length > 0) && (
              <div style={{ marginTop: 6 }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#0057FF', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <History size={14} />
                  <span>{isAr ? 'سجل التعيينات' : 'Voir l\'historique des réassignations'} ({repair.assignmentHistory.length})</span>
                  <ChevronDown size={14} style={{ transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {showHistory && (
                  <div style={{ marginTop: 8, padding: 12, borderRadius: 10, background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {repair.assignmentHistory.map((h, idx) => (
                      <div key={h.id || idx} style={{ fontSize: '0.8rem', paddingBottom: 6, borderBottom: idx < repair.assignmentHistory!.length - 1 ? '1px dashed var(--border-secondary)' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {h.assignedTo ? (h.assignedTo.type === 'partner_shop' ? <Building2 size={13} color="#0057FF" /> : <User size={13} color="#0057FF" />) : <Clock size={13} color="#94a3b8" />}
                            <span>{h.assignedTo ? h.assignedTo.name : 'Non assigné'}</span>
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{h.date} à {h.time}</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          Précédent: <strong>{h.previousAssignedTo?.name || 'Non assigné'}</strong> • Changé par: <strong>{h.changedBy}</strong>
                        </div>
                        {h.notes && <div style={{ fontSize: '0.74rem', color: '#0057FF', marginTop: 2 }}>Motif: {h.notes}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section: Diagnostic */}
          <div className="nh-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="nh-label">
                <Search size={16} color="#0057FF" />
                <span>{isAr ? 'التشخيص والتقييم' : 'Rapport de Diagnostic'}</span>
              </label>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#0057FF', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800 }}
                onClick={() => setShowDiagForm(!showDiagForm)}
              >
                {repair.diagnostic ? (isAr ? 'تعديل' : 'Modifier') : (isAr ? 'إضافة' : '+ Rédiger diagnostic')}
              </button>
            </div>

            {repair.diagnostic ? (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div><strong>Constat technique:</strong> {repair.diagnostic.description}</div>
                <div style={{ display: 'flex', gap: 16, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><DollarSign size={13} color="#16a34a" /> Devis: <strong style={{ color: '#16a34a' }}>{repair.diagnostic.estimatedCost.toLocaleString()} DZD</strong></span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={13} /> Délai estimé: <strong>{repair.diagnostic.estimatedDuration}</strong></span>
                </div>
              </div>
            ) : (
              !showDiagForm && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Aucun diagnostic rédigé pour le moment</span>
            )}

            {showDiagForm && (
              <div style={{ marginTop: 8, padding: 14, background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-secondary)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea className="nh-textarea" value={diagDesc} onChange={e => setDiagDesc(e.target.value)} placeholder="Description du problème identifié et travaux requis..." rows={2} />
                <div className="nh-form-row">
                  <input className="nh-input" type="number" value={diagCost} onChange={e => setDiagCost(e.target.value)} placeholder="Devis estimé (DZD)" />
                  <input className="nh-input" value={diagDuration} onChange={e => setDiagDuration(e.target.value)} placeholder="Durée estimée (ex: 48 heures)" />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="nh-btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={handleSaveDiag}>Enregistrer le Diagnostic</button>
                  <button type="button" className="nh-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => setShowDiagForm(false)}>Annuler</button>
                </div>
              </div>
            )}
          </div>

          {/* Section: Parts */}
          <div className="nh-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="nh-label">
                <Package size={16} color="#0057FF" />
                <span>{isAr ? 'القطع واللوازم' : 'Pièces de rechange & Composants'}</span>
              </label>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#0057FF', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800 }}
                onClick={() => setShowAddPart(!showAddPart)}
              >
                + Ajouter une pièce
              </button>
            </div>

            {repair.parts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {repair.parts.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', borderRadius: 10, fontSize: '0.85rem' }}>
                    <div>
                      <strong style={{ display: 'block' }}>{p.quantity}x {p.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Source: {p.source === 'stock_nh' ? 'Stock NH TECH' : 'Achat Externe'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <strong style={{ color: '#0057FF', fontSize: '0.95rem' }}>{(p.sellingPrice * p.quantity).toLocaleString()} DZD</strong>
                      <button type="button" onClick={() => handleRemovePart(p.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !showAddPart && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Aucune pièce ajoutée au dossier</span>
            )}

            {showAddPart && (
              <div style={{ marginTop: 8, padding: 14, background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-secondary)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input className="nh-input" value={partName} onChange={e => setPartName(e.target.value)} placeholder="Désignation de la pièce (ex: Écran 15.6 IPS FHD, SSD 512GB NVMe...)" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setPartSource('stock_nh')} className={`nh-chip ${partSource === 'stock_nh' ? 'active' : ''}`} style={{ flex: 1, padding: '8px' }}>Stock Magasin NH</button>
                  <button type="button" onClick={() => setPartSource('external')} className={`nh-chip ${partSource === 'external' ? 'active' : ''}`} style={{ flex: 1, padding: '8px' }}>Achat Externe</button>
                </div>
                <div className="nh-form-row">
                  <input className="nh-input" type="number" value={partPurchasePrice} onChange={e => setPartPurchasePrice(e.target.value)} placeholder="Prix d'achat (DZD)" />
                  <input className="nh-input" type="number" value={partSellingPrice} onChange={e => setPartSellingPrice(e.target.value)} placeholder="Prix facturé (DZD)" />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="nh-btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={handleAddPart}>Ajouter au dossier</button>
                  <button type="button" className="nh-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => setShowAddPart(false)}>Annuler</button>
                </div>
              </div>
            )}
          </div>

          {/* Section: Contact Log */}
          <div className="nh-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="nh-label">
                <PhoneCall size={16} color="#0057FF" />
                <span>{isAr ? 'سجل اتصالات العميل' : 'Journal des appels client'}</span>
              </label>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#0057FF', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800 }}
                onClick={() => setShowContactForm(!showContactForm)}
              >
                + Consigner un appel
              </button>
            </div>

            {repair.contactLog.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {repair.contactLog.map(c => (
                  <div key={c.id} style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', borderRadius: 8, fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={12} color="#0057FF" />
                      <span>{c.date} ({c.time}) — <strong>{c.result}</strong> par {c.calledBy}</span>
                    </span>
                    {c.notes && <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{c.notes}</span>}
                  </div>
                ))}
              </div>
            ) : (
              !showContactForm && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Aucun appel enregistré dans l'historique</span>
            )}

            {showContactForm && (
              <div style={{ marginTop: 8, padding: 14, background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-secondary)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <select className="nh-select" value={contactResult} onChange={e => setContactResult(e.target.value as any)}>
                  <option value="answered">Répondu (Client au téléphone)</option>
                  <option value="no_answer">Pas de réponse (Client injoignable)</option>
                  <option value="voicemail">Messagerie vocale déposée</option>
                  <option value="callback_requested">Le client va rappeler</option>
                </select>
                <input className="nh-input" value={contactNotes} onChange={e => setContactNotes(e.target.value)} placeholder="Remarques éventuelles sur l'appel..." />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="nh-btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={handleAddContact}>Enregistrer l'Appel</button>
                  <button type="button" className="nh-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => setShowContactForm(false)}>Annuler</button>
                </div>
              </div>
            )}
          </div>

          {/* Section: Billing Summary Box */}
          <div className="nh-summary-preview-box" style={{ background: 'var(--bg-tertiary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
              <span>Total Pièces: <strong>{repair.totalPartsCost.toLocaleString()} DZD</strong></span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Main d'œuvre:</span>
                <input
                  type="number"
                  className="nh-input"
                  value={laborCost}
                  onChange={e => setLaborCost(e.target.value)}
                  onBlur={handleSaveLaborCost}
                  style={{ width: 110, padding: '6px 10px', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem' }}
                />
                <span>DZD</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 900, color: '#0057FF', borderTop: '1px solid var(--border-secondary)', paddingTop: 10, marginTop: 4 }}>
              <span>TOTAL FACTURÉ RÉPARATIONS:</span>
              <span>{((parseFloat(laborCost) || 0) + repair.totalPartsCost).toLocaleString()} DZD</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="nh-modal-footer" style={{ flexWrap: 'wrap', gap: 10 }}>
          {actions.map(action => (
            <button
              key={action.nextStatus}
              type="button"
              className="nh-btn-primary"
              style={{ background: action.color }}
              onClick={() => handleStatusChange(action.nextStatus)}
              disabled={saving}
            >
              {action.label[language] || action.label.fr}
            </button>
          ))}

          <button type="button" className="nh-btn-secondary" onClick={() => setShowDepositSlip(true)}>
            <Printer size={16} /> Bon de Dépôt
          </button>

          {(['completed', 'notified', 'picked_up'] as RepairStatus[]).includes(repair.status) && (
            <button type="button" className="nh-btn-secondary" onClick={handlePrintInvoice}>
              <FileText size={16} /> Facture Réparation
            </button>
          )}

          <button type="button" className="nh-btn-secondary" style={{ marginLeft: 'auto' }} onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
