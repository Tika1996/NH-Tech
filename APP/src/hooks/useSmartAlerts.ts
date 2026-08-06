import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useAppStore } from '../store/appStore';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db as firestore } from '../lib/firebaseInit';
import { isSameDay, parseISO } from 'date-fns';

export interface SmartAlert {
    id: string;
    type: 'task' | 'leave' | 'consultation' | 'formation' | 'location';
    title: { fr: string; ar: string };
    description: { fr: string; ar: string };
    priority: 'high' | 'medium' | 'low';
    date: Date;
    link?: string;
    isRead?: boolean;
}

export function useSmartAlerts() {
    const { currentUser } = useAppStore();
    const [firebaseAlerts, setFirebaseAlerts] = useState<SmartAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [dismissedAlerts, setDismissedAlerts] = useState<string[]>(() => {
        if (!currentUser) return [];
        try {
            const stored = localStorage.getItem(`qalbi_dismissed_alerts_${currentUser.id}`);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const isOnline = navigator.onLine;

    const dismissAlert = (alertId: string) => {
        if (!currentUser) return;
        setDismissedAlerts(prev => {
            const newList = [...prev, alertId];
            localStorage.setItem(`qalbi_dismissed_alerts_${currentUser.id}`, JSON.stringify(newList));
            return newList;
        });
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ==========================================
    // OFFLINE DATA FETCHING (DEXIE)
    // ==========================================
    const localAlerts = useLiveQuery(async () => {
        if (!currentUser) return [];
        const alerts: SmartAlert[] = [];

        try {
            // 1. Tasks (Assigned to me, pending/in_progress)
            const tasks = await db.hrTasks
                .filter(t => t.assignedTo === currentUser.id && (t.status === 'pending' || t.status === 'in_progress'))
                .toArray();

            tasks.forEach(task => {
                const dueDate = new Date(task.dueDate);
                const isOverdue = dueDate < today;
                alerts.push({
                    id: task.id,
                    type: 'task',
                    title: { fr: task.title, ar: task.title },
                    description: {
                        fr: isOverdue ? 'Tâche en retard' : 'Tâche à faire bientôt',
                        ar: isOverdue ? 'مهمة متأخرة' : 'مهمة قريباً'
                    },
                    priority: isOverdue ? 'high' : 'medium',
                    date: dueDate,
                    link: '/rh?tab=tasks'
                });
            });

            // 1.b Tasks created by me (Admin/Manager) that have been completed recently (30 days)
            const thirtyDaysAgoTasks = new Date();
            thirtyDaysAgoTasks.setDate(today.getDate() - 30);

            const completedTasks = await db.hrTasks
                .filter(t => t.assignedBy === currentUser.id && t.status === 'completed')
                .toArray();

            completedTasks.forEach(task => {
                const completionDate = task.completedAt ? new Date(task.completedAt) : new Date(task.updatedAt || today);
                if (completionDate >= thirtyDaysAgoTasks) {
                    alerts.push({
                        id: `completed-${task.id}`,
                        type: 'task',
                        title: { fr: 'Tâche terminée', ar: 'مهمة منجزة' },
                        description: {
                            fr: `${task.assignedToName} a terminé: ${task.title}`,
                            ar: `${task.assignedToName} أنهى: ${task.title}`
                        },
                        priority: 'medium',
                        date: completionDate,
                        link: '/rh?tab=tasks'
                    });
                }
            });

            // 2. Leaves (For Admin/Manager: pending. For Employees: approved/rejected recently)
            if (currentUser.role === 'admin' || currentUser.role === 'manager') {
                const pendingLeaves = await db.leaves.filter(l => l.status === 'pending').toArray();
                pendingLeaves.forEach(leave => {
                    alerts.push({
                        id: leave.id,
                        type: 'leave',
                        title: { fr: 'Demande de congé', ar: 'طلب إجازة' },
                        description: { fr: 'En attente de validation', ar: 'في انتظار الموافقة' },
                        priority: 'high',
                        date: new Date(leave.startDate),
                        link: '/rh?tab=leaves'
                    });
                });
            }

            // Employee's own leaves that were processed recently (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);

            const myLeaves = await db.leaves
                .filter(l => l.staffId === currentUser.id && (l.status === 'approved' || l.status === 'rejected'))
                .toArray();

            myLeaves.forEach(leave => {
                const actionDate = leave.updatedAt ? new Date(leave.updatedAt) : new Date(leave.startDate);
                if (actionDate >= thirtyDaysAgo) {
                    alerts.push({
                        id: `processed-${leave.id}`,
                        type: 'leave',
                        title: { fr: 'Réponse Congé', ar: 'رد الإجازة' },
                        description: {
                            fr: leave.status === 'approved' ? 'Congé approuvé' : 'Congé refusé',
                            ar: leave.status === 'approved' ? 'إجازة مقبولة' : 'إجازة مرفوضة'
                        },
                        priority: 'medium',
                        date: actionDate,
                        link: '/rh?tab=leaves'
                    });
                }
            });

            // 3. Consultations (Today)
            const reservations = await db.table('reservations').filter(r => r.type === 'Consultation' && (r.status === 'confirmed' || r.status === 'pending')).toArray();
            reservations.forEach(res => {
                if (isSameDay(new Date(res.date), today)) {
                    alerts.push({
                        id: res.id,
                        type: 'consultation',
                        title: { fr: 'Consultation', ar: 'استشارة' },
                        description: { fr: res.patientName || 'Patient', ar: res.patientName || 'مريض' },
                        priority: 'medium',
                        date: new Date(res.date),
                        link: '/consultations'
                    });
                }
            });

            // 4. Formations (Today)
            const sessions = await db.table('sessions').filter(s => s.status === 'upcoming' || s.status === 'in_progress').toArray();
            sessions.forEach(session => {
                if (isSameDay(new Date(session.startDate), today)) {
                    alerts.push({
                        id: session.id,
                        type: 'formation',
                        title: { fr: 'Session de formation', ar: 'دورة تدريبية' },
                        description: { fr: 'Aujourd\'hui', ar: 'اليوم' },
                        priority: 'medium',
                        date: new Date(session.startDate),
                        link: '/formations'
                    });
                }
            });

            // 5. Locations (Today)
            const locations = await db.table('locations').filter(l => l.status === 'confirmed').toArray();
            locations.forEach(loc => {
                if (isSameDay(new Date(loc.startDate), today)) {
                    alerts.push({
                        id: loc.id,
                        type: 'location',
                        title: { fr: 'Location de salle', ar: 'إيجار قاعة' },
                        description: { fr: loc.room || '', ar: loc.room || '' },
                        priority: 'low',
                        date: new Date(loc.startDate),
                        link: '/locations'
                    });
                }
            });

            return alerts;
        } catch (error) {
            console.error('Error fetching local alerts:', error);
            return [];
        }
    }, [currentUser, today.toISOString()]);

    // ==========================================
    // ONLINE DATA FETCHING (FIRESTORE)
    // ==========================================
    useEffect(() => {
        if (!isOnline || !currentUser) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribers: (() => void)[] = [];

        // We need a stable reference to accumulated streams
        const streams: Record<string, SmartAlert[]> = {};

        const updateAlerts = (key: string, newAlerts: SmartAlert[]) => {
            streams[key] = newAlerts;
            const merged = Object.values(streams).flat();
            setFirebaseAlerts(merged);
            setLoading(false);
        };

        // 1. HR Tasks
        // Simplify query to avoid missing composite index (assignedTo + status)
        const tasksQuery = query(
            collection(firestore, 'hrTasks'),
            where('assignedTo', '==', currentUser.id)
        );

        unsubscribers.push(onSnapshot(tasksQuery, (snapshot) => {
            const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

            // Sync to Dexie for offline use
            db.hrTasks.bulkPut(docsData).catch(console.error);

            const taskAlerts = docsData
                .filter(data => data.status === 'pending' || data.status === 'in_progress')
                .map(data => {
                    const dueDate = data.dueDate ? parseISO(data.dueDate) : new Date();
                    const isOverdue = dueDate < today;
                    return {
                        id: data.id,
                        type: 'task',
                        title: { fr: data.title || 'Tâche', ar: data.title || 'مهمة' },
                        description: {
                            fr: isOverdue ? 'Tâche en retard' : 'Tâche à faire',
                            ar: isOverdue ? 'مهمة متأخرة' : 'مهمة للقيام بها'
                        },
                        priority: isOverdue ? 'high' : 'medium',
                        date: dueDate,
                        link: '/rh?tab=tasks'
                    } as SmartAlert;
                });
            updateAlerts('tasks', taskAlerts);
        }, (error) => {
            console.error('[SmartAlerts] Error fetching hrTasks:', error);
            // Fallback or ignore
            updateAlerts('tasks', []);
        }));

        // 1.b HR Tasks (Assigned BY me, completed recently)
        const myCreatedTasksQuery = query(
            collection(firestore, 'hrTasks'),
            where('assignedBy', '==', currentUser.id)
        );

        unsubscribers.push(onSnapshot(myCreatedTasksQuery, (snapshot) => {
            const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);

            const completedAlerts = docsData
                .filter(data => data.status === 'completed')
                .filter(data => {
                    const compDate = data.completedAt ? new Date(data.completedAt) : new Date(data.updatedAt?.seconds * 1000 || Date.now());
                    return compDate >= thirtyDaysAgo;
                })
                .map(data => {
                    const compDate = data.completedAt ? new Date(data.completedAt) : new Date(data.updatedAt?.seconds * 1000 || Date.now());
                    return {
                        id: `completed-${data.id}`,
                        type: 'task',
                        title: { fr: 'Tâche terminée', ar: 'مهمة منجزة' },
                        description: {
                            fr: `${data.assignedToName || 'Employé'} a terminé: ${data.title}`,
                            ar: `${data.assignedToName || 'Employé'} أنهى: ${data.title}`
                        },
                        priority: 'medium',
                        date: compDate,
                        link: '/rh?tab=tasks'
                    } as SmartAlert;
                });
            updateAlerts('tasksCompleted', completedAlerts);
        }));

        // 2. Leaves
        if (currentUser.role === 'admin' || currentUser.role === 'manager') {
            const leavesQuery = query(
                collection(firestore, 'leaves'),
                where('status', '==', 'pending')
            );
            unsubscribers.push(onSnapshot(leavesQuery, (snapshot) => {
                const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

                // Sync to Dexie for offline use
                db.leaves.bulkPut(docsData).catch(console.error);

                const leaveAlerts = docsData.map(data => {
                    return {
                        id: data.id,
                        type: 'leave',
                        title: { fr: 'Demande de congé', ar: 'طلب إجازة' },
                        description: { fr: 'En attente de validation', ar: 'في انتظار الموافقة' },
                        priority: 'high',
                        date: data.startDate ? parseISO(data.startDate) : new Date(),
                        link: '/rh?tab=leaves'
                    } as SmartAlert;
                });
                updateAlerts('leaves', leaveAlerts);
            }));
        } else {
            // For non-managers, ensure we don't wait for 'leaves' to resolve
            updateAlerts('leaves', []);
        }

        // 2.b Leaves (For Employee: processed recently)
        const myLeavesQuery = query(
            collection(firestore, 'leaves'),
            where('staffId', '==', currentUser.id)
        );

        unsubscribers.push(onSnapshot(myLeavesQuery, (snapshot) => {
            const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

            // Sync own leaves slightly just in case
            db.leaves.bulkPut(docsData).catch(console.error);

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);

            const processedLeavesAlerts = docsData
                .filter(data => data.status === 'approved' || data.status === 'rejected')
                .filter(data => {
                    const actionDate = data.updatedAt?.seconds ? new Date(data.updatedAt.seconds * 1000) : (data.startDate ? parseISO(data.startDate) : new Date());
                    return actionDate >= thirtyDaysAgo;
                })
                .map(data => {
                    const actionDate = data.updatedAt?.seconds ? new Date(data.updatedAt.seconds * 1000) : (data.startDate ? parseISO(data.startDate) : new Date());
                    return {
                        id: `processed-${data.id}`,
                        type: 'leave',
                        title: { fr: 'Réponse Congé', ar: 'رد الإجازة' },
                        description: {
                            fr: data.status === 'approved' ? 'Congé approuvé' : 'Congé refusé',
                            ar: data.status === 'approved' ? 'إجازة مقبولة' : 'إجازة مرفوضة'
                        },
                        priority: 'medium',
                        date: actionDate,
                        link: '/rh?tab=leaves'
                    } as SmartAlert;
                });
            updateAlerts('leavesProcessed', processedLeavesAlerts);
        }));

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [isOnline, currentUser, today.toISOString()]);

    const activeAlerts = useMemo(() => {
        // Remove duplicates by ID (prefering Firebase over local if same ID exists)
        const uniqueAlertsMap = new Map<string, SmartAlert>();

        // Add local first
        (localAlerts || []).forEach(alert => {
            uniqueAlertsMap.set(alert.id, alert);
        });

        // Then add/overwrite with Firebase (fresher data for tasks/leaves)
        firebaseAlerts.forEach(alert => {
            uniqueAlertsMap.set(alert.id, alert);
        });

        // Mark as read if dismissed
        const allAlerts = Array.from(uniqueAlertsMap.values()).map(a => ({
            ...a,
            isRead: dismissedAlerts.includes(a.id)
        }));

        // Sort: unread first, then by priority (high > medium > low), then by date
        return allAlerts.sort((a: SmartAlert, b: SmartAlert) => {
            if (a.isRead && !b.isRead) return 1;
            if (!a.isRead && b.isRead) return -1;

            const priorityWeight: Record<SmartAlert['priority'], number> = { high: 3, medium: 2, low: 1 };
            if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
                return priorityWeight[b.priority] - priorityWeight[a.priority];
            }
            return new Date(b.date).getTime() - new Date(a.date).getTime(); // Note: sorted by newest date first
        });
    }, [firebaseAlerts, localAlerts, dismissedAlerts]);

    const unreadCount = activeAlerts.filter(a => !a.isRead).length;

    return {
        alerts: activeAlerts,
        alertCount: unreadCount,
        loading: loading && localAlerts === undefined,
        dismissAlert
    };
}
