import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui';
import {
  Users,
  User,
  Store,
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  StickyNote,
  Filter,
  Globe,
} from 'lucide-react';
import { CustomerHistoryModal } from './CustomerHistoryModal';

// --- Types ---

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  type: 'particulier' | 'revendeur' | 'entreprise' | 'web';
  source?: 'magasin' | 'website';
  notes: string;
  totalSpent: number;
  purchaseCount: number;
  createdAt: string;
}

// --- Translations ---

const translations = {
  fr: {
    pageTitle: 'Clients',
    pageSubtitle: 'Gérez votre base de clients, consultez leurs historiques et statistiques.',
    addClient: 'Ajouter un client',
    totalClients: 'Total Clients',
    allRegistered: 'Clients enregistrés',
    particuliers: 'Particuliers',
    particuliersDesc: 'Clients particuliers',
    revendeurs: 'Revendeurs',
    revendeursDesc: 'Partenaires revendeurs',
    entreprises: 'Entreprises',
    entreprisesDesc: 'Clients entreprises',
    clientsWeb: 'Clients Web',
    clientsWebDesc: 'Boutique en ligne',
    searchPlaceholder: 'Rechercher un client...',
    filterAll: 'Tous',
    filterParticulier: 'Particulier',
    filterRevendeur: 'Revendeur',
    filterEntreprise: 'Entreprise',
    filterWeb: 'Clients Web',
    colName: 'Nom',
    colPhone: 'Téléphone',
    colAddress: 'Adresse',
    colType: 'Type',
    colTotalSpent: 'Total dépensé',
    colPurchases: 'Achats',
    colDate: 'Inscrit le',
    colActions: 'Actions',
    noClients: 'Aucun client trouvé',
    noClientsDesc: 'Ajoutez votre premier client pour commencer.',
    modalAddTitle: 'Ajouter un client',
    modalEditTitle: 'Modifier le client',
    labelName: 'Nom complet',
    labelPhone: 'Téléphone',
    labelEmail: 'Email (optionnel)',
    labelAddress: 'Adresse',
    labelType: 'Type de client',
    labelNotes: 'Notes (optionnel)',
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirmDelete: 'Supprimer ce client ?',
    confirmDeleteMsg: 'Cette action est irréversible.',
    yes: 'Oui, supprimer',
    no: 'Non',
    toastAdded: 'Client ajouté avec succès',
    toastEdited: 'Client modifié avec succès',
    toastDeleted: 'Client supprimé',
    dzdSuffix: 'DZD',
    typeParticulier: 'Particulier',
    typeRevendeur: 'Revendeur',
    typeEntreprise: 'Entreprise',
    typeWeb: 'Client Web',
    requiredField: 'Ce champ est requis',
  },
  en: {
    pageTitle: 'Clients & Customers',
    pageSubtitle: 'Manage your customer database, check order histories and statistics.',
    addClient: 'Add Client',
    totalClients: 'Total Clients',
    allRegistered: 'Registered Clients',
    particuliers: 'Individuals',
    particuliersDesc: 'Retail Customers',
    revendeurs: 'Resellers',
    revendeursDesc: 'Partner Resellers',
    entreprises: 'Companies',
    entreprisesDesc: 'B2B Corporate Clients',
    clientsWeb: 'Web Clients',
    clientsWebDesc: 'Online Store',
    searchPlaceholder: 'Search client by name or phone...',
    filterAll: 'All',
    filterParticulier: 'Individual',
    filterRevendeur: 'Reseller',
    filterEntreprise: 'Company',
    filterWeb: 'Web Clients',
    colName: 'Full Name',
    colPhone: 'Phone',
    colAddress: 'Address',
    colType: 'Type',
    colTotalSpent: 'Total Spent',
    colPurchases: 'Orders',
    colDate: 'Registered Date',
    colActions: 'Actions',
    noClients: 'No clients found',
    noClientsDesc: 'Add your first client to get started.',
    modalAddTitle: 'Add New Client',
    modalEditTitle: 'Edit Client',
    labelName: 'Full Name',
    labelPhone: 'Phone Number',
    labelEmail: 'Email (optional)',
    labelAddress: 'Address',
    labelType: 'Client Type',
    labelNotes: 'Notes (optional)',
    save: 'Save Client',
    cancel: 'Cancel',
    confirmDelete: 'Delete this client?',
    confirmDeleteMsg: 'This action cannot be undone.',
    yes: 'Yes, delete',
    no: 'No',
    toastAdded: 'Client added successfully',
    toastEdited: 'Client updated successfully',
    toastDeleted: 'Client removed',
    dzdSuffix: 'DZD',
    typeParticulier: 'Individual',
    typeRevendeur: 'Reseller',
    typeEntreprise: 'Company',
    typeWeb: 'Web Client',
    requiredField: 'This field is required',
  },
  ar: {
    pageTitle: 'العملاء',
    pageSubtitle: 'إدارة قاعدة عملائك، الاطلاع على سجلاتهم وإحصائياتهم.',
    addClient: 'إضافة عميل',
    totalClients: 'إجمالي العملاء',
    allRegistered: 'العملاء المسجلون',
    particuliers: 'أفراد',
    particuliersDesc: 'عملاء أفراد',
    revendeurs: 'موزعون',
    revendeursDesc: 'شركاء التوزيع',
    entreprises: 'شركات',
    entreprisesDesc: 'عملاء شركات',
    searchPlaceholder: 'البحث عن عميل...',
    filterAll: 'الكل',
    filterParticulier: 'فرد',
    filterRevendeur: 'موزع',
    filterEntreprise: 'شركة',
    colName: 'الاسم',
    colPhone: 'الهاتف',
    colAddress: 'العنوان',
    colType: 'النوع',
    colTotalSpent: 'إجمالي المصاريف',
    colPurchases: 'المشتريات',
    colDate: 'تاريخ التسجيل',
    colActions: 'الإجراءات',
    noClients: 'لا يوجد عملاء',
    noClientsDesc: 'أضف أول عميل للبدء.',
    modalAddTitle: 'إضافة عميل',
    modalEditTitle: 'تعديل العميل',
    labelName: 'الاسم الكامل',
    labelPhone: 'الهاتف',
    labelEmail: 'البريد الإلكتروني (اختياري)',
    labelAddress: 'العنوان',
    labelType: 'نوع العميل',
    labelNotes: 'ملاحظات (اختياري)',
    save: 'حفظ',
    cancel: 'إلغاء',
    confirmDelete: 'حذف هذا العميل؟',
    confirmDeleteMsg: 'هذا الإجراء لا يمكن التراجع عنه.',
    yes: 'نعم، حذف',
    no: 'لا',
    toastAdded: 'تمت إضافة العميل بنجاح',
    toastEdited: 'تم تعديل العميل بنجاح',
    toastDeleted: 'تم حذف العميل',
    dzdSuffix: 'دج',
    typeParticulier: 'فرد',
    typeRevendeur: 'موزع',
    typeEntreprise: 'شركة',
    requiredField: 'هذا الحقل مطلوب',
  },
  en: {
    pageTitle: 'Clients',
    pageSubtitle: 'Manage your client base, view their history and statistics.',
    addClient: 'Add Client',
    totalClients: 'Total Clients',
    allRegistered: 'Registered clients',
    particuliers: 'Individuals',
    particuliersDesc: 'Individual clients',
    revendeurs: 'Resellers',
    revendeursDesc: 'Reseller partners',
    entreprises: 'Companies',
    entreprisesDesc: 'Corporate clients',
    searchPlaceholder: 'Search a client...',
    filterAll: 'All',
    filterParticulier: 'Individual',
    filterRevendeur: 'Reseller',
    filterEntreprise: 'Company',
    colName: 'Name',
    colPhone: 'Phone',
    colAddress: 'Address',
    colType: 'Type',
    colTotalSpent: 'Total Spent',
    colPurchases: 'Purchases',
    colDate: 'Registered',
    colActions: 'Actions',
    noClients: 'No clients found',
    noClientsDesc: 'Add your first client to get started.',
    modalAddTitle: 'Add Client',
    modalEditTitle: 'Edit Client',
    labelName: 'Full Name',
    labelPhone: 'Phone',
    labelEmail: 'Email (optional)',
    labelAddress: 'Address',
    labelType: 'Client Type',
    labelNotes: 'Notes (optional)',
    save: 'Save',
    cancel: 'Cancel',
    confirmDelete: 'Delete this client?',
    confirmDeleteMsg: 'This action cannot be undone.',
    yes: 'Yes, delete',
    no: 'No',
    toastAdded: 'Client added successfully',
    toastEdited: 'Client updated successfully',
    toastDeleted: 'Client deleted',
    dzdSuffix: 'DZD',
    typeParticulier: 'Individual',
    typeRevendeur: 'Reseller',
    typeEntreprise: 'Company',
    requiredField: 'This field is required',
  },
};

