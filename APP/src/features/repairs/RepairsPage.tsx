import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui/Toast';
import {
  Wrench,
  Search,
  Plus,
  Laptop,
  Phone,
  Calendar,
  Clock,
  RefreshCw,
  Loader2,
  ChevronRight,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  Printer,
  FileText,
  UserCog,
  ShieldCheck,
  TrendingUp,
  RotateCcw as ReturnIcon,
  Building2
} from 'lucide-react';
import { repairsCollection, type RepairDossier, type RepairStatus } from '../../lib/firebase';
import { NewDepositModal } from './NewDepositModal';
import { RepairDetailModal } from './RepairDetailModal';
import './repairs.css';

// Status labels & styles matching FacturesPage status-pill
export const REPAIR_STATUS_CONFIG: Record<RepairStatus, {
  label: { fr: string; ar: string; en: string };
  color: string;
  bg: string;
  pillClass: string;
}> = {
  deposited:        { label: { fr: 'Déposé',              ar: 'تم الإيداع',           en: 'Deposited' },               color: '#0055ff', bg: 'rgba(0, 85, 255, 0.12)',   pillClass: 'paid' },
  diagnosing:       { label: { fr: 'Diagnostic',          ar: 'جارٍ التشخيص',         en: 'Diagnosing' },              color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)',   pillClass: 'warning' },
  waiting_approval: { label: { fr: 'Attente devis',       ar: 'في انتظار الموافقة',   en: 'Awaiting Approval' },       color: '#ea580c', bg: 'rgba(234, 88, 12, 0.12)',   pillClass: 'warning' },
  approved:         { label: { fr: 'Approuvé',            ar: 'تمت الموافقة',         en: 'Approved' },                color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)',  pillClass: 'paid' },
  repairing:        { label: { fr: 'En réparation',       ar: 'جارٍ الإصلاح',         en: 'Repairing' },               color: '#0055ff', bg: 'rgba(0, 85, 255, 0.12)',   pillClass: 'paid' },
  waiting_parts:    { label: { fr: 'Attente pièces',      ar: 'في انتظار القطع',      en: 'Awaiting Parts' },          color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)',   pillClass: 'warning' },
  completed:        { label: { fr: 'Terminé',             ar: 'مكتمل',                en: 'Completed' },               color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)',  pillClass: 'paid' },
  notified:         { label: { fr: 'Client notifié',      ar: 'تم إعلام العميل',      en: 'Client Notified' },         color: '#059669', bg: 'rgba(5, 150, 105, 0.12)',   pillClass: 'paid' },
  picked_up:        { label: { fr: 'Récupéré',            ar: 'تم الاستلام',          en: 'Picked Up' },               color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', pillClass: 'cancelled' },
  unreachable:      { label: { fr: 'Non joignable',       ar: 'غير متاح',             en: 'Unreachable' },             color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)',   pillClass: 'returned' },
  cancelled:        { label: { fr: 'Annulé',              ar: 'ملغى',                 en: 'Cancelled' },               color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', pillClass: 'cancelled' },
};

type StatusFilter = 'all' | 'active' | RepairStatus;

export function RepairsPage() {
  const { language } = useAppStore();
  const isAr = language === 'ar';
  const isEn = language === 'en';
  const t = (fr: string, ar: string, en?: string) => isAr ? ar : (isEn && en ? en : fr);
  const { showToast } = useToast();

  // --- State ---
  const [repairs, setRepairs] = useState<RepairDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'laptop' | 'desktop' | 'other'>('all');
  const [showNewDeposit, setShowNewDeposit] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<RepairDossier | null>(null);

  // --- Fetch ---
  const fetchRepairs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await repairsCollection.getAll();
      setRepairs(data);
    } catch (err) {
      console.warn('Repairs load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRepairs(); }, [fetchRepairs]);

  // --- Statistics ---
  const stats = useMemo(() => {
    const totalCount = repairs.length;
    const activeRepairs = repairs.filter(r => !['picked_up', 'cancelled'].includes(r.status));
    const completedRepairs = repairs.filter(r => ['completed', 'notified', 'picked_up'].includes(r.status));
    const unreachableRepairs = repairs.filter(r => r.status === 'unreachable');

    const totalSAVRevenue = completedRepairs.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

    return {
      totalCount,
      activeCount: activeRepairs.length,
      completedCount: completedRepairs.length,
      unreachableCount: unreachableRepairs.length,
      totalSAVRevenue,
    };
  }, [repairs]);

  // --- Filtered List ---
  const filteredRepairs = useMemo(() => {
    return repairs.filter(r => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        r.id.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.includes(q) ||
        r.deviceBrand.toLowerCase().includes(q) ||
        r.deviceModel.toLowerCase().includes(q) ||
        r.depositDate.includes(q);

      const matchStatus =
        statusFilter === 'all' ? true :
        statusFilter === 'active' ? !['picked_up', 'cancelled'].includes(r.status) :
        r.status === statusFilter;

      const matchDevice = deviceFilter === 'all' || r.deviceType === deviceFilter;

      return matchSearch && matchStatus && matchDevice;
    });
  }, [repairs, searchQuery, statusFilter, deviceFilter]);

  const handleRepairUpdated = useCallback(() => {
    fetchRepairs();
  }, [fetchRepairs]);

  return (
    <div className="factures-page-container">
      {/* Top Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">
            <Wrench size={28} className="title-icon" />
            <span>{t('Réparations & SAV', 'سجل الإصلاحات والصيانة (SAV)', 'Repairs & SAV')}</span>
          </h1>
          <p className="page-subtitle">
            {t(
              'Gérez l\'ensemble des dossiers de réparation, le diagnostic, l\'assignation et la facturation SAV.',
              'إدارة جميع ملفات الصيانة، متابعة الأجهزة، التشخيص والفوترة',
              'Manage repair dossiers, diagnostics, assignment, and SAV billing.'
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="dots-icon-btn"
            onClick={fetchRepairs}
            disabled={loading}
            title={t('Rafraîchir', 'تحديث', 'Refresh')}
          >
            {loading ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
          </button>
          <button
            className="btn-primary-action"
            type="button"
            onClick={() => setShowNewDeposit(true)}
          >
            <Plus size={18} />
            <span>{t('Nouveau Dépôt SAV', 'إيداع جهاز جديد', 'New SAV Deposit')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Same styling as FacturesPage) */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => setStatusFilter('all')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon blue"><Wrench size={22} color="#ffffff" /></div>
          <div className="kpi-info">
            <span className="kpi-label">{t('Total Dossiers', 'إجمالي الملفات', 'Total Dossiers')}</span>
            <h3 className="kpi-value">{stats.totalCount}</h3>
            <span className="kpi-sub">{t('Tous dossiers confondus', 'جميع الأجهزة المسجلة', 'All dossiers combined')}</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => setStatusFilter('active')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon green"><Clock size={22} color="#ffffff" /></div>
          <div className="kpi-info">
            <span className="kpi-label">{t('Dossiers En Cours', 'قيد المعالجة', 'Active Dossiers')}</span>
            <h3 className="kpi-value">{stats.activeCount}</h3>
            <span className="kpi-sub">{t('En diagnostic/réparation', 'في الورشة حالياً', 'In diagnostic/repair')}</span>
          </div>
        </div>

        <div className="kpi-card profit-card" onClick={() => setStatusFilter('completed')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon emerald"><TrendingUp size={22} color="#ffffff" /></div>
          <div className="kpi-info">
            <span className="kpi-label">{t('Revenus SAV', 'مداخيل الصيانة', 'SAV Revenue')}</span>
            <h3 className="kpi-value profit-text">+{stats.totalSAVRevenue.toLocaleString()} DZD</h3>
            <span className="kpi-sub profit-text">{stats.completedCount} {t('réparations terminées', 'جهاز مكتمل', 'completed repairs')}</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => setStatusFilter('unreachable')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon red"><AlertTriangle size={22} color="#ffffff" /></div>
          <div className="kpi-info">
            <span className="kpi-label">{t('Non Joignables', 'غير متاحين', 'Unreachable')}</span>
            <h3 className="kpi-value" style={{ color: '#ef4444' }}>{stats.unreachableCount}</h3>
            <span className="kpi-sub" style={{ color: '#ef4444' }}>{t('Relance requise', 'يتطلب إعادة الاتصال', 'Follow-up required')}</span>
          </div>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="toolbar-card">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder={t('Rechercher par N° dossier, client, téléphone, marque, modèle...', 'بحث برقم الملف، اسم الزبون، الهاتف، الموديل...', 'Search by dossier #, customer, phone, brand, model...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-group">
          {/* Status Filter */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="all">{t('Tous les statuts', 'جميع الحالات', 'All Statuses')}</option>
            <option value="active">{t('Dossiers Actifs uniquement', 'الملفات النشطة (قيد المعالجة)', 'Active Dossiers Only')}</option>
            <option value="deposited">{t('Déposé (Attente diagnostic)', 'تم الإيداع', 'Deposited')}</option>
            <option value="diagnosing">{t('Diagnostic en cours', 'جارٍ التشخيص', 'Diagnosing')}</option>
            <option value="repairing">{t('En réparation', 'جارٍ الإصلاح', 'Repairing')}</option>
            <option value="waiting_parts">{t('Attente de pièces', 'في انتظار القطع', 'Waiting for Parts')}</option>
            <option value="completed">{t('Terminé / Prêt', 'مكتمل / جاهز', 'Completed / Ready')}</option>
            <option value="picked_up">{t('Récupéré par client', 'تم الاستلام', 'Picked Up by Client')}</option>
            <option value="unreachable">{t('Non joignable', 'غير متاح', 'Unreachable')}</option>
          </select>

          {/* Device Type Filter */}
          <select value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value as any)}>
            <option value="all">{t('Tous les types d\'appareils', 'جميع الأجهزة', 'All Device Types')}</option>
            <option value="laptop">{t('Laptop / PC Portable', 'كمبيوتر محمول', 'Laptop / Notebook')}</option>
            <option value="desktop">{t('Desktop / Tour PC', 'كمبيوتر مكتبي', 'Desktop PC')}</option>
            <option value="other">{t('Autre Appareil', 'جهاز آخر', 'Other Device')}</option>
          </select>
        </div>
      </div>

      {/* Data Table (Identical format to FacturesPage) */}
      <div className="table-card">
        {filteredRepairs.length === 0 ? (
          <div className="empty-state">
            <Wrench size={48} />
            <h3>{t('Aucun dossier de réparation trouvé', 'لا توجد ملفات صيانة', 'No repair dossiers found')}</h3>
            <p>{t('Essayez de modifier vos filtres de recherche ou créez un nouveau dépôt.', 'جرب تغيير خيارات البحث أو أنشئ ملفاً جديداً.', 'Try changing your search filters or create a new deposit.')}</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="factures-table">
              <thead>
                <tr>
                  <th>{t('N° Dossier', 'رقم الملف', 'Dossier #')}</th>
                  <th>{t('Date de Dépôt', 'تاريخ الإيداع', 'Deposit Date')}</th>
                  <th>{t('Client', 'الزبون', 'Customer')}</th>
                  <th>{t('Appareil', 'الجهاز', 'Device')}</th>
                  <th>{t('Assigné à', 'المعين له', 'Assigned To')}</th>
                  <th>{t('Montant Total', 'المبلغ الإجمالي', 'Total Amount')}</th>
                  <th>{t('Statut', 'الحالة', 'Status')}</th>
                  <th>{t('Actions', 'الإجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepairs.map(r => {
                  const conf = REPAIR_STATUS_CONFIG[r.status] || REPAIR_STATUS_CONFIG.deposited;
                  return (
                    <tr key={r.id}>
                      {/* Dossier Code */}
                      <td>
                        <span className="inv-code">{r.id}</span>
                      </td>

                      {/* Deposit Date */}
                      <td>
                        <div className="date-time-cell">
                          <span className="date-text"><Calendar size={13} /> {r.depositDate}</span>
                          <span className="time-text"><Clock size={12} /> {r.trackingCode}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td>
                        <div className="inv-customer-cell">
                          <span className="customer-name">{r.customerName}</span>
                          <span className="customer-sub">{r.customerPhone}</span>
                        </div>
                      </td>

                      {/* Device */}
                      <td>
                        <div className="inv-items-list">
                          <div className="item-row-badge">
                            <span className="item-qty"><Laptop size={13} /></span>
                            <span className="item-name"><strong>{r.deviceBrand}</strong> {r.deviceModel}</span>
                          </div>
                          {r.issueDescription && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                              {r.issueDescription.slice(0, 45)}{r.issueDescription.length > 45 ? '...' : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Assigned To */}
                      <td>
                        {r.assignedTo ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                            <span>{r.assignedTo.type === 'partner_shop' ? <Building2 size={13} color="#0057FF" style={{ display: 'inline', verticalAlign: 'middle' }} /> : <User size={13} color="#0057FF" style={{ display: 'inline', verticalAlign: 'middle' }} />}</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                            {t('Non assigné', 'غير معين', 'Unassigned')}
                          </span>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td>
                        <span className="total-price-text">{(r.totalAmount || 0).toLocaleString()} DZD</span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`status-pill ${conf.pillClass}`}
                          style={{ background: conf.bg, color: conf.color }}
                        >
                          {conf.label[isAr ? 'ar' : 'fr']}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="action-buttons-cell">
                          <button
                            className="dots-icon-btn edit-btn"
                            title={t('Gérer le dossier de réparation', 'إدارة ملف الصيانة', 'Manage repair dossier')}
                            onClick={() => setSelectedRepair(r)}
                            style={{ width: 'auto', padding: '0 12px', gap: 6, fontWeight: 700, fontSize: '0.78rem' }}
                          >
                            <Eye size={14} />
                            <span>{t('Gérer', 'إدارة', 'Manage')}</span>
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

      {/* New Deposit Modal */}
      {showNewDeposit && (
        <NewDepositModal
          onClose={() => setShowNewDeposit(false)}
          onCreated={(newRepair) => {
            setRepairs(prev => [newRepair, ...prev]);
            setShowNewDeposit(false);
            showToast(isAr ? 'تم إنشاء ملف الإصلاح بنجاح' : 'Dossier de réparation créé avec succès !', 'success');
          }}
        />
      )}

      {/* Repair Detail Modal */}
      {selectedRepair && (
        <RepairDetailModal
          repair={selectedRepair}
          onClose={() => setSelectedRepair(null)}
          onUpdated={handleRepairUpdated}
        />
      )}

      {/* Shared CSS styling matching FacturesPage */}
      <style>{`
        .factures-page-container {
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

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        @media (max-width: 900px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .kpi-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.2s;
        }
        .kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

        .kpi-card.profit-card {
          background: rgba(16, 185, 129, 0.05);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .kpi-icon {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .kpi-icon.blue { background: rgba(0, 85, 255, 0.12); color: #0055ff; }
        .kpi-icon.green { background: rgba(16, 185, 129, 0.12); color: #10b981; }
        .kpi-icon.emerald { background: #10b981; color: #ffffff; }
        .kpi-icon.orange { background: #ef4444; color: #ffffff; }

        .kpi-info { display: flex; flex-direction: column; }
        .kpi-label { font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); }
        .kpi-value { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin: 2px 0; font-family: var(--font-display); }
        .kpi-sub { font-size: 0.7rem; color: var(--text-tertiary); }
        .profit-text { color: #10b981; }

        .toolbar-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-secondary);
          border-radius: 10px;
          padding: 8px 14px;
          flex: 1;
          min-width: 250px;
          color: var(--text-secondary);
        }
        .search-box input {
          border: none; background: transparent; outline: none; width: 100%;
          color: var(--text-primary); font-size: 0.85rem; font-family: inherit;
        }

        .filters-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filters-group select {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid var(--border-secondary);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: 0.82rem;
          font-family: inherit;
          outline: none;
          cursor: pointer;
        }

        .table-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 16px;
          overflow: hidden;
        }

        .table-scroll { overflow-x: auto; }

        .factures-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
        }

        .factures-table thead { background: var(--bg-tertiary); }

        .factures-table th {
          padding: 14px 16px;
          text-align: start;
          font-weight: 700;
          color: var(--text-secondary);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--border-secondary);
          white-space: nowrap;
        }

        .factures-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-secondary);
          color: var(--text-primary);
          vertical-align: middle;
        }

        .factures-table tbody tr { transition: background 0.15s; }
        .factures-table tbody tr:hover { background: var(--bg-tertiary); }

        .inv-code { font-family: var(--font-mono); font-weight: 700; color: var(--color-brand); font-size: 0.85rem; }

        .date-time-cell { display: flex; flex-direction: column; gap: 3px; }
        .date-text { display: flex; align-items: center; gap: 4px; font-weight: 600; font-size: 0.82rem; color: var(--text-primary); }
        .time-text { display: flex; align-items: center; gap: 4px; font-size: 0.74rem; color: var(--text-secondary); }

        .inv-customer-cell { display: flex; flex-direction: column; }
        .customer-name { font-weight: 600; color: var(--text-primary); }
        .customer-sub { font-size: 0.72rem; color: var(--text-tertiary); }

        .inv-items-list { display: flex; flex-direction: column; gap: 4px; }
        .item-row-badge { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; }
        .item-qty { font-weight: 800; color: var(--color-brand); }
        .item-name { color: var(--text-primary); }

        .total-price-text { font-weight: 800; font-size: 0.9rem; color: var(--text-primary); }

        .status-pill {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .status-pill.paid { background: rgba(16, 185, 129, 0.12); color: #10b981; }
        .status-pill.warning { background: rgba(217, 119, 6, 0.12); color: #d97706; }
        .status-pill.returned { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
        .status-pill.cancelled { background: rgba(100, 116, 139, 0.12); color: #64748b; }

        .action-buttons-cell { display: flex; align-items: center; gap: 6px; }

        .dots-icon-btn {
          height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--border-secondary); background: transparent;
          color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
        }
        .dots-icon-btn:hover { background: var(--bg-tertiary); color: var(--color-brand); }
        .dots-icon-btn.edit-btn:hover { color: #0055ff; border-color: rgba(0, 85, 255, 0.3); }

        .empty-state {
          padding: 64px 32px; text-align: center; color: var(--text-tertiary);
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .empty-state h3 { color: var(--text-primary); margin: 0; }
        .empty-state p { margin: 0; }
      `}</style>
    </div>
  );
}
