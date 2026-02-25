import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { authAPI } from '../services/api';

// Configure notification handler
if (Platform.OS !== 'web') {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
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
        });

        // This listener is fired whenever a notification is received while the app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        // This listener is fired whenever a user taps on or interacts with a notification 
        // (works when app is foregrounded, backgrounded, or killed)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            handleNotificationNavigation(data);
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);

    const handleNotificationNavigation = (data: any) => {
        console.log('Notification data:', data);

        if (!data || !data.type) return;

        switch (data.type) {
            case 'like':
                // Navigate to Likes tab
                router.push('/(tabs)/dating');
                break;

            case 'match':
                // Navigate to Chat tab or specific chat
                if (data.matchId) {
                    // Ideally open specific chat, but for now go to dating tab -> chat
                    router.push('/(tabs)/dating');
                } else {
                    router.push('/(tabs)/dating');
                }
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

            case 'blind':
                if (data.sessionId) {
                    // Handle navigation to blind date session
                    // Assuming there's a way to rejoin or it's handled in the dating tab
                    router.push('/(tabs)/dating');
                }
                break;

            case 'promo':
                // Maybe open a specific promo page or just app home
                // router.push('/promo'); 
                break;

            default:
                console.log('Unknown notification type:', data.type);
        }
    };

    return { expoPushToken, notification };
};

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
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

        // Get the token
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
