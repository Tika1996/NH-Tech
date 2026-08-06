export type Role = 'admin' | 'manager' | 'secretariat' | 'professeur' | 'comptable' | 'staff' | 'cashier' | 'technicien';

export const ROLES: Record<string, Role> = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    SECRETARIAT: 'secretariat',
    PROFESSEUR: 'professeur',
    COMPTABLE: 'comptable',
    STAFF: 'staff',
    CASHIER: 'cashier',
    TECHNICIEN: 'technicien',
};

export const ROLE_LABELS: Record<Role, { fr: string; ar: string }> = {
    admin: { fr: 'Administrateur', ar: 'مدير مسؤول' },
    manager: { fr: 'Manager', ar: 'مدير' },
    secretariat: { fr: 'Secrétariat', ar: 'سكرتارية' },
    professeur: { fr: 'Professeur', ar: 'أستاذ' },
    comptable: { fr: 'Comptable', ar: 'محاسب' },
    staff: { fr: 'Staff', ar: 'موظف' },
    cashier: { fr: 'Caissier', ar: 'أمين صندوق' },
    technicien: { fr: 'Technicien SAV', ar: 'تقني صيانة' },
};
