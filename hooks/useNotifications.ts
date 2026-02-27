import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { authAPI } from '../services/api';

const isExpoGo = Constants.appOwnership === 'expo';
const isAndroid = Platform.OS === 'android';

// Configure notification handler with error handling for Expo Go
// SDK 53+ removed remote notification support from Expo Go on Android
if (Platform.OS !== 'web' && !(isExpoGo && isAndroid)) {
    try {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
    } catch (e) {
        console.warn('[Notifications] Failed to set notification handler:', e);
    }
}

export const useNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
    const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
    const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
    const router = useRouter();

    useEffect(() => {
        if (Platform.OS === 'web') return;

        registerForPushNotificationsAsync().then(token => {
            setExpoPushToken(token);
        }).catch(e => {
            // Silent fail - expected in Expo Go SDK 53+
        });

        try {
            notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
                setNotification(notification);
            });

            responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
                const data = response.notification.request.content.data;
                handleNotificationNavigation(data);
            });
        } catch (e) {
            // Silent fail
        }

        return () => {
            try {
                if (notificationListener.current) {
                    notificationListener.current.remove();
                }
                if (responseListener.current) {
                    responseListener.current.remove();
                }
            } catch (e) {
                // Silent cleanup
            }
        };
    }, []);

    const handleNotificationNavigation = (data: any) => {
        if (!data || !data.type) return;

        switch (data.type) {
            case 'like':
            case 'match':
            case 'blind':
                router.push('/(tabs)/dating');
                break;

            case 'chat':
                if (data.chatUserId) {
                    router.push({
                        pathname: '/chat/[id]',
                        params: { id: data.chatUserId }
                    } as any);
                } else {
                    router.push('/(tabs)/dating');
                }
                break;

            case 'promo':
                break;

            default:
                break;
        }
    };

    return { expoPushToken, notification };
};

export async function registerForPushNotificationsAsync() {
    // SDK 53+ removed remote notification support from Expo Go on Android
    if (isExpoGo && isAndroid) {
        return undefined;
    }

    let token;

    if (Platform.OS === 'android') {
        try {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        } catch (e) {
            // May fail in Expo Go
        }
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            throw new Error('Permission not granted');
        }

        try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId ||
                Constants.easConfig?.projectId ||
                '26f32825-e835-4da0-9347-e0b67cf71cb0';

            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            return token;
        } catch (e: any) {
            throw new Error(`Token Error: ${e.message}`);
        }
    } else {
        throw new Error('Not a physical device');
    }
}
