import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../components/ui';
import { hrTasksCollection, staffCollection } from '../../lib/firebase';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Check,
    X,
    AlertCircle,
    Clock,
    Loader2,
    Flag,
    User,
    Calendar,
} from 'lucide-react';

// --- Types ---
export interface HRTask {
    id: string;
    title: string;
    description?: string;
    assignedTo: string;
    assignedToName: string;
    assignedBy: string;
    assignedByName: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    dueDate?: string;
    completedAt?: string;
    createdAt: any;
}

interface Staff {
    id: string;
    name: string;
    isActive: boolean;
}

interface Props {
    language: 'fr' | 'ar' | 'en';
    currentUser: any;
}

const translations = {
    fr: {
        addTask: 'Nouvelle tâche',
        search: 'Rechercher...',
        noTasks: 'Aucune tâche',
        title: 'Titre',
        description: 'Description',
        assignTo: 'Assigner à',
        priority: 'Priorité',
        dueDate: 'Date limite',
        status: 'État',
        actions: 'Actions',
        save: 'Enregistrer',
        cancel: 'Annuler',
        delete: 'Supprimer',
        confirmDelete: 'Supprimer cette tâche ?',
        priorities: {
            low: 'Basse',
            medium: 'Moyenne',
            high: 'Haute',
        },
        statuses: {
            pending: 'À faire',
            in_progress: 'En cours',
            completed: 'Terminée',
            cancelled: 'Annulée',
        },
        filterAll: 'Tous',
        filterPending: 'À faire',
        filterInProgress: 'En cours',
        filterCompleted: 'Terminées',
        markComplete: 'Terminer',
        markInProgress: 'Démarrer',
    },
    en: {
        addTask: 'New Task',
        search: 'Search tasks...',
        noTasks: 'No tasks',
        title: 'Title',
        description: 'Description',
        assignTo: 'Assign to',
        priority: 'Priority',
        dueDate: 'Due Date',
        status: 'Status',
        actions: 'Actions',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        confirmDelete: 'Delete this task?',
        priorities: {
            low: 'Low',
            medium: 'Medium',
            high: 'High',
        },
        statuses: {
            pending: 'To Do',
            in_progress: 'In Progress',
            completed: 'Completed',
            cancelled: 'Cancelled',
        },
        filterAll: 'All',
        filterPending: 'To Do',
        filterInProgress: 'In Progress',
        filterCompleted: 'Completed',
        markComplete: 'Complete',
        markInProgress: 'Start',
    },
    ar: {
        addTask: 'مهمة جديدة',
        search: 'بحث...',
        noTasks: 'لا توجد مهام',
        title: 'العنوان',
        description: 'الوصف',
        assignTo: 'إسناد إلى',
        priority: 'الأولوية',
        dueDate: 'تاريخ الاستحقاق',
        status: 'الحالة',
        actions: 'الإجراءات',
        save: 'حفظ',
        cancel: 'إلغاء',
        delete: 'حذف',
        confirmDelete: 'حذف هذه المهمة؟',
        priorities: {
            low: 'منخفضة',
            medium: 'متوسطة',
            high: 'عالية',
        },
        statuses: {
            pending: 'للإنجاز',
            in_progress: 'قيد التنفيذ',
            completed: 'مكتملة',
            cancelled: 'ملغاة',
        },
        filterAll: 'الكل',
        filterPending: 'للإنجاز',
        filterInProgress: 'قيد التنفيذ',
        filterCompleted: 'مكتملة',
        markComplete: 'إكمال',
        markInProgress: 'بدء',
    },
};

