import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BRAND } from '../lib/brand';

type Language = 'fr' | 'ar' | 'en';
type Theme = 'light' | 'dark';

interface AppState {
    // Langue et thème
    language: Language;
    theme: Theme;
    setLanguage: (lang: Language) => void;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;

    // Sidebar
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;

    // User session
    isAuthenticated: boolean;
    currentUser: {
        id: string;
        name: string;
        email: string;
        role: string;
        language?: Language;
        isActive?: boolean;
        createdAt?: Date | string;
        updatedAt?: Date | string;
    } | null;
    setUser: (user: AppState['currentUser']) => void;
    setAuthenticated: (isAuth: boolean) => void;
    setCurrentUser: (user: AppState['currentUser']) => void;
    logout: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, _get) => ({
            // Langue et thème par défaut
            language: 'fr',
            theme: 'light',
            setLanguage: (language) => set({ language }),
            setTheme: (theme) => set({ theme }),
            toggleTheme: () => set((state) => ({
                theme: state.theme === 'light' ? 'dark' : 'light'
            })),

            // Sidebar
            sidebarCollapsed: false,
            toggleSidebar: () => set((state) => ({
                sidebarCollapsed: !state.sidebarCollapsed
            })),

            // User session
            isAuthenticated: false,
            currentUser: null,
            setUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),
            setAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),
            setCurrentUser: (user) => set({ currentUser: user }),
            logout: () => {
                set({ currentUser: null, isAuthenticated: false });
            },
        }),
        {
            name: `${BRAND.storagePrefix}-app-storage-v2`,
            partialize: (state) => ({
                language: state.language,
                theme: state.theme,
                sidebarCollapsed: state.sidebarCollapsed,
                currentUser: state.currentUser,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);
