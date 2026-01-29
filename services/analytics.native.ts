import analytics from '@react-native-firebase/analytics';

export const logEvent = async (eventName: string, params: object = {}) => {
    try {
        await analytics().logEvent(eventName, params);
    } catch (error) {
        console.error('[Analytics] Error logging event:', error);
    }
};

export const logScreenView = async (screenName: string) => {
    try {
        await analytics().logScreenView({
            screen_name: screenName,
            screen_class: screenName,
        });
    } catch (error) {
        console.error('[Analytics] Error logging screen view:', error);
    }
};

export const setUserId = async (userId: string) => {
    try {
        await analytics().setUserId(userId);
    } catch (error) {
        console.error('[Analytics] Error setting User ID:', error);
    }
};

export const logTimeSpent = async (screenName: string, seconds: number) => {
    try {
        await analytics().logEvent('time_spent', {
            screen_name: screenName,
            seconds: seconds,
        });
    } catch (error) {
        console.error('[Analytics] Error logging time spent:', error);
    }
};

export default {
    logEvent,
    logScreenView,
    setUserId,
    logTimeSpent,
};