export function TasksTab({ language, currentUser }: Props) {
    const t = translations[language] || translations.fr;
    const { showToast } = useToast();

    const [tasks, setTasks] = useState<HRTask[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | HRTask['status']>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<HRTask | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'medium' as HRTask['priority'],
        dueDate: '',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [tasksData, staffData] = await Promise.all([
                hrTasksCollection.getAll(),
                staffCollection.getAll(),
            ]);
            setTasks(tasksData as HRTask[]);
            setStaffList((staffData as Staff[]).filter(s => s.isActive));
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.assignedToName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

        // Role-based filtering: Admins and Managers see all tasks.
        // Others only see tasks assigned to them or created by them.
        const isManagerOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';
        const isRelatedToUser = task.assignedTo === currentUser?.id || task.assignedBy === currentUser?.id;
        const matchesRole = isManagerOrAdmin || isRelatedToUser;

        return matchesSearch && matchesStatus && matchesRole;
    });

    const openModal = (task?: HRTask) => {
        if (task) {
            setEditingTask(task);
            setFormData({
                title: task.title,
                description: task.description || '',
                assignedTo: task.assignedTo,
                priority: task.priority,
                dueDate: task.dueDate || '',
            });
        } else {
            setEditingTask(null);
            setFormData({
                title: '',
                description: '',
                assignedTo: staffList[0]?.id || '',
                priority: 'medium',
                dueDate: '',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const assignedStaff = staffList.find(s => s.id === formData.assignedTo);
        const taskData = {
            title: formData.title,
            description: formData.description,
            assignedTo: formData.assignedTo,
            assignedToName: assignedStaff?.name || '',
            assignedBy: currentUser?.id || '',
            assignedByName: currentUser?.name || currentUser?.email || '',
            priority: formData.priority,
            dueDate: formData.dueDate || null,
            status: editingTask?.status || 'pending',
        };

        try {
            if (editingTask) {
                await hrTasksCollection.update(editingTask.id, taskData);
            } else {
                await hrTasksCollection.create({ ...taskData, createdAt: new Date() });
            }
            await fetchData();
            closeModal();
            showToast(language === 'fr' ? 'Tâche enregistrée' : 'تم حفظ المهمة', 'success');
        } catch (error) {
            console.error('Error saving task:', error);
            showToast(language === 'fr' ? 'Erreur' : 'خطأ', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (taskId: string, newStatus: HRTask['status']) => {
        try {
            const updates: any = { status: newStatus };
            if (newStatus === 'completed') {
                updates.completedAt = new Date().toISOString();
            }
            await hrTasksCollection.update(taskId, updates);
            await fetchData();
            showToast(language === 'fr' ? 'Statut mis à jour' : 'تم تحديث الحالة', 'success');
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm(t.confirmDelete)) {
            try {
                await hrTasksCollection.delete(id);
                await fetchData();
                showToast(language === 'fr' ? 'Tâche supprimée' : 'تم حذف المهمة', 'success');
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    };

    const getPriorityColor = (priority: HRTask['priority']) => {
        switch (priority) {
            case 'high': return 'var(--color-red-500)';
            case 'medium': return 'var(--color-amber-500)';
            case 'low': return 'var(--color-green-500)';
        }
    };

    const getStatusColor = (status: HRTask['status']) => {
        switch (status) {
            case 'pending': return 'var(--color-gray-500)';
            case 'in_progress': return 'var(--color-blue-500)';
            case 'completed': return 'var(--color-green-500)';
            case 'cancelled': return 'var(--color-red-400)';
        }
    };

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="spin" size={32} />
            </div>
        );
    }

    return (
        <div className="tasks-tab">
            {/* Toolbar */}
            <div className="tasks-toolbar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder={t.search}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input"
                    />
                </div>
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('all')}
                    >
                        {t.filterAll}
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('pending')}
                    >
                        {t.filterPending}
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'in_progress' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('in_progress')}
                    >
                        {t.filterInProgress}
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('completed')}
                    >
                        {t.filterCompleted}
                    </button>
                </div>
                {currentUser?.role === 'admin' && (
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        {t.addTask}
                    </button>
                )}
            </div>

            {/* Tasks List */}
            {filteredTasks.length === 0 ? (
                <div className="empty-state">
                    <AlertCircle size={48} />
                    <p>{t.noTasks}</p>
                </div>
            ) : (
                <div className="tasks-list">
                    {filteredTasks.map((task) => (
                        <div key={task.id} className={`task-card ${task.status}`}>
                            <div className="task-header">
                                <div className="task-priority" style={{ background: getPriorityColor(task.priority) }}>
                                    <Flag size={12} />
                                </div>
                                <h4 className="task-title">{task.title}</h4>
                                <span className="task-status" style={{ background: getStatusColor(task.status) }}>
                                    {t.statuses[task.status]}
                                </span>
                            </div>
                            {task.description && (
                                <p className="task-description">{task.description}</p>
                            )}
                            <div className="task-meta">
                                <span className="meta-item">
                                    <User size={14} />
                                    {task.assignedToName}
                                </span>
                                {task.dueDate && (
                                    <span className="meta-item">
                                        <Calendar size={14} />
                                        {new Date(task.dueDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'ar-DZ')}
                                    </span>
                                )}
                            </div>
                            <div className="task-actions">
                                {task.status === 'pending' && (
                                    <button
                                        className="btn btn-sm btn-outline"
                                        onClick={() => handleStatusChange(task.id, 'in_progress')}
                                    >
                                        <Clock size={14} />
                                        {t.markInProgress}
                                    </button>
                                )}
                                {task.status === 'in_progress' && (
                                    <button
                                        className="btn btn-sm btn-success"
                                        onClick={() => handleStatusChange(task.id, 'completed')}
                                    >
                                        <Check size={14} />
                                        {t.markComplete}
                                    </button>
                                )}
                                {currentUser?.role === 'admin' && (
                                    <>
                                        <button className="icon-btn" onClick={() => openModal(task)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="icon-btn danger" onClick={() => handleDelete(task.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-backdrop open" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingTask ? t.title : t.addTask}</h3>
                            <button className="icon-btn" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label className="input-label">{t.title} *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t.description}</label>
                                    <textarea
                                        className="input textarea"
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label className="input-label">{t.assignTo}</label>
                                        <select
                                            className="input"
                                            value={formData.assignedTo}
                                            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                        >
                                            {staffList.map((staff) => (
                                                <option key={staff.id} value={staff.id}>{staff.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t.priority}</label>
                                        <select
                                            className="input"
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value as HRTask['priority'] })}
                                        >
                                            <option value="low">{t.priorities.low}</option>
                                            <option value="medium">{t.priorities.medium}</option>
                                            <option value="high">{t.priorities.high}</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t.dueDate}</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    {t.cancel}
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                                    {t.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .tasks-tab {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-4);
                }

                .tasks-toolbar {
                    display: flex;
                    gap: var(--space-3);
                    align-items: center;
                    flex-wrap: wrap;
                }

                .search-box {
                    display: flex;
                    align-items: center;
                    gap: var(--space-2);
                    background: var(--bg-secondary);
                    padding: var(--space-2) var(--space-3);
                    border-radius: var(--radius-lg);
                    flex: 1;
                    min-width: 200px;
                }

                .search-box input {
                    border: none;
                    background: transparent;
                    flex: 1;
                }

                .filter-buttons {
                    display: flex;
                    gap: var(--space-1);
                }

                .filter-btn {
                    padding: var(--space-2) var(--space-3);
                    border: 1px solid var(--border-primary);
                    background: var(--bg-primary);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    font-size: var(--text-sm);
                    transition: all 0.2s;
                }

                .filter-btn:hover {
                    border-color: var(--color-brand);
                }

                .filter-btn.active {
                    background: var(--color-brand);
                    border-color: var(--color-brand);
                    color: white;
                }

                .tasks-list {
                    display: grid;
                    gap: var(--space-3);
                }

                .task-card {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-primary);
                    border-radius: var(--radius-lg);
                    padding: var(--space-4);
                    transition: all 0.2s;
                }

                .task-card:hover {
                    border-color: var(--color-brand);
                    box-shadow: var(--shadow-sm);
                }

                .task-card.completed {
                    opacity: 0.7;
                }

                .task-header {
                    display: flex;
                    align-items: center;
                    gap: var(--space-3);
                    margin-bottom: var(--space-2);
                }

                .task-priority {
                    width: 24px;
                    height: 24px;
                    border-radius: var(--radius-full);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .task-title {
                    flex: 1;
                    margin: 0;
                    font-size: var(--text-base);
                }

                .task-status {
                    padding: 2px 8px;
                    border-radius: var(--radius-full);
                    font-size: var(--text-xs);
                    color: white;
                }

                .task-description {
                    color: var(--text-secondary);
                    font-size: var(--text-sm);
                    margin: var(--space-2) 0;
                }

                .task-meta {
                    display: flex;
                    gap: var(--space-4);
                    margin: var(--space-3) 0;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: var(--space-1);
                    font-size: var(--text-sm);
                    color: var(--text-secondary);
                }

                .task-actions {
                    display: flex;
                    gap: var(--space-2);
                    justify-content: flex-end;
                    padding-top: var(--space-3);
                    border-top: 1px solid var(--border-secondary);
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: var(--space-8);
                    color: var(--text-tertiary);
                    gap: var(--space-3);
                }

                .loading-state {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: var(--space-8);
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .textarea {
                    resize: vertical;
                    min-height: 80px;
                }

                .btn-success {
                    background: var(--color-green-500);
                    color: white;
                }

                .btn-success:hover {
                    background: var(--color-green-600);
                }
            `}</style>
        </div>
    );
}
