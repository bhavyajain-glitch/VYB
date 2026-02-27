import analytics from '@react-native-firebase/analytics';

// Check if Firebase is available (will be false in Expo Go)
const getAnalyticsInstance = () => {
    try {
        // In Expo Go, @react-native-firebase/app will exist as an npm package
        // but it will fail when calling any module because the native part is missing.
        const instance = analytics();
        if (instance && typeof instance.logEvent === 'function') {
            return instance;
        }
        return null;
    } catch (error: any) {
        // This is a known issue in Expo Go - analytics requires a development build
        if (__DEV__) {
            // Only log once to avoid cluttering consoles
            // console.warn('[Analytics] Native Firebase not available in Expo Go. Analytics disabled.');
        }
        return null;
    }
};

export const logEvent = async (eventName: string, params: object = {}) => {
    const instance = getAnalyticsInstance();
    if (!instance) return;
    try {
        await instance.logEvent(eventName, params);
    } catch {
        // Silent fail - analytics not critical
    }
};

export const logScreenView = async (screenName: string) => {
    const instance = getAnalyticsInstance();
    if (!instance) return;
    try {
        await instance.logScreenView({
            screen_name: screenName,
            screen_class: screenName,
        });
    } catch {
        // Silent fail
    }
};

export const setUserId = async (userId: string) => {
    const instance = getAnalyticsInstance();
    if (!instance) return;
    try {
        await instance.setUserId(userId);
    } catch {
        // Silent fail
    }
};

export const logTimeSpent = async (screenName: string, seconds: number) => {
    const instance = getAnalyticsInstance();
    if (!instance) return;
    try {
        await instance.logEvent('time_spent', {
            screen_name: screenName,
            seconds: seconds,
        });
    } catch {
        // Silent fail
    }
};

export default {
    logEvent,
    logScreenView,
    setUserId,
    logTimeSpent,
};
