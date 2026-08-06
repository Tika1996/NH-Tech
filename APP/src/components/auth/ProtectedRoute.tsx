import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { useEffect, useState } from 'react';
import { onAuthChange, staffCollection, signOut } from '../../lib/firebase';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRoles?: string[];
}

/**
 * ProtectedRoute component that wraps routes requiring authentication.
 * Redirects to /login if user is not authenticated.
 * Optionally checks for required roles.
 */
export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
    const { isAuthenticated, currentUser, setAuthenticated, setCurrentUser } = useAppStore();
    // If already authenticated in store, don't block navigation with loading spinner
    const [isLoading, setIsLoading] = useState(() => !useAppStore.getState().isAuthenticated);
    const location = useLocation();

    useEffect(() => {
        // Check Firebase auth state on mount
        const unsubscribe = onAuthChange(async (user) => {
            if (user) {
                try {
                    let staffDoc = await staffCollection.getByAuthUidOrEmail(user.uid, user.email || undefined);

                    if (!staffDoc) {
                        try {
                            const newId = await staffCollection.create({
                                name: user.displayName || (user.email ? user.email.split('@')[0] : 'Admin'),
                                email: user.email || '',
                                role: 'admin',
                                authUid: user.uid,
                                isActive: true,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            });
                            staffDoc = {
                                id: newId,
                                name: user.displayName || (user.email ? user.email.split('@')[0] : 'Admin'),
                                email: user.email || '',
                                role: 'admin',
                                authUid: user.uid,
                                isActive: true
                            } as any;
                        } catch (e) {
                            staffDoc = {
                                id: `staff_${user.uid}`,
                                name: user.displayName || (user.email ? user.email.split('@')[0] : 'Admin'),
                                email: user.email || '',
                                role: 'admin',
                                isActive: true
                            } as any;
                        }
                    }

                    const activeStaff = staffDoc as any;
                    if (activeStaff && (activeStaff.isActive === false || activeStaff.isDeleted === true)) {
                        try {
                            await signOut();
                        } catch {}
                        setAuthenticated(false);
                        setCurrentUser(null);
                        setIsLoading(false);
                        return;
                    }

                    if (activeStaff && activeStaff.authUid !== user.uid) {
                        try {
                            await staffCollection.update(activeStaff.id, { authUid: user.uid, email: user.email || activeStaff.email });
                        } catch {}
                    }

                    setAuthenticated(true);
                    const userRole = activeStaff?.role || 'admin';

                    setCurrentUser({
                        id: activeStaff?.id || user.uid,
                        email: user.email || '',
                        name: activeStaff?.name || user.displayName || user.email?.split('@')[0] || 'User',
                        role: userRole,
                        language: 'fr',
                        isActive: activeStaff?.isActive ?? true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                } catch (err) {
                    console.warn('[PROTECTED_ROUTE] Error processing Firebase user:', err);
                }
            } else {
                // Local-First / Offline mode:
                // We trust the persisted Zustand store state.
                // Do NOT logout the local user if Firebase returns null.
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [setAuthenticated, setCurrentUser]);

    // Show loading while checking auth state on cold start
    if (isLoading) {
        return (
            <div className="auth-loading">
                <div className="loading-spinner" />
                <style>{`
          .auth-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: var(--bg-primary, #070a12);
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: #0055ff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated || !currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access if required
    if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(currentUser.role)) {
            // User doesn't have required role - redirect to dashboard
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
}

/**
 * PublicOnlyRoute - for routes that should only be accessible when NOT logged in
 * (e.g., login page)
 */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAppStore();
    const location = useLocation();

    if (isAuthenticated) {
        // Redirect to the page they came from, or dashboard
        const from = (location.state as { from?: Location })?.from?.pathname || '/';
        return <Navigate to={from} replace />;
    }

    return <>{children}</>;
}

