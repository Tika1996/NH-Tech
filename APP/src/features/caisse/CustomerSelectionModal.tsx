import { useMemo, useState, useEffect } from 'react';
import { Search, User, X, Check, Loader2, Plus, Phone } from 'lucide-react';
import { customersCollection } from '../../lib/firebase';

interface CustomerSelectionModalProps {
    language: 'fr' | 'ar';
    selectedCustomer: { id: string; name: string } | null;
    onSelect: (customer: { id: string; name: string } | null) => void;
    onClose: () => void;
}

export function CustomerSelectionModal({ language, selectedCustomer, onSelect, onClose }: CustomerSelectionModalProps) {
    const [customers, setCustomers] = useState<Array<{ id: string; name: string; phone?: string }>>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Create new customer state
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newWilaya, setNewWilaya] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const t = language === 'ar' ? {
        title: 'اختر العميل',
        search: 'بحث...',
        select: 'اختيار',
        cancel: 'إلغاء',
        noResults: 'لا يوجد عملاء',
        createNew: 'إضافة عميل جديد',
        name: 'الاسم الكامل',
        phone: 'رقم الهاتف',
        wilaya: 'الولاية',
        add: 'إضافة'
    } : (language as string) === 'en' ? {
        title: 'Select a Customer',
        search: 'Search...',
        select: 'Select',
        cancel: 'Cancel',
        noResults: 'No customers found',
        createNew: 'New Customer',
        name: 'Full Name',
        phone: 'Phone Number',
        wilaya: 'State / Region',
        add: 'Add'
    } : {
        title: 'Sélectionner un client',
        search: 'Rechercher...',
        select: 'Sélectionner',
        cancel: 'Annuler',
        noResults: 'Aucun client trouvé',
        createNew: 'Nouveau client',
        name: 'Nom complet',
        phone: 'Téléphone',
        wilaya: 'Wilaya',
        add: 'Ajouter'
    };

    useEffect(() => {
        const fetchCustomers = async () => {
            setLoading(true);
            try {
                const data = await customersCollection.getAll() as Array<{ id: string; name: string; phone?: string }>;
                setCustomers(data);
            } catch (error) {
                console.error('Error fetching customers:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);
    const normalizedQueryDigits = useMemo(() => normalizedQuery.replace(/\D/g, ''), [normalizedQuery]);

    const filteredCustomers = useMemo(() => {
        let result = customers;
        if (normalizedQuery) {
            result = customers.filter((c) => {
                const name = (c.name ?? '').toLowerCase();
                const phone = (c.phone ?? '');
                const phoneDigits = phone.replace(/\D/g, '');
                return (
                    name.includes(normalizedQuery) ||
                    phone.includes(normalizedQuery) ||
                    (normalizedQueryDigits.length >= 3 && phoneDigits.includes(normalizedQueryDigits))
                );
            });
        }
        
        // Deduplicate by phone number to avoid showing the same person multiple times
        const seenPhones = new Set<string>();
        return result.filter(c => {
            if (!c.phone) return true; // Keep those without a phone just in case
            const normalizedPhone = c.phone.replace(/\D/g, '');
            if (seenPhones.has(normalizedPhone)) {
                return false;
            }
            seenPhones.add(normalizedPhone);
            return true;
        });
    }, [customers, normalizedQuery, normalizedQueryDigits]);

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !newPhone.trim()) return;

        setIsSubmitting(true);
        try {
            const newCustomer = {
                name: newName.trim(),
                phone: newPhone.trim(),
                wilaya: newWilaya.trim(),
                email: '',
                role: 'patient',
                type: 'individual',
                createdAt: new Date(),
                source: 'modal_creation'
            };

            const docId = await customersCollection.create(newCustomer as any);
            const createdCustomer = { id: docId, name: newCustomer.name, phone: newCustomer.phone, wilaya: newCustomer.wilaya };

            // Add to local state so standard selectedCustomer logic works seamlessly
            setCustomers(prev => [...prev, createdCustomer]);
            onSelect(createdCustomer);
        } catch (error) {
            console.error('Error creating customer:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="customer-modal-overlay" onClick={onClose}>
            <div className="customer-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t.title}>
                <div className="modal-header">
                    <h3>{t.title}</h3>
                    <button className="btn-icon" onClick={onClose} type="button" aria-label={t.cancel}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {isCreating ? (
                        <form onSubmit={handleCreateCustomer} className="create-customer-form">
                            <div className="form-group">
                                <label>{t.name} <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    className="input"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required
                                    autoFocus
                                    placeholder={language === 'fr' ? 'Ex: Mohamed Ali' : 'مثال: محمد علي'}
                                />
                            </div>
                            <div className="form-group">
                                <label>{t.phone} <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    className="input"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    required
                                    type="tel"
                                    placeholder="05..."
                                />
                            </div>
                            <div className="form-group">
                                <label>{t.wilaya}</label>
                                <input
                                    className="input"
                                    value={newWilaya}
                                    onChange={(e) => setNewWilaya(e.target.value)}
                                    placeholder={language === 'fr' ? 'Wilaya (Optionnel)' : 'الولاية (اختياري)'}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsCreating(false)}>
                                    {t.cancel}
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting || !newName.trim() || !newPhone.trim()}>
                                    {isSubmitting ? <Loader2 size={18} className="loading-spinner" /> : <Check size={18} />} {t.add}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <div className="search-box">
                                <Search size={18} />
                                <input
                                    type="text"
                                    className="input"
                                    placeholder={t.search}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="customers-list">
                                {/* Real customers */}
                                {loading ? (
                                    <div className="loading-container">
                                        <Loader2 size={24} className="loading-spinner" />
                                    </div>
                                ) : filteredCustomers.length === 0 ? (
                                    <div className="empty-state">
                                        <div style={{ marginBottom: '16px', color: 'var(--text-tertiary)' }}>{t.noResults}</div>
                                        <button className="btn btn-secondary" onClick={() => {
                                            setNewName(searchQuery); // Pre-fill with what they searched
                                            setIsCreating(true);
                                        }}>
                                            <Plus size={18} /> {t.createNew}
                                        </button>
                                    </div>
                                ) : (
                                    filteredCustomers.map((customer: { id: string; name: string; phone?: string }) => (
                                        <button
                                            key={customer.id}
                                            className={`customer-item ${selectedCustomer?.id === customer.id ? 'selected' : ''}`}
                                            onClick={() => onSelect(customer)}
                                            type="button"
                                        >
                                            <User size={20} />
                                            <div className="customer-item-info">
                                                <span className="customer-item-name">{customer.name}</span>
                                                {customer.phone && <span className="customer-item-phone">{customer.phone}</span>}
                                            </div>
                                            {selectedCustomer?.id === customer.id && <Check size={18} />}
                                        </button>
                                    ))
                                )}
                            </div>

                            {!loading && filteredCustomers.length > 0 && (
                                <button
                                    className="btn btn-ghost"
                                    style={{ width: '100%', marginTop: '8px', borderStyle: 'dashed', borderWidth: '1px', borderColor: 'var(--border-secondary)' }}
                                    onClick={() => {
                                        setNewName(searchQuery);
                                        setIsCreating(true);
                                    }}
                                >
                                    <Plus size={18} /> {t.createNew}
                                </button>
                            )}
                        </>
                    )}
                </div>

                {!isCreating && (
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose} type="button">
                            {t.cancel}
                        </button>
                    </div>
                )}

                <style>{`
                    .customer-modal-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: var(--space-4);
                        z-index: var(--z-modal-backdrop);
                    }

                    .customer-modal {
                        width: 100%;
                        max-width: 560px;
                        max-height: 90vh;
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                        background: var(--bg-elevated);
                        border-radius: var(--radius-2xl);
                        box-shadow: var(--shadow-xl);
                        border: 1px solid var(--border-secondary);
                    }

                    .modal-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: var(--space-4) var(--space-5);
                        border-bottom: 1px solid var(--border-secondary);
                        gap: var(--space-3);
                    }

                    .modal-header h3 {
                        margin: 0;
                        font-size: var(--text-lg);
                        min-width: 0;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .btn-icon {
                        width: 36px;
                        height: 36px;
                        border-radius: var(--radius-lg);
                        border: none;
                        background: transparent;
                        color: var(--text-secondary);
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        flex-shrink: 0;
                    }

                    .btn-icon:hover {
                        background: var(--bg-tertiary);
                        color: var(--text-primary);
                    }

                    .modal-body {
                        padding: var(--space-4) var(--space-5);
                        display: flex;
                        flex-direction: column;
                        gap: var(--space-3);
                        overflow: hidden;
                    }

                    .search-box {
                        display: flex;
                        align-items: center;
                        gap: var(--space-2);
                    }

                    .search-box svg {
                        color: var(--text-tertiary);
                        flex-shrink: 0;
                    }

                    .customers-list {
                        display: flex;
                        flex-direction: column;
                        gap: var(--space-2);
                        overflow: auto;
                        padding-right: 2px;
                    }

                    [dir="rtl"] .customers-list {
                        padding-right: 0;
                        padding-left: 2px;
                    }

                    .customer-item {
                        display: flex;
                        align-items: center;
                        gap: var(--space-3);
                        padding: var(--space-3) var(--space-4);
                        border-radius: var(--radius-xl);
                        border: 1px solid var(--border-secondary);
                        background: var(--bg-elevated);
                        color: var(--text-primary);
                        cursor: pointer;
                        text-align: left;
                        width: 100%;
                    }

                    [dir="rtl"] .customer-item {
                        text-align: right;
                    }

                    .customer-item:hover {
                        background: var(--bg-tertiary);
                        border-color: var(--border-primary);
                    }

                    .customer-item.selected {
                        border-color: var(--color-brand);
                        box-shadow: 0 0 0 3px rgba(30, 74, 110, 0.15);
                    }

                    .dark .customer-item.selected {
                        box-shadow: 0 0 0 3px rgba(74, 144, 194, 0.2);
                    }

                    .customer-item-info {
                        display: flex;
                        flex-direction: column;
                        min-width: 0;
                        flex: 1;
                    }

                    .customer-item-name {
                        font-weight: var(--font-medium);
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .customer-item-phone {
                        font-size: var(--text-sm);
                        color: var(--text-secondary);
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .loading-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        padding: var(--space-6);
                    }

                    .loading-spinner {
                        animation: spin 1s linear infinite;
                    }

                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }

                    .empty-state {
                        text-align: center;
                        padding: var(--space-6);
                        color: var(--text-secondary);
                    }

                    .modal-footer {
                        padding: var(--space-4) var(--space-5);
                        border-top: 1px solid var(--border-secondary);
                        display: flex;
                        justify-content: flex-end;
                    }

                    [dir="rtl"] .modal-footer {
                        justify-content: flex-start;
                    }

                    @media (max-width: 480px) {
                        .customer-modal-overlay {
                            padding: var(--space-3);
                        }

                        .modal-header,
                        .modal-body,
                        .modal-footer {
                            padding-left: var(--space-4);
                            padding-right: var(--space-4);
                        }
                    }
                `}</style>
            </div>
        </div >
    );
}
