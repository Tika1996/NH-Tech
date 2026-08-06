import { useEffect, useRef, useState } from 'react';
import { setAppConnectivityOnline } from '../lib/firebase';
import { isFirebaseConfigured } from '../lib/config';

type ConnectivityState = {
    isOnline: boolean;
    lastCheckedAt: number | null;
};

const pingInternet = async (): Promise<boolean> => {
    if (!navigator.onLine) return false;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3500);

    try {
        await fetch('https://www.gstatic.com/generate_204', {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-store',
            signal: controller.signal,
        });
        return true;
    } catch {
        // If navigator says online, trust online status even if ping fails/times out
        return navigator.onLine;
    } finally {
        window.clearTimeout(timeout);
    }
};

export function useConnectivityMonitor(): ConnectivityState {
    const [state, setState] = useState<ConnectivityState>({
        isOnline: navigator.onLine,
        lastCheckedAt: null,
    });

    const inFlightRef = useRef(false);
    const lastOnlineRef = useRef<boolean>(navigator.onLine);

    useEffect(() => {
        let mounted = true;

        const apply = async (online: boolean, checkedAt: number) => {
            if (!mounted) return;

            setState({ isOnline: online, lastCheckedAt: checkedAt });
            setAppConnectivityOnline(online);

            isFirebaseConfigured();

            lastOnlineRef.current = online;
        };

        const checkNow = async () => {
            if (inFlightRef.current) return;
            inFlightRef.current = true;

            const checkedAt = Date.now();
            const online = await pingInternet();

            try {
                await apply(online, checkedAt);
            } finally {
                inFlightRef.current = false;
            }
        };

        const handleOnline = () => {
            checkNow();
        };

        const handleOffline = () => {
            apply(false, Date.now());
        };

        const handleVisibilityOrFocus = () => {
            checkNow();
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('focus', handleVisibilityOrFocus);
        document.addEventListener('visibilitychange', handleVisibilityOrFocus);

        checkNow();

        const intervalId = window.setInterval(() => {
            const shouldCheck = navigator.onLine || lastOnlineRef.current;
            if (shouldCheck) {
                checkNow();
            }
        }, 15000);

        return () => {
            mounted = false;
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('focus', handleVisibilityOrFocus);
            document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
            window.clearInterval(intervalId);
        };
    }, []);

    return state;
}
