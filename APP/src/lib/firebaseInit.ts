import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './config';

export { firebaseConfig, isFirebaseConfigured };

// Initialiser Firebase avec fallback sécurisé (évite l'écran blanc si clés vides)
const effectiveConfig = isFirebaseConfigured()
    ? firebaseConfig
    : {
        apiKey: firebaseConfig.apiKey || 'AIzaSyDemoDummyKeyForAppStartup12345',
        authDomain: firebaseConfig.authDomain || 'demo-nhtech.firebaseapp.com',
        projectId: firebaseConfig.projectId || 'demo-nhtech',
        storageBucket: firebaseConfig.storageBucket || 'demo-nhtech.appspot.com',
        messagingSenderId: firebaseConfig.messagingSenderId || '123456789012',
        appId: firebaseConfig.appId || '1:123456789012:web:demo1234567890',
    };

const app = initializeApp(effectiveConfig);
export const auth = getAuth(app);

// Initialize Firestore with persistence
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache()
});

let appConnectivityOnline: boolean | null = null;
export const setAppConnectivityOnline = (online: boolean | null) => {
    appConnectivityOnline = online;
};
export const isAppOnline = () => {
    return appConnectivityOnline ?? navigator.onLine;
};
