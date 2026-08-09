import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui';
import { getUserPermissions, setUserPermissions } from '../../lib/rolesStore';
import type { ModuleKey, UserPermissions } from '../../types/permissions';
import { MODULE_LABELS, EMPTY_PERMISSIONS, FULL_ADMIN_PERMISSIONS, DASHBOARD_SUB_PERMISSIONS } from '../../types/permissions';
import { X, ShieldCheck, Key, Eye, Plus, Edit2, Trash2, Printer, DollarSign, Check, Loader2 } from 'lucide-react';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffMember: {
    id: string;
    name: string;
    role: string;
  } | null;
  onSuccess?: () => void;
}

export function UserPermissionsModal({ isOpen, onClose, staffMember, onSuccess }: UserPermissionsModalProps) {
  const { language } = useAppStore();
  const { showToast } = useToast();
  const isAr = language === 'ar';

  const [permissions, setPermissions] = useState<UserPermissions>(EMPTY_PERMISSIONS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (staffMember) {
      const current = getUserPermissions(staffMember.id, staffMember.role);
      setPermissions(JSON.parse(JSON.stringify(current)));
    }
  }, [staffMember]);

  if (!isOpen || !staffMember) return null;

  const handleToggleModuleView = (modKey: ModuleKey) => {
    setPermissions(prev => {
      const currentView = prev[modKey]?.view || false;
      const nextView = !currentView;
      return {
        ...prev,
        [modKey]: {
          ...prev[modKey],
          view: nextView,
          // if enabling view, default enable view, else disable all
          create: nextView ? prev[modKey]?.create : false,
          edit: nextView ? prev[modKey]?.edit : false,
          delete: nextView ? prev[modKey]?.delete : false,
          export: nextView ? prev[modKey]?.export : false,
          financials: nextView ? prev[modKey]?.financials : false,
        }
      };
    });
  };

  const handleToggleAction = (modKey: ModuleKey, action: keyof UserPermissions[ModuleKey]) => {
    setPermissions(prev => {
      const currentVal = !!prev[modKey]?.[action];
      return {
        ...prev,
        [modKey]: {
          ...prev[modKey],
          view: true, // auto enable view if action toggled
          [action]: !currentVal,
        }
      };
    });
  };

  const handleToggleSubPermission = (modKey: ModuleKey, subKey: string) => {
    setPermissions(prev => {
      const currentSub = prev[modKey]?.subPermissions || {};
      const currentVal = currentSub[subKey] !== undefined ? currentSub[subKey] : true;
      return {
        ...prev,
        [modKey]: {
          ...prev[modKey],
          view: true,
          subPermissions: {
            ...currentSub,
            [subKey]: !currentVal,
          }
        }
      };
    });
  };

  const isTargetAdmin = staffMember.role === 'admin';

  const handleSelectAll = () => {
    if (isTargetAdmin) return;
    setPermissions(FULL_ADMIN_PERMISSIONS);
  };

  const handleClearAll = () => {
    if (isTargetAdmin) return;
    setPermissions(EMPTY_PERMISSIONS);
  };

  const handleSave = async () => {
    if (isTargetAdmin) {
      showToast(isAr ? 'حساب المسؤول يتمتع بجميع الصلاحيات دائماً ولا يمكن تعديلها' : 'Les comptes Administrateurs disposent toujours d\'un accès total.', 'info');
      onClose();
      return;
    }
    try {
      setSaving(true);
      await setUserPermissions(staffMember.id, permissions);
      showToast(
        isAr ? `تم تحديث صلاحيات الوصول للموظف ${staffMember.name} بنجاح` : `Permissions d'accès pour ${staffMember.name} mises à jour avec succès`,
        'success'
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      showToast(isAr ? 'خطأ أثناء حفظ الصلاحيات' : 'Erreur lors de la sauvegarde des permissions', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '850px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-tertiary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #00F0FF 0%, #0057FF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF'
            }}>
              <Key size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #F8FAFC)' }}>
                {isAr ? `تعديل صلاحيات الوصول: ${staffMember.name}` : `Attribution des Accès : ${staffMember.name}`}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary, #94A3B8)', margin: '2px 0 0 0' }}>
                {isAr ? 'حدد الصفحات والعمليات المسموح بها لهذا الموظف بالتحديد' : 'Définissez les pages et actions autorisées pour cet employé'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '10px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {isTargetAdmin && (
          <div style={{
            padding: '14px 24px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#3B82F6'
          }}>
            <ShieldCheck size={20} />
            <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>
              {isAr
                ? '🔒 حساب المسؤول الرئيسي يتمتع بصلاحيات كاملة دائماً ولا يمكن تعديل أو تقييد وصوله.'
                : '🔒 Le compte Administrateur système dispose d\'un accès total inconditionnel. Ses permissions ne peuvent pas être restreintes.'}
            </span>
          </div>
        )}

        {/* Action bar for select all / clear all */}
        <div style={{
          padding: '12px 24px',
          background: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {isAr ? 'تخصيص الصلاحيات بالصفحة:' : 'Accès granulaires par module :'}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSelectAll}
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
            >
              {isAr ? 'تحديد الكل (صلاحيات كاملة)' : 'Tout autoriser (Accès Total)'}
            </button>
            <button
              onClick={handleClearAll}
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px', color: '#EF4444' }}
            >
              {isAr ? 'إلغاء الكل' : 'Tout désactiver'}
            </button>
          </div>
        </div>

        {/* Modules Permissions Matrix */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(Object.keys(MODULE_LABELS) as ModuleKey[]).map((modKey) => {
              const info = MODULE_LABELS[modKey];
              const perm = permissions[modKey] || { view: false, create: false, edit: false, delete: false };
              const isView = perm.view;

              return (
                <div
                  key={modKey}
                  style={{
                    borderRadius: '16px',
                    border: isView ? '1px solid var(--color-brand)' : '1px solid var(--border-secondary)',
                    background: isView ? 'rgba(0, 85, 255, 0.04)' : 'var(--bg-tertiary)',
                    padding: '16px 20px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    
                    {/* Module Title & Main Toggle Switch */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
                        <input
                          type="checkbox"
                          checked={isView}
                          onChange={() => handleToggleModuleView(modKey)}
                          style={{
                            width: '20px',
                            height: '20px',
                            accentColor: 'var(--color-brand)',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.98rem',
                          color: isView ? 'var(--text-primary)' : 'var(--text-tertiary)'
                        }}>
                          {info[isAr ? 'ar' : 'fr']}
                        </span>
                      </label>
                    </div>

                    {/* Action Checkboxes */}
                    {isView && modKey !== 'dashboard' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        
                        {/* Ajouter */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: perm.create ? '#22C55E' : 'var(--text-secondary)', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={!!perm.create}
                            onChange={() => handleToggleAction(modKey, 'create')}
                            style={{ accentColor: '#22C55E' }}
                          />
                          <Plus size={14} />
                          <span>{isAr ? 'إضافة' : 'Ajouter'}</span>
                        </label>

                        {/* Modifier */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: perm.edit ? '#3B82F6' : 'var(--text-secondary)', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={!!perm.edit}
                            onChange={() => handleToggleAction(modKey, 'edit')}
                            style={{ accentColor: '#3B82F6' }}
                          />
                          <Edit2 size={14} />
                          <span>{isAr ? 'تعديل' : 'Modifier'}</span>
                        </label>

                        {/* Supprimer */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: perm.delete ? '#EF4444' : 'var(--text-secondary)', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={!!perm.delete}
                            onChange={() => handleToggleAction(modKey, 'delete')}
                            style={{ accentColor: '#EF4444' }}
                          />
                          <Trash2 size={14} />
                          <span>{isAr ? 'حذف' : 'Supprimer'}</span>
                        </label>

                        {/* Exporter */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: perm.export ? '#A855F7' : 'var(--text-secondary)', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={!!perm.export}
                            onChange={() => handleToggleAction(modKey, 'export')}
                            style={{ accentColor: '#A855F7' }}
                          />
                          <Printer size={14} />
                          <span>{isAr ? 'طباعة/تصدير' : 'Exporter'}</span>
                        </label>

                        {/* Finances / Chiffres */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: perm.financials ? '#F59E0B' : 'var(--text-secondary)', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={!!perm.financials}
                            onChange={() => handleToggleAction(modKey, 'financials')}
                            style={{ accentColor: '#F59E0B' }}
                          />
                          <DollarSign size={14} />
                          <span>{isAr ? 'الأرقام والأرباح' : 'Finances / Marge'}</span>
                        </label>

                      </div>
                    )}
                  </div>

                  {/* Dashboard Sub-Permissions / Section Toggles */}
                  {isView && modKey === 'dashboard' && (
                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed var(--border-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isAr ? 'العناصر والبطاقات المسموح برؤيتها على لوحة التحكم:' : 'Éléments et Cartes visibles sur le Tableau de Bord :'}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px 16px' }}>
                        {Object.entries(DASHBOARD_SUB_PERMISSIONS).map(([subKey, labels]) => {
                          const subPerms = perm.subPermissions || {};
                          const isChecked = subPerms[subKey] !== undefined ? subPerms[subKey] : true;

                          return (
                            <label key={subKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.81rem', cursor: 'pointer', color: isChecked ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: isChecked ? 700 : 500 }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSubPermission(modKey, subKey)}
                                style={{ accentColor: 'var(--color-brand)', cursor: 'pointer' }}
                              />
                              <span>{labels[isAr ? 'ar' : 'fr']}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid var(--border-secondary)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          background: 'var(--bg-tertiary)'
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            {isAr ? 'إلغاء' : 'Annuler'}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              borderRadius: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={18} />}
            <span>{isAr ? 'حفظ الصلاحيات' : 'Enregistrer les Accès'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