// --- Data Store ---
const INITIAL_CLIENTS: Client[] = [];

import { useCustomers } from '../../lib/customersStore';

// --- Component ---

export function ClientsPage() {
  const { language } = useAppStore();
  const lang = language === 'ar' ? 'ar' : language === 'en' ? 'en' : 'fr';
  const t = translations[lang];
  const { showToast } = useToast();

  const { customers: clients, addCustomer, updateCustomer: updateStoreCustomer, deleteCustomer: deleteStoreCustomer } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'particulier' | 'revendeur' | 'entreprise' | 'web'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formType, setFormType] = useState<'particulier' | 'revendeur' | 'entreprise' | 'web'>('particulier');
  const [formNotes, setFormNotes] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  // --- Stats ---
  const totalClients = clients.length;
  const particulierCount = clients.filter(c => c.type === 'particulier').length;
  const revendeurCount = clients.filter(c => c.type === 'revendeur').length;
  const entrepriseCount = clients.filter(c => c.type === 'entreprise').length;
  const webCount = clients.filter(c => c.type === 'web' || c.source === 'website').length;

  // --- Filter & Search ---
  const filteredClients = clients.filter(c => {
    const matchesType = typeFilter === 'all' || c.type === typeFilter || (typeFilter === 'web' && (c.type === 'web' || c.source === 'website'));
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.address.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  // --- Modal helpers ---
  const openAddModal = () => {
    setEditingClient(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormType('particulier');
    setFormNotes('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormPhone(client.phone);
    setFormEmail(client.email);
    setFormAddress(client.address);
    setFormType(client.type);
    setFormNotes(client.notes);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSave = () => {
    const errors: Record<string, boolean> = {};
    if (!formName.trim()) errors.name = true;
    if (!formPhone.trim()) errors.phone = true;
    if (!formAddress.trim()) errors.address = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingClient) {
      updateStoreCustomer(editingClient.id, {
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        address: formAddress.trim(),
        type: formType,
        notes: formNotes.trim()
      });
      showToast(t.toastEdited, 'success');
    } else {
      addCustomer({
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        address: formAddress.trim(),
        type: formType,
        notes: formNotes.trim(),
        totalSpent: 0,
        purchaseCount: 0
      });
      showToast(t.toastAdded, 'success');
    }

    closeModal();
  };

  const handleDelete = (id: string) => {
    deleteStoreCustomer(id);
    setDeleteConfirm(null);
    showToast(t.toastDeleted, 'info');
  };

  const getTypeBadge = (type: string, source?: string) => {
    if (type === 'web' || source === 'website') {
      return { label: t.typeWeb || 'Client Web', className: 'badge-cyan' };
    }
    switch (type) {
      case 'particulier': return { label: t.typeParticulier, className: 'badge-blue' };
      case 'revendeur': return { label: t.typeRevendeur, className: 'badge-amber' };
      case 'entreprise': return { label: t.typeEntreprise, className: 'badge-purple' };
      default: return { label: type, className: '' };
    }
  };

  return (
    <div className="factures-page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title"><Users size={28} className="title-icon" /> {t.pageTitle}</h1>
          <p className="page-subtitle">{t.pageSubtitle}</p>
        </div>
        <button className="btn-primary-action" type="button" onClick={openAddModal}>
          <Plus size={18} />
          <span>{t.addClient}</span>
        </button>
      </div>

      {/* Stats Cards (Matching FacturesPage KPI Grid) */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => setTypeFilter('all')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon blue"><Users size={22} color="#ffffff" /></div>
          <div className="kpi-info">
            <span className="kpi-label">{t.totalClients}</span>
            <h3 className="kpi-value">{totalClients}</h3>
            <span className="kpi-sub">{t.allRegistered}</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => setTypeFilter('web')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon green"><Globe size={22} color="#ffffff" /></div>
          <div className="kpi-info">
            <span className="kpi-label">{t.clientsWeb || 'Clients Web'}</span>
            <h3 className="kpi-value">{webCount}</h3>
            <span className="kpi-sub">{t.clientsWebDesc || 'Boutique en ligne'}</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => setTypeFilter('particulier')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon emerald"><User size={22} color="#ffffff" /></div>
          <div className="kpi-info">
            <span className="kpi-label">{t.particuliers}</span>
            <h3 className="kpi-value">{particulierCount}</h3>
            <span className="kpi-sub">{t.particuliersDesc}</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => setTypeFilter('revendeur')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon red" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}><Store size={22} color="#ffffff" /></div>
          <div className="kpi-info">
            <span className="kpi-label">{t.revendeurs}</span>
            <h3 className="kpi-value" style={{ color: '#f59e0b' }}>{revendeurCount}</h3>
            <span className="kpi-sub" style={{ color: '#f59e0b' }}>{t.revendeursDesc}</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => setTypeFilter('entreprise')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', color: '#ffffff', boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)' }}><Building2 size={22} color="#ffffff" /></div>
          <div className="kpi-info">
            <span className="kpi-label">{t.entreprises}</span>
            <h3 className="kpi-value" style={{ color: '#a855f7' }}>{entrepriseCount}</h3>
            <span className="kpi-sub" style={{ color: '#a855f7' }}>{t.entreprisesDesc}</span>
          </div>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="toolbar-card">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-group">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
            <option value="all">{t.filterAll}</option>
            <option value="web">{t.typeWeb || 'Clients Web'}</option>
            <option value="particulier">{t.filterParticulier}</option>
            <option value="revendeur">{t.filterRevendeur}</option>
            <option value="entreprise">{t.filterEntreprise}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        {filteredClients.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>{t.noClients}</h3>
            <p>{t.noClientsDesc}</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="factures-table">
              <thead>
                <tr>
                  <th>{t.colName}</th>
                  <th>{t.colPhone}</th>
                  <th>{t.colAddress}</th>
                  <th>{t.colType}</th>
                  <th>{t.colTotalSpent}</th>
                  <th>{t.colPurchases}</th>
                  <th>{t.colDate}</th>
                  <th>{t.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(client => {
                  const badge = getTypeBadge(client.type, client.source);
                  const isWeb = client.type === 'web' || client.source === 'website';
                  const isPart = client.type === 'particulier';
                  const isRev = client.type === 'revendeur';
                  const isEnt = client.type === 'entreprise';

                  const badgeClass = isPart
                    ? 'status-pill paid'
                    : isRev
                    ? 'status-pill warning'
                    : 'status-pill';

                  const badgeStyle = isWeb
                    ? { background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4' }
                    : isEnt
                    ? { background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }
                    : undefined;

                  return (
                    <tr key={client.id}>
                      <td className="cell-name">
                        <div className="inv-customer-cell">
                          <span className="customer-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="client-avatar">{client.name.charAt(0).toUpperCase()}</span>
                            <span>{client.name}</span>
                          </span>
                          {client.email && <span className="customer-sub">{client.email}</span>}
                        </div>
                      </td>
                      <td><span className="mono">{client.phone}</span></td>
                      <td><span className="date-text">{client.address}</span></td>
                      <td><span className={badgeClass} style={badgeStyle}>{badge.label}</span></td>
                      <td><span className="total-price-text">{client.totalSpent.toLocaleString()} {t.dzdSuffix}</span></td>
                      <td><span className="mono" style={{ fontWeight: 700 }}>{client.purchaseCount}</span></td>
                      <td><div className="date-time-cell"><span className="date-text">{client.createdAt}</span></div></td>
                      <td>
                        <div className="action-buttons-cell">
                          <button
                            className="dots-icon-btn edit-btn"
                            title={t.viewHistory || 'Historique'}
                            onClick={() => setHistoryClient(client)}
                            style={{ color: '#0055ff' }}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            className="dots-icon-btn edit-btn"
                            title={t.editClient || 'Modifier'}
                            onClick={() => openEditModal(client)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="dots-icon-btn delete-btn"
                            title={t.deleteClient || 'Supprimer'}
                            onClick={() => setDeleteConfirm(client.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop open" onClick={closeModal}>
          <div className="client-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingClient ? t.modalEditTitle : t.modalAddTitle}</h3>
              <button className="icon-btn-close" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label><User size={14} /> {t.labelName} *</label>
                <input className={`input-field ${formErrors.name ? 'input-error' : ''}`} value={formName} onChange={e => { setFormName(e.target.value); setFormErrors(p => ({...p, name: false})); }} />
                {formErrors.name && <span className="field-error">{t.requiredField}</span>}
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label><Phone size={14} /> {t.labelPhone} *</label>
                  <input className={`input-field ${formErrors.phone ? 'input-error' : ''}`} value={formPhone} onChange={e => { setFormPhone(e.target.value); setFormErrors(p => ({...p, phone: false})); }} />
                  {formErrors.phone && <span className="field-error">{t.requiredField}</span>}
                </div>
                <div className="form-group">
                  <label><Mail size={14} /> {t.labelEmail}</label>
                  <input className="input-field" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label><MapPin size={14} /> {t.labelAddress} *</label>
                  <input className={`input-field ${formErrors.address ? 'input-error' : ''}`} value={formAddress} onChange={e => { setFormAddress(e.target.value); setFormErrors(p => ({...p, address: false})); }} />
                  {formErrors.address && <span className="field-error">{t.requiredField}</span>}
                </div>
                <div className="form-group">
                  <label><Filter size={14} /> {t.labelType}</label>
                  <select className="input-field" value={formType} onChange={e => setFormType(e.target.value as any)}>
                    <option value="particulier">{t.typeParticulier}</option>
                    <option value="revendeur">{t.typeRevendeur}</option>
                    <option value="entreprise">{t.typeEntreprise}</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label><StickyNote size={14} /> {t.labelNotes}</label>
                <textarea className="input-field textarea-field" value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={3} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>{t.cancel}</button>
              <button className="btn btn-primary" onClick={handleSave}>{t.save}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-backdrop open" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <Trash2 size={32} color="#ef4444" />
            <h3>{t.confirmDelete}</h3>
            <p>{t.confirmDeleteMsg}</p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>{t.no}</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>{t.yes}</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyClient && (
        <CustomerHistoryModal
          isOpen={true}
          onClose={() => setHistoryClient(null)}
          customer={{
            id: historyClient.id,
            name: historyClient.name,
            phone: historyClient.phone,
            totalSpent: historyClient.totalSpent,
            visitCount: historyClient.purchaseCount,
          }}
          transactions={[]}
        />
      )}

      <style>{`
        .clients-page {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .page-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .page-title {
          font-family: var(--font-display);
          font-size: var(--text-4xl);
          font-weight: 800;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-primary);
        }

        .title-icon { color: var(--color-brand); }

        .page-subtitle {
          color: var(--text-secondary);
          margin: 6px 0 0 0;
          font-size: var(--text-base);
        }

        .clients-page .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          font-family: inherit;
        }

        .clients-page .btn-primary {
          background: var(--color-brand);
          color: #fff;
          box-shadow: 0 4px 16px rgba(0, 85, 255, 0.3);
        }
        .clients-page .btn-primary:hover { box-shadow: 0 6px 24px rgba(0, 85, 255, 0.45); transform: translateY(-1px); }

        .clients-page .btn-ghost {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border-secondary);
        }
        .clients-page .btn-ghost:hover { background: var(--bg-tertiary); }

        .clients-page .btn-danger {
          background: #ef4444;
          color: #fff;
        }
        .clients-page .btn-danger:hover { background: #dc2626; }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .stat-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

        .stat-icon-box {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .stat-icon-box.blue { background: rgba(0, 85, 255, 0.12); color: #0055ff; }
        .stat-icon-box.green { background: rgba(16, 185, 129, 0.12); color: #10b981; }
        .stat-icon-box.amber { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
        .stat-icon-box.purple { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }

        .stat-info { display: flex; flex-direction: column; }
        .stat-number { font-size: 1.5rem; font-weight: 800; font-family: var(--font-display); color: var(--text-primary); }
        .stat-label { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); }
        .stat-desc { font-size: 0.7rem; color: var(--text-tertiary); }

        /* Toolbar */
        .toolbar-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 12px;
          padding: 8px 14px;
          flex: 1;
          min-width: 200px;
          max-width: 400px;
          color: var(--text-secondary);
        }
        .search-box input {
          border: none; background: transparent; outline: none; width: 100%;
          color: var(--text-primary); font-size: 0.85rem; font-family: inherit;
        }

        .filter-pills {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-tertiary);
        }

        .filter-pill {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 600;
          background: var(--bg-elevated);
          color: var(--text-secondary);
          border: 1px solid var(--border-secondary);
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .filter-pill:hover { border-color: var(--color-brand); color: var(--color-brand); }
        .filter-pill.active { background: var(--color-brand); color: #fff; border-color: var(--color-brand); }

        /* Table Card */
        .clients-table-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 16px;
          overflow: hidden;
        }

        .table-scroll { overflow-x: auto; }

        .clients-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
        }

        .clients-table thead { background: var(--bg-tertiary); }

        .clients-table th {
          padding: 14px 16px;
          text-align: start;
          font-weight: 700;
          color: var(--text-secondary);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
          border-bottom: 1px solid var(--border-secondary);
        }

        .clients-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-secondary);
          color: var(--text-primary);
          vertical-align: middle;
        }

        .clients-table tr:last-child td { border-bottom: none; }

        .clients-table tbody tr {
          transition: background 0.15s;
        }
        .clients-table tbody tr:hover { background: var(--bg-tertiary); }

        .cell-name {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 200px;
        }

        .client-avatar {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--color-brand); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.85rem; flex-shrink: 0;
          font-family: var(--font-display);
        }

        .cell-name > div { display: flex; flex-direction: column; }
        .client-name-text { font-weight: 600; }
        .client-email-text { font-size: 0.7rem; color: var(--text-tertiary); }

        .mono { font-family: var(--font-mono); font-size: 0.78rem; }

        .type-badge {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .badge-blue { background: rgba(0, 85, 255, 0.12); color: #0055ff; }
        .badge-amber { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
        .badge-purple { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }

        .cell-money { font-weight: 700; color: var(--color-brand); white-space: nowrap; }
        .cell-count { text-align: center; font-weight: 600; }
        .cell-date { color: var(--text-secondary); font-size: 0.78rem; white-space: nowrap; }

        .cell-actions {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .action-btn {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          border: none; cursor: pointer; transition: all 0.2s;
          background: transparent; color: var(--text-secondary);
        }
        .action-btn:hover { background: var(--bg-tertiary); }
        .action-btn.view:hover { color: #0055ff; }
        .action-btn.edit:hover { color: #f59e0b; }
        .action-btn.delete:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

        /* Empty State */
        .empty-state {
          padding: 64px 32px;
          text-align: center;
          color: var(--text-tertiary);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .empty-state h3 { color: var(--text-primary); margin: 0; }
        .empty-state p { margin: 0; }

        /* Modal */
        .clients-page .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .client-modal {
          background: var(--bg-elevated);
          border-radius: 20px;
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-secondary);
        }

        .client-modal .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-secondary);
        }
        .client-modal .modal-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; }

        .icon-btn-close {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-tertiary); border: 1px solid var(--border-secondary);
          color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
        }
        .icon-btn-close:hover { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }

        .client-modal .modal-body {
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .clients-page .input-field {
          padding: 10px 14px;
          border: 1.5px solid var(--border-secondary);
          border-radius: 10px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.85rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
        }
        .clients-page .input-field:focus { border-color: var(--color-brand); }
        .clients-page .input-field.input-error { border-color: #ef4444; }

        .textarea-field { resize: vertical; min-height: 60px; }

        .field-error { font-size: 0.7rem; color: #ef4444; }

        .clients-page select.input-field { cursor: pointer; }

        .client-modal .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 24px;
          border-top: 1px solid var(--border-secondary);
        }

        /* Delete Confirmation */
        .confirm-modal {
          background: var(--bg-elevated);
          border-radius: 20px;
          padding: 32px;
          text-align: center;
          max-width: 380px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-secondary);
        }
        .confirm-modal h3 { margin: 0; color: var(--text-primary); }
        .confirm-modal p { margin: 0; color: var(--text-secondary); font-size: 0.85rem; }
        .confirm-actions { display: flex; gap: 10px; margin-top: 8px; }

        @media (max-width: 768px) {
          .clients-page { padding: 16px; }
          .form-row-2 { grid-template-columns: 1fr; }
          .page-header-row { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
