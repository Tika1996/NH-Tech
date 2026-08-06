import React, { useState, useEffect } from 'react';
import { FIREBASE_CONFIG_STORAGE_KEY, isFirebaseConfigured, loadFirebaseConfig, parseFirebaseConfigFromText, saveFirebaseConfigToStorage } from '../../lib/config';
import { Cloud, Check, AlertTriangle, Save, Trash2, Globe, Database, Key } from 'lucide-react';

export const DataSync: React.FC = () => {
    const [isConfigured] = useState(isFirebaseConfigured());
    const [formData, setFormData] = useState({
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
        measurementId: ''
    });

    useEffect(() => {
        if (isConfigured) {
            const current = loadFirebaseConfig();
            setFormData({
                apiKey: current.apiKey || '',
                authDomain: current.authDomain || '',
                projectId: current.projectId || '',
                storageBucket: current.storageBucket || '',
                messagingSenderId: current.messagingSenderId || '',
                appId: current.appId || '',
                measurementId: current.measurementId || ''
            });
        }
    }, [isConfigured]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.apiKey || !formData.projectId) {
            alert('L\'API Key et le Project ID sont obligatoires.');
            return;
        }

        saveFirebaseConfigToStorage({
            apiKey: formData.apiKey,
            authDomain: formData.authDomain,
            projectId: formData.projectId,
            storageBucket: formData.storageBucket,
            messagingSenderId: formData.messagingSenderId,
            appId: formData.appId,
            measurementId: formData.measurementId || undefined,
        });
        window.location.reload();
    };

    const handleDisconnect = () => {
        if (confirm('Voulez-vous vraiment déconnecter le Cloud ? L\'application repassera en mode Local.')) {
            localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
            window.location.reload();
        }
    };

    return (
        <>

            <div className={`data-sync-status ${isConfigured ? 'ok' : 'warn'}`}>
                <div className="data-sync-status-icon">
                    {isConfigured ? <Check size={18} /> : <AlertTriangle size={18} />}
                </div>
                <div className="data-sync-status-text">
                    <div className="data-sync-status-title">
                        {isConfigured ? 'Connecté et Synchronisé' : 'Mode Hors-Ligne (Local)'}
                    </div>
                    <div className="data-sync-status-subtitle">
                        {isConfigured
                            ? 'Vos données sont sauvegardées automatiquement dans le cloud.'
                            : 'Vos données sont stockées uniquement sur cet appareil. Connectez-vous pour activer la sauvegarde.'}
                    </div>
                </div>
            </div>

            <div className="data-sync-grid">
                <div className="data-sync-span-2">
                    <label className="input-label">Importer configuration</label>
                    <div className="file-drop-zone">
                        <div className="drop-content">
                            <div className="drop-icon">
                                <Cloud size={24} />
                            </div>
                            <div className="drop-text">
                                <strong>Cliquez ou glissez le fichier .txt</strong>
                                <span>Configuration téléchargée depuis Firebase</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            accept=".txt,text/plain"
                            className="file-input-hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const text = await file.text();
                                const parsed = parseFirebaseConfigFromText(text);
                                setFormData(prev => ({
                                    ...prev,
                                    apiKey: parsed.apiKey ?? prev.apiKey,
                                    authDomain: parsed.authDomain ?? prev.authDomain,
                                    projectId: parsed.projectId ?? prev.projectId,
                                    storageBucket: parsed.storageBucket ?? prev.storageBucket,
                                    messagingSenderId: parsed.messagingSenderId ?? prev.messagingSenderId,
                                    appId: parsed.appId ?? prev.appId,
                                    measurementId: (parsed.measurementId as string) ?? prev.measurementId,
                                }));
                            }}
                        />
                    </div>
                </div>

                <div className="divider data-sync-span-2">
                    <span>Ou manuellement</span>
                </div>

                <div className="input-group data-sync-span-2">
                    <label className="input-label data-sync-label">
                        <Key size={14} />
                        API Key *
                    </label>
                    <input
                        type="text"
                        className="input data-sync-mono"
                        value={formData.apiKey}
                        onChange={e => handleChange('apiKey', e.target.value)}
                        placeholder="AIzaSy..."
                    />
                </div>

                <div className="input-group">
                    <label className="input-label data-sync-label">
                        <Database size={14} />
                        Project ID *
                    </label>
                    <input
                        type="text"
                        className="input data-sync-mono"
                        value={formData.projectId}
                        onChange={e => handleChange('projectId', e.target.value)}
                        placeholder="qalbi-itmaan-..."
                    />
                </div>

                <div className="input-group">
                    <label className="input-label data-sync-label">
                        <Globe size={14} />
                        Auth Domain
                    </label>
                    <input
                        type="text"
                        className="input data-sync-mono"
                        value={formData.authDomain}
                        onChange={e => handleChange('authDomain', e.target.value)}
                        placeholder="project.firebaseapp.com"
                    />
                </div>

                <div className="input-group">
                    <label className="input-label">Storage Bucket</label>
                    <input
                        type="text"
                        className="input data-sync-mono"
                        value={formData.storageBucket}
                        onChange={e => handleChange('storageBucket', e.target.value)}
                        placeholder="project.appspot.com"
                    />
                </div>

                <div className="input-group">
                    <label className="input-label">Messaging Sender ID</label>
                    <input
                        type="text"
                        className="input data-sync-mono"
                        value={formData.messagingSenderId}
                        onChange={e => handleChange('messagingSenderId', e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label className="input-label">App ID</label>
                    <input
                        type="text"
                        className="input data-sync-mono"
                        value={formData.appId}
                        onChange={e => handleChange('appId', e.target.value)}
                    />
                </div>
            </div>

            <div className="data-sync-actions">
                <button onClick={handleSave} className="btn btn-primary actions-btn">
                    <Save size={18} />
                    {isConfigured ? 'Mettre à jour' : 'Connecter au Cloud'}
                </button>

                {isConfigured && (
                    <button onClick={handleDisconnect} className="btn btn-secondary actions-btn" style={{ color: 'var(--color-error-600)' }}>
                        <Trash2 size={18} />
                        Déconnecter
                    </button>
                )}
            </div>

            <style>{`
              .data-sync-status {
                display: flex;
                gap: var(--space-3);
                align-items: flex-start;
                padding: var(--space-4);
                border-radius: var(--radius-xl);
                border: 1px solid var(--border-secondary);
                background: var(--bg-tertiary);
              }

              .data-sync-status.ok {
                border-color: rgba(74, 124, 89, 0.35);
                background: rgba(74, 124, 89, 0.08);
              }

              .data-sync-status.warn {
                border-color: rgba(193, 127, 89, 0.35);
                background: rgba(193, 127, 89, 0.08);
              }

              .data-sync-status-icon {
                width: 36px;
                height: 36px;
                border-radius: var(--radius-lg);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                background: var(--bg-elevated);
                border: 1px solid var(--border-secondary);
              }

              .data-sync-status.ok .data-sync-status-icon {
                color: var(--color-success-600);
                border-color: rgba(74, 124, 89, 0.35);
              }

              .data-sync-status.warn .data-sync-status-icon {
                color: var(--color-warning-600);
                border-color: rgba(193, 127, 89, 0.35);
              }

              .data-sync-status-title {
                font-weight: var(--font-semibold);
                color: var(--text-primary);
              }

              .data-sync-status-subtitle {
                margin-top: 2px;
                font-size: var(--text-sm);
                color: var(--text-secondary);
              }

              .data-sync-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--space-4);
                margin-top: var(--space-4);
              }

              .data-sync-span-2 {
                grid-column: span 2;
              }

              .file-drop-zone {
                  position: relative;
                  border: 2px dashed var(--border-primary);
                  border-radius: 12px;
                  padding: 1.5rem;
                  text-align: center;
                  transition: all 0.2s;
                  background: var(--bg-tertiary);
                  cursor: pointer;
              }

              .file-drop-zone:hover {
                  border-color: var(--color-brand);
                  background: var(--bg-secondary);
              }

              .drop-content {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 0.5rem;
                  pointer-events: none;
              }

              .drop-icon {
                  color: var(--color-brand);
                  opacity: 0.7;
              }

              .drop-text {
                  display: flex;
                  flex-direction: column;
                  gap: 0.2rem;
              }

              .drop-text strong { color: var(--text-primary); font-size: 0.9rem; }
              .drop-text span { color: var(--text-secondary); font-size: 0.8rem; }

              .file-input-hidden {
                  position: absolute;
                  inset: 0;
                  opacity: 0;
                  cursor: pointer;
              }
              
              .divider {
                  display: flex;
                  align-items: center;
                  text-align: center;
                  color: var(--text-tertiary);
                  font-size: 0.85rem;
                  margin: 0.5rem 0;
              }

              .divider::before, .divider::after {
                  content: '';
                  flex: 1;
                  border-bottom: 1px solid var(--border-primary);
              }

              .divider span { padding: 0 1rem; }

              .data-sync-label {
                display: flex;
                align-items: center;
                gap: var(--space-2);
              }

              .data-sync-mono {
                font-family: var(--font-mono);
              }

              .data-sync-actions {
                display: flex;
                gap: var(--space-3);
                margin-top: var(--space-4);
                padding-top: var(--space-4);
                border-top: 1px solid var(--border-secondary);
              }

              .actions-btn {
                  flex: 1;
                  justify-content: center;
                  padding: 10px;
              }

              @media (max-width: 768px) {
                .data-sync-grid {
                  grid-template-columns: 1fr;
                }

                .data-sync-span-2 {
                  grid-column: span 1;
                }

                .data-sync-actions {
                  flex-direction: column;
                }
              }
            `}</style>
        </>
    );
};
