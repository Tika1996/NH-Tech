import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { generateNextId } from '../../lib/idGenerator';
import { getAll } from '../../lib/firebase';
import {
  X,
  User,
  Phone,
  Mail,
  Laptop,
  Monitor,
  HardDrive,
  Wrench,
  ChevronRight,
  ChevronLeft,
  Check,
  Printer,
  Loader2,
  Search,
  UserCog,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Tag,
  FileText,
  Zap,
  Plus,
  Plug,
  Briefcase,
  Mouse,
  BatteryCharging,
  Cpu,
  Building2,
  Clock
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { repairsCollection, staffCollection, type RepairDossier } from '../../lib/firebase';
import type { Customer } from '../../lib/customersStore';
import { DepositSlip } from './DepositSlip';

interface NewDepositModalProps {
  onClose: () => void;
  onCreated: (repair: RepairDossier) => void;
}

const DEVICE_TYPES = [
  { value: 'laptop' as const, icon: Laptop, label: { fr: 'Laptop / Portable', ar: 'حاسوب محمول' }, desc: { fr: 'PC portable, Notebook, Gaming', ar: 'محمول' } },
  { value: 'desktop' as const, icon: Monitor, label: { fr: 'Desktop / Tour', ar: 'حاسوب مكتبي' }, desc: { fr: 'Unité centrale, Tour Gaming, All-in-One', ar: 'مكتبي' } },
  { value: 'other' as const, icon: Monitor, label: { fr: 'Autre Appareil', ar: 'جهاز آخر' }, desc: { fr: 'Écran, Console, Imprimante, Periphérique...', ar: 'شاشة، كونسول، طابعة...' } },
];

const POPULAR_BRANDS = ['HP', 'Lenovo', 'Dell', 'ASUS', 'Acer', 'Apple', 'MSI', 'Gigabyte'];

const COMMON_SYMPTOMS = [
  { fr: 'Ne s\'allume plus (Noir)', ar: 'لا يشتغل نهائياً' },
  { fr: 'Problème d\'affichage / Écran cassé', ar: 'مشكلة شاشة' },
  { fr: 'Surchauffe & Ventilateur bruyant', ar: 'حرارة مرتفعة' },
  { fr: 'Pas de charge / Connecteur HS', ar: 'لا يشحن' },
  { fr: 'Liquide renversé sur clavier', ar: 'سائل تسرب' },
  { fr: 'Lenteur extrême & Bloqué au démarrage', ar: 'بطء شديد' },
];

const ACCESSORY_OPTIONS = [
  { key: 'charger', icon: Plug, label: { fr: 'Chargeur d\'origine', ar: 'شاحن أصلي' } },
  { key: 'bag', icon: Briefcase, label: { fr: 'Sacoche / Housse', ar: 'حقيبة' } },
  { key: 'mouse', icon: Mouse, label: { fr: 'Souris', ar: 'فأرة' } },
  { key: 'battery', icon: BatteryCharging, label: { fr: 'Batterie externe', ar: 'بطارية خارجية' } },
  { key: 'ram', icon: Cpu, label: { fr: 'Barette RAM', ar: 'ذاكرة عشوائية' } },
  { key: 'hdd', icon: HardDrive, label: { fr: 'Disque externe HDD/SSD', ar: 'قرص صلب' } },
];

export function NewDepositModal({ onClose, onCreated }: NewDepositModalProps) {
  const { language, currentUser } = useAppStore();
  const isAr = language === 'ar';

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showSlip, setShowSlip] = useState(false);
  const [createdRepair, setCreatedRepair] = useState<RepairDossier | null>(null);

  // Step 1: Client
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Step 2: Device
  const [deviceType, setDeviceType] = useState<'laptop' | 'desktop' | 'other'>('laptop');
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [deviceSerialNumber, setDeviceSerialNumber] = useState('');
  const [accessories, setAccessories] = useState<string[]>([]);
  const [otherAccessory, setOtherAccessory] = useState('');
  const [issueDescription, setIssueDescription] = useState('');

  // Step 3: Assignment
  const [assignType, setAssignType] = useState<'technician' | 'partner_shop' | 'none'>('none');
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [partnerShopName, setPartnerShopName] = useState('');
  const [notes, setNotes] = useState('');

  // Load customers & staff
  useEffect(() => {
    getAll<Customer>('customers').then(data => {
      if (data) setCustomers(data);
    }).catch(() => {});

    staffCollection.getAll().then(data => {
      setStaff(data.filter((s: any) => s.isActive !== false));
    }).catch(() => {});
  }, []);

  // Customer search suggestions
  const filteredCustomers = customerSearch.trim()
    ? customers.filter(c =>
        c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone?.includes(customerSearch)
      ).slice(0, 5)
    : [];

  const selectCustomer = (c: Customer) => {
    setCustomerName(c.name || '');
    setCustomerPhone(c.phone || '');
    setCustomerEmail(c.email || '');
    setCustomerSearch('');
    setShowSuggestions(false);
  };

  const toggleAccessory = (key: string) => {
    setAccessories(prev =>
      prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]
    );
  };

  const addSymptom = (symptom: string) => {
    if (issueDescription.includes(symptom)) return;
    setIssueDescription(prev => prev ? `${prev} + ${symptom}` : symptom);
  };

  // Generate unique repair ID
  const generateId = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 900) + 100);
    return `REP-${yy}${mm}${dd}-${rand}`;
  };

  // Submit
  const handleSubmit = async () => {
    if (!customerName.trim() || !customerPhone.trim()) return;
    if (!deviceBrand.trim() || !issueDescription.trim()) return;

    setSaving(true);
    try {
      let existingRepairs: any[] = [];
      try {
        const fetched = await getAll<any>('repairs');
        if (Array.isArray(fetched)) existingRepairs = fetched;
      } catch (e) {}

      const repairId = generateNextId(existingRepairs, 'REP', true, 4);
      const now = new Date();
      const depositDate = now.toISOString().split('T')[0];

      const accessoryNames = accessories.map(key => {
        const opt = ACCESSORY_OPTIONS.find(o => o.key === key);
        return opt ? opt.label.fr : key;
      });
      if (otherAccessory.trim()) {
        accessoryNames.push(otherAccessory.trim());
      }

      let assignedTo: RepairDossier['assignedTo'] = null;
      if (assignType === 'technician' && selectedStaffId) {
        const s = staff.find((st: any) => st.id === selectedStaffId);
        if (s) {
          assignedTo = { type: 'technician', id: s.id, name: s.name || s.email || 'Technicien' };
        }
      } else if (assignType === 'partner_shop' && partnerShopName.trim()) {
        assignedTo = { type: 'partner_shop', id: `shop-${Date.now()}`, name: partnerShopName.trim() };
      }

      const newRepair: Omit<RepairDossier, 'id'> & { id: string } = {
        id: repairId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        deviceType,
        deviceBrand: deviceBrand.trim(),
        deviceModel: deviceModel.trim(),
        deviceSerialNumber: deviceSerialNumber.trim() || undefined,
        deviceAccessories: accessoryNames,
        issueDescription: issueDescription.trim(),
        assignedTo,
        diagnostic: null,
        parts: [],
        contactLog: [],
        laborCost: 0,
        totalPartsCost: 0,
        totalAmount: 0,
        status: 'deposited',
        trackingCode: repairId,
        depositDate,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: currentUser?.id || currentUser?.email || 'unknown',
        notes: notes.trim(),
        source: 'store',
      };

      const { set } = await import('../../lib/firebaseOps');
      await set('repairs', repairId, newRepair);

      setCreatedRepair(newRepair as RepairDossier);
      setShowSlip(true);
    } catch (err) {
      console.error('Error creating repair:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSlipClose = () => {
    setShowSlip(false);
    if (createdRepair) {
      onCreated(createdRepair);
    }
  };

  const canGoStep2 = customerName.trim() && customerPhone.trim();
  const canGoStep3 = deviceBrand.trim() && issueDescription.trim();
  const canSubmit = canGoStep2 && canGoStep3;

  if (showSlip && createdRepair) {
    return <DepositSlip repair={createdRepair} onClose={handleSlipClose} />;
  }

  return (
    <div className="nh-modal-backdrop" onClick={onClose}>
      <div className="nh-modern-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="nh-modal-header">
          <div className="nh-header-icon-box">
            <Wrench size={22} color="#00F0FF" />
          </div>
          <div>
            <h2 className="nh-modal-title">
              {isAr ? 'إيداع جهاز جديد للظيانة' : 'Nouveau Dépôt SAV'}
            </h2>
            <p className="nh-modal-subtitle">
              {isAr ? 'تسجيل جهاز جديد في الورشة وطباعة بون الإيداع' : 'Enregistrement d\'un nouvel appareil déposé en magasin & impression du reçu'}
            </p>
          </div>
          <button className="nh-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Stepper Bar */}
        <div className="nh-stepper-bar">
          <div className="nh-stepper-track">
            <div className="nh-stepper-progress" style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }} />
          </div>
          <div className="nh-stepper-steps">
            {[
              { num: 1, title: isAr ? 'العميل' : '1. Client & Contact', icon: User },
              { num: 2, title: isAr ? 'الجهاز والطلب' : '2. Appareil & Panne', icon: Laptop },
              { num: 3, title: isAr ? 'التعيين والتأكيد' : '3. Assignation & Reçu', icon: UserCog },
            ].map(s => {
              const IconComp = s.icon;
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <div
                  key={s.num}
                  className={`nh-step-item ${isActive ? 'active' : isDone ? 'done' : ''}`}
                  onClick={() => { if (isDone) setStep(s.num); }}
                >
                  <div className="nh-step-badge">
                    {isDone ? <Check size={14} /> : <IconComp size={14} />}
                  </div>
                  <span className="nh-step-text">{s.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="nh-modal-body">
          {/* STEP 1: Client & Contact */}
          {step === 1 && (
            <div className="nh-form-step-content">
              {/* Customer Auto-Search */}
              <div className="nh-form-group" style={{ position: 'relative' }}>
                <label className="nh-label">
                  <Search size={14} color="#0057FF" />
                  <span>{isAr ? 'بحث عن عميل مسجل' : 'Recherche rapide d\'un client existant'}</span>
                </label>
                <div className="nh-input-wrapper">
                  <Search size={18} className="nh-input-icon" />
                  <input
                    type="text"
                    className="nh-input"
                    placeholder={isAr ? 'اكتب اسم العميل أو رقم الهاتف...' : 'Tapez un nom ou N° de téléphone...'}
                    value={customerSearch}
                    onChange={e => { setCustomerSearch(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                </div>
                {showSuggestions && filteredCustomers.length > 0 && (
                  <div className="nh-suggestions-dropdown">
                    {filteredCustomers.map(c => (
                      <div
                        key={c.id || c.phone}
                        className="nh-suggestion-item"
                        onClick={() => selectCustomer(c)}
                      >
                        <div className="nh-suggest-avatar">{c.name?.slice(0, 2).toUpperCase()}</div>
                        <div className="nh-suggest-info">
                          <strong>{c.name}</strong>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={12} color="#0057FF" />
                            <span>{c.phone} {c.email ? `• ${c.email}` : ''}</span>
                          </span>
                        </div>
                        <span className="nh-suggest-select">{isAr ? 'اختيار' : 'Sélectionner'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="nh-divider-line">
                <span>{isAr ? 'أو أدخل المعلومات يدوياً' : 'OU SAISISSEZ MANUELLEMENT'}</span>
              </div>

              {/* Form Row: Name & Phone */}
              <div className="nh-form-row">
                <div className="nh-form-group">
                  <label className="nh-label">
                    <User size={14} color="#0057FF" />
                    <span>{isAr ? 'اسم العميل' : 'Nom complet du client'} <strong className="req">*</strong></span>
                  </label>
                  <input
                    className="nh-input"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Ex: Ahmed Benali"
                  />
                </div>
                <div className="nh-form-group">
                  <label className="nh-label">
                    <Phone size={14} color="#0057FF" />
                    <span>{isAr ? 'رقم الهاتف' : 'N° Téléphone mobile'} <strong className="req">*</strong></span>
                  </label>
                  <input
                    className="nh-input"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="Ex: 0550 12 34 56"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="nh-form-group">
                <label className="nh-label">
                  <Mail size={14} color="#0057FF" />
                  <span>{isAr ? 'البريد الإلكتروني' : 'Adresse Email'} ({isAr ? 'اختياري' : 'Optionnel'})</span>
                </label>
                <input
                  className="nh-input"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="client@email.com"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Device & Issue */}
          {step === 2 && (
            <div className="nh-form-step-content">
              {/* Device Type Selector Cards */}
              <div className="nh-form-group">
                <label className="nh-label">
                  <Laptop size={14} color="#0057FF" />
                  <span>{isAr ? 'نوع الجهاز' : 'Catégorie d\'appareil'} <strong className="req">*</strong></span>
                </label>
                <div className="nh-device-cards">
                  {DEVICE_TYPES.map(dt => {
                    const IconComp = dt.icon;
                    const isSelected = deviceType === dt.value;
                    return (
                      <div
                        key={dt.value}
                        className={`nh-device-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setDeviceType(dt.value)}
                      >
                        <div className="nh-device-icon">
                          <IconComp size={24} />
                        </div>
                        <div className="nh-device-title">{isAr ? dt.label.ar : dt.label.fr}</div>
                        <div className="nh-device-desc">{isAr ? dt.desc.ar : dt.desc.fr}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Brand & Model */}
              <div className="nh-form-row">
                <div className="nh-form-group">
                  <label className="nh-label">
                    <Tag size={14} color="#0057FF" />
                    <span>{isAr ? 'العلامة التجارية' : 'Marque / Constructeur'} <strong className="req">*</strong></span>
                  </label>
                  <input
                    className="nh-input"
                    value={deviceBrand}
                    onChange={e => setDeviceBrand(e.target.value)}
                    placeholder="Ex: HP, Lenovo, Dell, ASUS..."
                  />
                  {/* Quick brand chips */}
                  <div className="nh-quick-chips">
                    {POPULAR_BRANDS.map(b => (
                      <span
                        key={b}
                        className={`nh-chip ${deviceBrand.toUpperCase() === b.toUpperCase() ? 'active' : ''}`}
                        onClick={() => setDeviceBrand(b)}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="nh-form-group">
                  <label className="nh-label">
                    <FileText size={14} color="#0057FF" />
                    <span>{isAr ? 'الموديل' : 'Modèle exact'}</span>
                  </label>
                  <input
                    className="nh-input"
                    value={deviceModel}
                    onChange={e => setDeviceModel(e.target.value)}
                    placeholder="Ex: Pavilion 15-eg, ThinkPad T14..."
                  />
                </div>
              </div>

              {/* Serial Number */}
              <div className="nh-form-group">
                <label className="nh-label">
                  <ShieldCheck size={14} color="#0057FF" />
                  <span>{isAr ? 'الرقم التسلسلي' : 'N° de Série S/N'} ({isAr ? 'اختياري' : 'Optionnel'})</span>
                </label>
                <input
                  className="nh-input"
                  value={deviceSerialNumber}
                  onChange={e => setDeviceSerialNumber(e.target.value)}
                  placeholder="Ex: 5CD1234567 (Gravé sous le PC)"
                />
              </div>

              {/* Accessories Checklist */}
              <div className="nh-form-group">
                <label className="nh-label">
                  <Zap size={14} color="#0057FF" />
                  <span>{isAr ? 'الملحقات المتروكة في المحل' : 'Accessoires déposés avec l\'appareil'}</span>
                </label>
                <div className="nh-accessories-grid">
                  {ACCESSORY_OPTIONS.map(opt => {
                    const isChecked = accessories.includes(opt.key);
                    const AccIcon = opt.icon;
                    return (
                      <div
                        key={opt.key}
                        className={`nh-accessory-box ${isChecked ? 'checked' : ''}`}
                        onClick={() => toggleAccessory(opt.key)}
                      >
                        <span className="nh-acc-icon"><AccIcon size={18} color="#0057FF" /></span>
                        <span className="nh-acc-label">{isAr ? opt.label.ar : opt.label.fr}</span>
                        <div className="nh-acc-check">{isChecked ? <Check size={12} /> : null}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10 }}>
                  <input
                    className="nh-input"
                    placeholder={isAr ? 'ملحقات أخرى (مثال: محول DisplayPort...)' : 'Autre accessoire spécifique (ex: Dongle sans fil...)'}
                    value={otherAccessory}
                    onChange={e => setOtherAccessory(e.target.value)}
                  />
                </div>
              </div>

              {/* Issue Description */}
              <div className="nh-form-group">
                <label className="nh-label">
                  <AlertCircle size={14} color="#EF4444" />
                  <span>{isAr ? 'وصف المشكلة الأعطال' : 'Description du problème / Panne déclarée'} <strong className="req">*</strong></span>
                </label>
                {/* Quick Symptom Chips */}
                <div className="nh-symptom-chips">
                  {COMMON_SYMPTOMS.map(s => (
                    <span key={s.fr} className="nh-symptom-chip" onClick={() => addSymptom(isAr ? s.ar : s.fr)}>
                      + {isAr ? s.ar : s.fr}
                    </span>
                  ))}
                </div>
                <textarea
                  className="nh-textarea"
                  rows={3}
                  value={issueDescription}
                  onChange={e => setIssueDescription(e.target.value)}
                  placeholder={isAr ? 'صف الأعطال التي صرح بها العميل بالتفصيل...' : 'Décrivez en détail la panne constatée ou les symptômes indiqués par le client...'}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Assignment & Confirmation */}
          {step === 3 && (
            <div className="nh-form-step-content">
              {/* Assignment Choice Cards */}
              <div className="nh-form-group">
                <label className="nh-label">
                  <UserCog size={14} color="#0057FF" />
                  <span>{isAr ? 'توجيه الملف والمسؤولية' : 'Responsable technique en charge'}</span>
                </label>
                <div className="nh-assign-options">
                  {[
                    { val: 'none' as const, label: isAr ? 'غير محدد حالياً' : 'À définir plus tard', icon: Clock, desc: isAr ? 'سيتم التعيين بعد التشخيص الأول' : 'Assignation ultérieure après réception' },
                    { val: 'technician' as const, label: isAr ? 'تقني داخلي' : 'Technicien Interne NH TECH', icon: User, desc: isAr ? 'إسناد الملف لتقني من المحل' : 'Prise en charge directe en atelier' },
                    { val: 'partner_shop' as const, label: isAr ? 'محل شريك' : 'Magasin / Atélier Partenaire', icon: Building2, desc: isAr ? 'إرسال الصيانة لورشة خارجية' : 'Sous-traitance spécialisée' },
                  ].map(opt => {
                    const OptIcon = opt.icon;
                    return (
                      <div
                        key={opt.val}
                        className={`nh-assign-card ${assignType === opt.val ? 'selected' : ''}`}
                        onClick={() => setAssignType(opt.val)}
                      >
                        <span className="nh-assign-icon"><OptIcon size={20} color="#0057FF" /></span>
                        <div className="nh-assign-body">
                          <strong>{opt.label}</strong>
                          <span>{opt.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {assignType === 'technician' && (
                <div className="nh-form-group">
                  <label className="nh-label">
                    <span>{isAr ? 'اختر التقني المسؤول' : 'Sélectionner le technicien'}</span>
                  </label>
                  <select
                    className="nh-select"
                    value={selectedStaffId}
                    onChange={e => setSelectedStaffId(e.target.value)}
                  >
                    <option value="">{isAr ? '-- اختر تقني --' : '-- Choisir un technicien --'}</option>
                    {staff.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name || s.email} ({s.role || 'staff'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {assignType === 'partner_shop' && (
                <div className="nh-form-group">
                  <label className="nh-label">
                    <span>{isAr ? 'اسم المحل الشريك' : 'Nom du magasin ou sous-traitant'}</span>
                  </label>
                  <input
                    className="nh-input"
                    value={partnerShopName}
                    onChange={e => setPartnerShopName(e.target.value)}
                    placeholder="Ex: TechRepair Express, Laboratoire Micro-Soudure"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="nh-form-group">
                <label className="nh-label">
                  <span>{isAr ? 'ملاحظات إدارية / خاصة' : 'Notes internes ou consignes'} ({isAr ? 'اختياري' : 'Optionnel'})</span>
                </label>
                <textarea
                  className="nh-textarea"
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes réservées à l'équipe NH TECH..."
                />
              </div>

              {/* Live Preview Summary Box */}
              <div className="nh-summary-preview-box">
                <div className="nh-summary-head">
                  <Sparkles size={16} color="#00F0FF" />
                  <span>{isAr ? 'ملخص الملف قبل الطباعة' : 'Résumé Synthétique du Bon de Dépôt'}</span>
                </div>
                <div className="nh-summary-grid">
                  <div>
                    <span className="lbl">{isAr ? 'العميل' : 'Client'}:</span>
                    <strong className="val">{customerName} ({customerPhone})</strong>
                  </div>
                  <div>
                    <span className="lbl">{isAr ? 'الجهاز' : 'Appareil'}:</span>
                    <strong className="val">{deviceBrand} {deviceModel} ({deviceType})</strong>
                  </div>
                  <div>
                    <span className="lbl">{isAr ? 'الملحقات' : 'Accessoires'}:</span>
                    <strong className="val">{accessories.length > 0 ? accessories.join(', ') : 'Aucun'}</strong>
                  </div>
                  <div>
                    <span className="lbl">{isAr ? 'الأعطال' : 'Symptômes'}:</span>
                    <strong className="val">{issueDescription}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="nh-modal-footer">
          {step > 1 ? (
            <button type="button" className="nh-btn-secondary" onClick={() => setStep(step - 1)}>
              <ChevronLeft size={16} /> {isAr ? 'السابق' : 'Précédent'}
            </button>
          ) : (
            <button type="button" className="nh-btn-secondary" onClick={onClose}>
              {isAr ? 'إلغاء' : 'Annuler'}
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              className="nh-btn-primary"
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !canGoStep2 : !canGoStep3}
            >
              <span>{isAr ? 'التالي' : 'Étape Suivante'}</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="nh-btn-primary nh-btn-glow"
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
            >
              {saving ? <Loader2 size={18} className="spin-icon" /> : <Printer size={18} />}
              <span>{isAr ? 'إنشاء وطباعة البون' : 'Créer & Imprimer le Bon'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
