import { useState, useEffect } from 'react';
import { ChangePasswordModal } from '../../features/auth/ChangePasswordModal';
import { auth, staffCollection } from '../../lib/firebase';
import { useAppStore } from '../../store/appStore';

interface PasswordCheckWrapperProps {
    children: React.ReactNode;
}

/**
 * Wrapper component that checks if user needs to change password on first login
 */
export function PasswordCheckWrapper({ children }: PasswordCheckWrapperProps) {
    const { currentUser, isAuthenticated } = useAppStore();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [staffDocId, setStaffDocId] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkPasswordRequirement = async () => {
            if (!isAuthenticated || !currentUser) {
                setIsChecking(false);
                return;
            }

            try {
                // Get the Firebase Auth user
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    setIsChecking(false);
                    return;
                }

                // Find staff document by auth UID
                const staffDoc = await staffCollection.getByAuthUid(currentUser.uid);

                if (staffDoc && staffDoc.mustChangePassword) {
                    setStaffDocId(staffDoc.id);
                    setShowPasswordModal(true);
                }
            } catch (error) {
                console.error('Error checking password requirement:', error);
            } finally {
                setIsChecking(false);
            }
        };

        checkPasswordRequirement();
    }, [isAuthenticated, currentUser]);

    const handlePasswordChangeComplete = () => {
        setShowPasswordModal(false);
        setStaffDocId(null);
    };

    // Show loading while checking
    if (isChecking) {
        return (
            <div className="password-check-loading">
                <div className="spinner" />
                <style>{`
          .password-check-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: var(--bg-primary);
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border-primary);
            border-top-color: var(--color-brand);
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

    return (
        <>
            {children}
            <ChangePasswordModal
                isOpen={showPasswordModal}
                onComplete={handlePasswordChangeComplete}
                isFirstLogin={true}
                staffDocId={staffDocId || undefined}
            />
        </>
    );
}
