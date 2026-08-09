import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { getUserPermissions, userHasModuleAccess } from '../lib/rolesStore';
import type { ModuleKey, ModulePermissions, UserPermissions } from '../types/permissions';

export function usePermissions() {
  const { currentUser } = useAppStore();

  const userId = currentUser?.id;
  const roleId = currentUser?.role;

  const permissions: UserPermissions = useMemo(() => {
    return getUserPermissions(userId, roleId);
  }, [userId, roleId]);

  const isAdmin = roleId === 'admin';

  /**
   * Check if current logged in user can perform an action on a module
   * Ex: `can('laptops', 'delete')`, `can('factures', 'financials')`
   */
  const can = (moduleKey: ModuleKey, action: keyof ModulePermissions): boolean => {
    if (isAdmin) return true;
    return !!permissions[moduleKey]?.[action];
  };

  /**
   * Check if user can view/access a module page
   * Ex: `hasModuleAccess('reparations')`
   */
  const hasModuleAccess = (moduleKey: ModuleKey): boolean => {
    if (isAdmin) return true;
    return userHasModuleAccess(userId, roleId, moduleKey);
  };

  /**
   * Check if user can view a specific sub-element / card of a module
   * Ex: `canViewSubItem('dashboard', 'caBrut')`
   */
  const canViewSubItem = (moduleKey: ModuleKey, subItemKey: string): boolean => {
    if (isAdmin) return true;
    const subPerms = permissions[moduleKey]?.subPermissions;
    if (subPerms && subPerms[subItemKey] !== undefined) {
      return !!subPerms[subItemKey];
    }
    return true;
  };

  return {
    isAdmin,
    permissions,
    can,
    hasModuleAccess,
    canViewSubItem,
  };
}
