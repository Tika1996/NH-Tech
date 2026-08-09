import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui';
import { saveRole } from '../../lib/rolesStore';
import type { CustomRole, ModuleKey, UserPermissions } from '../../types/permissions';
import { MODULE_LABELS, EMPTY_PERMISSIONS, DASHBOARD_SUB_PERMISSIONS } from '../../types/permissions';
import { X, Shield, Plus, Edit2, Trash2, Printer, DollarSign, Check, Loader2 } from 'lucide-react';

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleToEdit?: CustomRole | null;
  onSuccess?: () => void;
}

const COLOR_OPTIONS = ['#3B82F6', '#00F0FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B'];

export function RolePermissionsModal({ isOpen, onClose, roleToEdit, onSuccess }: RolePermissionsModalProps) {
  const { language } = useAppStore();
  const { showToast } = useToast();
  const isAr = language === 'ar';

  const [roleNameFr, setRoleNameFr] = useState('');
  const [roleNameAr, setRoleNameAr] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [permissions, setPermissions] = useState<UserPermissions>(EMPTY_PERMISSIONS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (roleToEdit) {
      setRoleNameFr(roleToEdit.name.fr || '');
      setRoleNameAr(roleToEdit.name.ar || '');
      setDescription(roleToEdit.description || '');
      setColor(roleToEdit.color || '#3B82F6');
      setPermissions(roleToEdit.permissions || EMPTY_PERMISSIONS);
    } else {
      setRoleNameFr('');
      setRoleNameAr('');
      setDescription('');
      setColor('#3B82F6');
      setPermissions(EMPTY_PERMISSIONS);
    }
  }, [roleToEdit, isOpen]);

  if (!isOpen) return null;

  const handleToggleModuleView = (modKey: ModuleKey) => {
    setPermissions(prev => {
      const currentView = !!prev[modKey]?.view;
      const nextView = !currentView;
      return {
        ...prev,
        [modKey]: {
          ...prev[modKey],
          view: nextView,
          create: nextView ? prev[modKey]?.create : false,
          edit: nextView ? prev[modKey]?.edit : false,
          delete: nextView ? prev[modKey]?.delete : false,
          export: nextView ? prev[modKey]?.export : false,
          financials: nextView ? prev[modKey]?.financials : false,
          subPermissions: prev[modKey]?.subPermissions,
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
          view: true,
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

  const isAdminRole = roleToEdit?.id === 'admin';

  const handleSave = async () => {
    if (isAdminRole) {
      showToast(isAr ? 'وظيفة المسؤول تتمتع بصلاحيات كاملة دائماً' : 'Le rôle Administrateur a toujours un accès total.', 'info');
      onClose();
      return;
    }

    if (!roleNameFr.trim() && !roleNameAr.trim()) {
      showToast(isAr ? 'يرجى إدخال اسم الوظيفة' : 'Veuillez saisir un nom pour le rôle', 'error');
      return;
    }

    try {
      setSaving(true);

      const roleId = roleToEdit?.id || roleNameFr.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);

      const newRole: CustomRole = {
        id: roleId,
        name: {
          fr: roleNameFr.trim() || roleNameAr.trim(),
          ar: roleNameAr.trim() || roleNameFr.trim(),
        },
        description: description.trim(),
        color,
        isSystem: roleToEdit?.isSystem || false,
        permissions,
        createdAt: roleToEdit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveRole(newRole);
      showToast(
        isAr ? 'تم حفظ الوظيفة بنجاح' : 'Modèle de rôle sauvegardé avec succès',
        'success'
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      showToast(isAr ? 'خطأ أثناء الحفظ' : 'Erreur lors de la sauvegarde du rôle', 'error');
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
              background: 'linear-gradient(135deg, #3B82F6 0%, #00F0FF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF'
            }}>
              <Shield size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #F8FAFC)' }}>
                {roleToEdit
                  ? (isAr ? `تعديل الوظيفة: ${roleToEdit.name[isAr ? 'ar' : 'fr']}` : `Modifier le Rôle : ${roleToEdit.name.fr}`)
                  : (isAr ? 'إنشاء وظيفة / دور جديد' : 'Créer un nouveau Modèle de Rôle')}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary, #94A3B8)', margin: '2px 0 0 0' }}>
                {isAr ? 'حدد مسمى الوظيفة والصلاحيات الافتراضية الممنوحة لها' : 'Définissez le nom du rôle et ses permissions par défaut'}
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

        {isAdminRole && (
          <div style={{
            padding: '14px 24px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#3B82F6'
          }}>
            <Shield size={20} />
            <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>
              {isAr
                ? '🔒 نموذج وظيفة المسؤول الرئيسي ثابت ومحمية، ويمتلك صلاحيات شاملة دائماً.'
                : '🔒 Le rôle Administrateur est le rôle système principal. Ses permissions sont intégrales et ne peuvent pas être modifiées.'}
            </span>
          </div>
        )}

        {/* Form Details */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {/* Nom FR */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                {isAr ? 'اسم الوظيفة بالفرنسية' : 'Nom du rôle (Français)'} *
              </label>
              <input
                type="text"
                className="input"
                value={roleNameFr}
                onChange={(e) => setRoleNameFr(e.target.value)}
                placeholder="Ex: Technicien SAV, Agent de Vente..."
                style={{ height: '42px', borderRadius: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', width: '100%', padding: '0 14px' }}
              />
            </div>

            {/* Nom AR */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                {isAr ? 'اسم الوظيفة بالعربية' : 'Nom du rôle (Arabe)'}
              </label>
              <input
                type="text"
                className="input"
                value={roleNameAr}
                onChange={(e) => setRoleNameAr(e.target.value)}
                placeholder="مثال: تقني صيانة، موظف مبيعات..."
                dir="rtl"
                style={{ height: '42px', borderRadius: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', width: '100%', padding: '0 14px' }}
              />
            </div>
          </div>

          {/* Couleur & Description */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'flex-start' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                {isAr ? 'لون الشارة (Badge Color)' : 'Couleur de badge'}
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '4px' }}>
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: color === c ? '3px solid #FFF' : '2px solid transparent',
                      cursor: 'pointer',
                      boxShadow: color === c ? '0 0 12px ' + c : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                {isAr ? 'وصف الوظيفة (اختياري)' : 'Description (Optionnel)'}
              </label>
              <input
                type="text"
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Accès complet aux pièces et facturation uniquement"
                style={{ height: '42px', borderRadius: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', width: '100%', padding: '0 14px' }}
              />
            </div>
          </div>

          {/* Permissions Matrix */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '14px', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {isAr ? 'جدول الصلاحيات لهذا الدور:' : 'Matrice des permissions par module :'}
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(Object.keys(MODULE_LABELS) as ModuleKey[]).map((modKey) => {
                const info = MODULE_LABELS[modKey];
                const perm = permissions[modKey] || { view: false, create: false, edit: false, delete: false };
                const isView = perm.view;

                return (
                  <div
                    key={modKey}
                    style={{
                      borderRadius: '14px',
                      border: isView ? '1px solid var(--color-brand)' : '1px solid var(--border-secondary)',
                      background: isView ? 'rgba(0, 85, 255, 0.04)' : 'var(--bg-tertiary)',
                      padding: '14px 18px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px', minWidth: '200px' }}>
                        <input
                          type="checkbox"
                          checked={isView}
                          onChange={() => handleToggleModuleView(modKey)}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--color-brand)', cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: 700, fontSize: '0.94rem', color: isView ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                          {info[isAr ? 'ar' : 'fr']}
                        </span>
                      </label>

                      {isView && modKey !== 'dashboard' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: perm.create ? '#22C55E' : 'var(--text-secondary)', fontWeight: 600 }}>
                            <input type="checkbox" checked={!!perm.create} onChange={() => handleToggleAction(modKey, 'create')} style={{ accentColor: '#22C55E' }} />
                            <span>{isAr ? 'إضافة' : 'Ajouter'}</span>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: perm.edit ? '#3B82F6' : 'var(--text-secondary)', fontWeight: 600 }}>
                            <input type="checkbox" checked={!!perm.edit} onChange={() => handleToggleAction(modKey, 'edit')} style={{ accentColor: '#3B82F6' }} />
                            <span>{isAr ? 'تعديل' : 'Modifier'}</span>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: perm.delete ? '#EF4444' : 'var(--text-secondary)', fontWeight: 600 }}>
                            <input type="checkbox" checked={!!perm.delete} onChange={() => handleToggleAction(modKey, 'delete')} style={{ accentColor: '#EF4444' }} />
                            <span>{isAr ? 'حذف' : 'Supprimer'}</span>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: perm.export ? '#A855F7' : 'var(--text-secondary)', fontWeight: 600 }}>
                            <input type="checkbox" checked={!!perm.export} onChange={() => handleToggleAction(modKey, 'export')} style={{ accentColor: '#A855F7' }} />
                            <span>{isAr ? 'تصدير/طباعة' : 'Exporter'}</span>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: perm.financials ? '#F59E0B' : 'var(--text-secondary)', fontWeight: 600 }}>
                            <input type="checkbox" checked={!!perm.financials} onChange={() => handleToggleAction(modKey, 'financials')} style={{ accentColor: '#F59E0B' }} />
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
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving} style={{ borderRadius: '12px', height: '42px', padding: '0 20px', fontWeight: 700 }}>
            {isAr ? 'إلغاء' : 'Annuler'}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ borderRadius: '12px', height: '42px', padding: '0 24px', fontWeight: 800, gap: '8px' }}>
            {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={18} />}
            <span>{isAr ? 'حفظ الوظيفة' : 'Enregistrer le Rôle'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
