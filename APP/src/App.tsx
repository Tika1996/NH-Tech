import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { MainLayout } from './components/layout';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth';
import { PasswordCheckWrapper } from './components/auth/PasswordCheckWrapper';
import { ToastProvider } from './components/ui';
import { Dashboard } from './features/reports/Dashboard';

import { LoginPage } from './features/auth/LoginPage';
import { VentePiecesPage } from './features/catalog/VentePiecesPage';
import { VenteLaptopsPage } from './features/laptops/VenteLaptopsPage';
import { ClientsPage } from './features/customers/ClientsPage';
import { RHPage } from './features/rh/RHPage';
import { FacturesPage } from './features/invoices/FacturesPage';
import { CommandesPage } from './features/orders/CommandesPage';
import { RepairsPage } from './features/repairs/RepairsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { SetupPage } from './features/setup/SetupPage';
import { AuditLogPage } from './features/settings/AuditLogPage';
import { useAppStore } from './store/appStore';
import { useRoleSync } from './hooks/useRoleSync';
import { useConnectivityMonitor } from './hooks/useConnectivityMonitor';
import { FIREBASE_CONFIG_STORAGE_KEY } from './lib/config';
import { applyBrandThemeVars, BRAND } from './lib/brand';

export function App() {
  const { theme, language } = useAppStore();
  useConnectivityMonitor();

  useRoleSync();

  useEffect(() => {
    document.documentElement.className = theme;
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    applyBrandThemeVars();
  }, [theme, language]);

  const hasConfig = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>

          <Route path="/login" element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          } />

          {/* Setup Initial Route */}
          <Route path="/setup" element={<SetupPage />} />

          {/* Main App with Password Security Check */}
          <Route path="/" element={
            <ProtectedRoute>
              <PasswordCheckWrapper>
                <MainLayout />
              </PasswordCheckWrapper>
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />

            <Route path="vente-pieces" element={<ProtectedRoute requiredRoles={['admin', 'manager', 'secretariat']}><VentePiecesPage /></ProtectedRoute>} />
            <Route path="vente-laptops" element={<ProtectedRoute requiredRoles={['admin', 'manager', 'secretariat']}><VenteLaptopsPage /></ProtectedRoute>} />
            <Route path="clients" element={<ProtectedRoute requiredRoles={['admin', 'manager', 'secretariat']}><ClientsPage /></ProtectedRoute>} />
            <Route path="rh" element={
              <ProtectedRoute requiredRoles={['admin', 'manager', 'secretariat']}>
                <RHPage />
              </ProtectedRoute>
            } />
            <Route path="factures" element={
              <ProtectedRoute requiredRoles={['admin', 'manager', 'secretariat', 'comptable']}>
                <FacturesPage />
              </ProtectedRoute>
            } />
            <Route path="commandes" element={
              <ProtectedRoute requiredRoles={['admin', 'manager', 'secretariat']}>
                <CommandesPage />
              </ProtectedRoute>
            } />
            <Route path="reparations" element={
              <ProtectedRoute requiredRoles={['admin', 'manager', 'secretariat', 'technicien']}>
                <RepairsPage />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="audit-log" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <AuditLogPage />
              </ProtectedRoute>
            } />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
