export const logEvent = async (eventName: string, params: object = {}) => {
    console.log(`[Analytics-Web] Event: ${eventName}`, params);
};

export const logScreenView = async (screenName: string) => {
    console.log(`[Analytics-Web] ScreenView: ${screenName}`);
};

export const setUserId = async (userId: string) => {
    console.log(`[Analytics-Web] UserID: ${userId}`);
};

export const logTimeSpent = async (screenName: string, seconds: number) => {
    console.log(`[Analytics-Web] TimeSpent on ${screenName}: ${seconds}s`);
};

export default {
    logEvent,
    logScreenView,
    setUserId,
    logTimeSpent,
};
