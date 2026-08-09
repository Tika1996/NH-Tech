// Configuration management for Qalbi ITMAAN
// Extracted to avoid circular dependencies

interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
}

import { BRAND } from './brand';

export const FIREBASE_CONFIG_STORAGE_KEY = `${BRAND.storagePrefix}_firebase_config`;

export const parseFirebaseConfigFromText = (text: string): Partial<FirebaseConfig> => {
    const out: Partial<FirebaseConfig> = {};

    const trimmed = (text || '').trim();
    if (!trimmed) return out;

    const tryMatch = (key: keyof FirebaseConfig) => {
        const re = new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`, 'i');
        const m = trimmed.match(re);
        if (m?.[1]) out[key] = m[1] as any;
    };

    tryMatch('apiKey');
    tryMatch('authDomain');
    tryMatch('projectId');
    tryMatch('storageBucket');
    tryMatch('messagingSenderId');
    tryMatch('appId');
    tryMatch('measurementId');

    const envPairs: Record<string, keyof FirebaseConfig> = {
        VITE_FIREBASE_API_KEY: 'apiKey',
        VITE_FIREBASE_AUTH_DOMAIN: 'authDomain',
        VITE_FIREBASE_PROJECT_ID: 'projectId',
        VITE_FIREBASE_STORAGE_BUCKET: 'storageBucket',
        VITE_FIREBASE_MESSAGING_SENDER_ID: 'messagingSenderId',
        VITE_FIREBASE_APP_ID: 'appId',
        VITE_FIREBASE_MEASUREMENT_ID: 'measurementId',
    };

    for (const [envKey, cfgKey] of Object.entries(envPairs)) {
        const re = new RegExp(`^\\s*${envKey}\\s*=\\s*(.+?)\\s*$`, 'm');
        const m = trimmed.match(re);
        if (m?.[1]) {
            const val = m[1].trim().replace(/^['"]|['"]$/g, '');
            if (val) out[cfgKey] = val as any;
        }
    }

    return out;
};

export const saveFirebaseConfigToStorage = (partial: Partial<FirebaseConfig>) => {
    if (!partial.apiKey || !partial.projectId) {
        throw new Error("L'API Key et le Project ID sont obligatoires.");
    }

    const current = loadFirebaseConfig();
    const merged: FirebaseConfig = {
        apiKey: partial.apiKey ?? current.apiKey,
        authDomain: partial.authDomain ?? current.authDomain,
        projectId: partial.projectId ?? current.projectId,
        storageBucket: partial.storageBucket ?? current.storageBucket,
        messagingSenderId: partial.messagingSenderId ?? current.messagingSenderId,
        appId: partial.appId ?? current.appId,
        measurementId: partial.measurementId ?? current.measurementId,
    };

    localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(merged));
};

export const loadFirebaseConfig = (): FirebaseConfig => {
    const defaultConfig: FirebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
    };


    try {
        const stored = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
        if (stored) {
            const config = JSON.parse(stored);
            if (config.apiKey && config.apiKey !== 'YOUR_API_KEY' && config.projectId && config.projectId !== 'YOUR_PROJECT_ID') {
                console.log('[CONFIG] Using custom configuration from localStorage');
                return config;
            }
        }
    } catch (e) {
        console.warn('[CONFIG] Error reading config from storage', e);
    }

    console.log('[CONFIG] Using default/env configuration');
    return defaultConfig;
};

export const firebaseConfig = loadFirebaseConfig();

export const SETUP_COMPLETED_STORAGE_KEY = `${BRAND.storagePrefix}_setup_completed`;

export const isFirebaseConfigured = () => {
    return !!(firebaseConfig.apiKey &&
        firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
        firebaseConfig.projectId &&
        firebaseConfig.projectId !== 'YOUR_PROJECT_ID');
};

export const isAppConfigured = (): boolean => {
    if (isFirebaseConfigured()) return true;

    if (localStorage.getItem(SETUP_COMPLETED_STORAGE_KEY) === 'true') return true;

    try {
        const offlineCreds = localStorage.getItem(`${BRAND.storagePrefix}_offline_credentials`);
        if (offlineCreds) {
            const parsed = JSON.parse(offlineCreds);
            if (parsed && Object.keys(parsed).length > 0) return true;
        }
    } catch (e) {
        /* ignore */
    }

    return false;
};

export const getPublicWebsiteUrl = (): string => {
    const envUrl = import.meta.env.VITE_PUBLIC_WEBSITE_URL;
    if (envUrl && envUrl.trim()) {
        return envUrl.trim().replace(/\/$/, '');
    }

    const storedUrl = localStorage.getItem('nh_public_website_url');
    if (storedUrl && storedUrl.trim()) {
        return storedUrl.trim().replace(/\/$/, '');
    }

    if (window.location.origin.includes('localhost')) {
        return 'http://localhost:5174';
    }

    return 'https://nhtech-dz.web.app';
};
