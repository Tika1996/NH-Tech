import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { staffCollection } from '../lib/firebase';

/**
 * Hook to sync user role from Firestore in real-time
 * When admin changes a staff member's role, it updates immediately
 */
export function useRoleSync() {
    const { currentUser, setCurrentUser, isAuthenticated } = useAppStore();
    // Use a ref so the snapshot callback always sees the latest user
    // without re-triggering the effect (which caused an infinite loop).
    const currentUserRef = useRef(currentUser);
    currentUserRef.current = currentUser;

    useEffect(() => {
        if (!isAuthenticated || !currentUser?.id) {
            return;
        }

        console.log('[ROLE_SYNC] Setting up listener for staff ID:', currentUser.id);

        // Subscribe to staff document changes
        const unsubscribe = staffCollection.onSnapshot(currentUser.id, (staffDoc: any) => {
            if (!staffDoc) {
                console.log('[ROLE_SYNC] Staff document not found');
                return;
            }

            const cur = currentUserRef.current;
            // Check if role has changed
            if (staffDoc.role && cur && staffDoc.role !== cur.role) {
                console.log('[ROLE_SYNC] Role changed from', cur.role, 'to', staffDoc.role);

                // Update current user with new role
                setCurrentUser({
                    ...cur,
                    role: staffDoc.role,
                    name: staffDoc.name || cur.name,
                    isActive: staffDoc.isActive ?? cur.isActive,
                    updatedAt: new Date(),
                });
            }
        });

        return () => {
            console.log('[ROLE_SYNC] Cleaning up listener');
            unsubscribe();
        };
        // Only re-subscribe when the user ID changes or auth state changes.
        // Do NOT include currentUser.role — that caused an infinite loop.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.id, isAuthenticated, setCurrentUser]);
}
