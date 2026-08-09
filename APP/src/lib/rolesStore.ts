import type {
  CustomRole,
  ModuleKey,
  UserPermissions
} from '../types/permissions';
import {
  DEFAULT_ROLES,
  EMPTY_PERMISSIONS,
  FULL_ADMIN_PERMISSIONS,
} from '../types/permissions';
import { db } from './firebaseInit';
import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { BRAND } from './brand';

const ROLES_STORAGE_KEY = `${BRAND.storagePrefix}_custom_roles_v1`;
const USER_PERMISSIONS_STORAGE_KEY = `${BRAND.storagePrefix}_user_permissions_v1`;

// Memory caches
let cachedRoles: CustomRole[] = [];
let cachedUserPermissions: Record<string, UserPermissions> = {};

// Listeners
type RolesListener = (roles: CustomRole[]) => void;
const rolesListeners: Set<RolesListener> = new Set();

// Load initial stored roles
function loadStoredRoles(): CustomRole[] {
  try {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return DEFAULT_ROLES;
}

// Load initial stored user permissions
function loadStoredUserPermissions(): Record<string, UserPermissions> {
  try {
    const raw = localStorage.getItem(USER_PERMISSIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

cachedRoles = loadStoredRoles();
cachedUserPermissions = loadStoredUserPermissions();

// Save roles to localStorage
function saveRolesLocally(roles: CustomRole[]) {
  cachedRoles = roles;
  try {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
  } catch { /* ignore */ }
  rolesListeners.forEach(fn => fn(roles));
}

// Save user permissions to localStorage
function saveUserPermissionsLocally(data: Record<string, UserPermissions>) {
  cachedUserPermissions = data;
  try {
    localStorage.setItem(USER_PERMISSIONS_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// Sync roles with Firebase Firestore if online
export function subscribeRoles(callback: RolesListener): () => void {
  rolesListeners.add(callback);
  callback(cachedRoles);

  try {
    const colRef = collection(db, 'roles');
    const unsub = onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreRoles: CustomRole[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CustomRole));
        // Merge with default admin if missing
        if (!firestoreRoles.some(r => r.id === 'admin')) {
          firestoreRoles.unshift(DEFAULT_ROLES[0]);
        }
        saveRolesLocally(firestoreRoles);
      }
    }, () => { /* offline silent fallback */ });

    return () => {
      rolesListeners.delete(callback);
      unsub();
    };
  } catch {
    return () => { rolesListeners.delete(callback); };
  }
}

// Get all roles
export function getRoles(): CustomRole[] {
  return cachedRoles.length > 0 ? cachedRoles : DEFAULT_ROLES;
}

// Get specific role by ID
export function getRoleById(roleId: string): CustomRole | undefined {
  return getRoles().find(r => r.id === roleId);
}

// Save or Update a Custom Role
export async function saveRole(role: CustomRole): Promise<void> {
  const roles = [...getRoles()];
  const idx = roles.findIndex(r => r.id === role.id);
  if (idx >= 0) {
    roles[idx] = { ...role, updatedAt: new Date().toISOString() };
  } else {
    roles.push({ ...role, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  saveRolesLocally(roles);

  try {
    const docRef = doc(db, 'roles', role.id);
    await setDoc(docRef, role, { merge: true });
  } catch { /* offline queue handles local */ }
}

// Delete a Custom Role
export async function deleteRole(roleId: string): Promise<boolean> {
  const role = getRoleById(roleId);
  if (!role || role.isSystem || role.id === 'admin') return false;

  const filtered = getRoles().filter(r => r.id !== roleId);
  saveRolesLocally(filtered);

  try {
    await deleteDoc(doc(db, 'roles', roleId));
  } catch { /* ignore */ }
  return true;
}

// Set Custom Permissions for a specific User ID
export async function setUserPermissions(userId: string, permissions: UserPermissions): Promise<void> {
  const updated = { ...cachedUserPermissions, [userId]: permissions };
  saveUserPermissionsLocally(updated);

  try {
    const docRef = doc(db, 'user_permissions', userId);
    await setDoc(docRef, { userId, permissions, updatedAt: new Date().toISOString() });
  } catch { /* ignore */ }
}

// Get Effective Permissions for a user (checks custom user permissions first, then fallback to user's role)
export function getUserPermissions(userId?: string, roleId?: string): UserPermissions {
  // If user is Admin -> FULL ACCESS ALWAYS
  if (roleId === 'admin') {
    return FULL_ADMIN_PERMISSIONS;
  }

  // 1. Check if specific custom permissions exist for this individual user
  if (userId && cachedUserPermissions[userId]) {
    return cachedUserPermissions[userId];
  }

  // 2. Fallback to Role permissions
  if (roleId) {
    const role = getRoleById(roleId);
    if (role?.permissions) {
      return role.permissions;
    }
  }

  // 3. Absolute fallback
  return EMPTY_PERMISSIONS;
}

// Helper to check if user has access to a module
export function userHasModuleAccess(userId: string | undefined, roleId: string | undefined, moduleKey: ModuleKey): boolean {
  if (roleId === 'admin') return true;
  const perms = getUserPermissions(userId, roleId);
  return !!perms[moduleKey]?.view;
}
