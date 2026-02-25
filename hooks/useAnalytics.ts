import { useEffect, useRef } from 'react';
import analytics from '../services/analytics';

export const useAnalytics = (screenName: string) => {
    const startTime = useRef<number>(Date.now());

    useEffect(() => {
        // Log screen view on mount
        analytics.logScreenView(screenName);
        startTime.current = Date.now();

        return () => {
            // Log time spent on unmount
            const endTime = Date.now();
            const timeSpentSeconds = Math.round((endTime - startTime.current) / 1000);

            if (timeSpentSeconds > 0) {
                analytics.logTimeSpent(screenName, timeSpentSeconds);
            }
        };
    }, [screenName]);

    const logFeatureUse = (featureName: string, details: object = {}) => {
        analytics.logEvent(`${screenName}_${featureName}`, details);
    };

    return { logFeatureUse };
};
