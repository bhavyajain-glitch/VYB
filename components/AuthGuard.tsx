import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import { registerForPushNotificationsAsync } from '../hooks/useNotifications';
import { Platform } from 'react-native';
import analytics from '../services/analytics';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const segments = useSegments();
    const [isLoading, setIsLoading] = useState(true);
    const hasRegisteredPush = useRef(false);

    useEffect(() => {
        checkAuth();
    }, [segments]);

    const handlePushRegistration = async () => {
        if (Platform.OS === 'web' || hasRegisteredPush.current) return;

        try {
            console.log('[AuthGuard] Starting push registration');
            const token = await registerForPushNotificationsAsync();

            // Get user info to check if we should show debug alerts
            const userInfoStr = await AsyncStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            const isTargetTester = userInfo?.email === 'priyanshu.singh01@adypu.edu.in';

            if (token) {
                console.log('[AuthGuard] Token acquired:', token);
                await authAPI.registerPushToken(token);
                console.log('[AuthGuard] Push token registered with backend');
                hasRegisteredPush.current = true;

                if (isTargetTester) {
                    Alert.alert('Push Debug', 'Token registered successfully');
                }
            } else {
                console.log('[AuthGuard] No push token generated');
                if (isTargetTester) {
                    Alert.alert('Push Debug', 'No token generated. Check device/network.');
                }
            }
        } catch (error: any) {
            console.error('[AuthGuard] Push registration failed:', error);
            const userInfoStr = await AsyncStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (userInfo?.email === 'priyanshu.singh01@adypu.edu.in') {
                Alert.alert('Push Debug', `${error.message}`);
            }
        }
    };

    const checkAuth = async () => {
        try {
            // Get user session
            let token = await AsyncStorage.getItem('userToken');
            let userInfoStr = await AsyncStorage.getItem('userInfo');

            // Web Fallback (if AsyncStorage fails)
            if (!token && typeof window !== 'undefined' && window.localStorage) {
                token = localStorage.getItem('userToken');
                userInfoStr = localStorage.getItem('userInfo');
            }

            const inAuthGroup = segments[0] === 'auth' || segments[0] === 'onboarding';
            const inProfileSetup = segments[0] === 'profile-setup';

            if (!token) {
                // No token = user is not logged in
                // If not already in auth/onboarding, redirect to onboarding
                if (!inAuthGroup) {
                    console.log('[AuthGuard] Not authorized, redirecting to onboarding (segments:', segments, ')');
                    router.replace('/onboarding');
                    return; // Prevent rendering children
                }
            } else {
                // User is logged in
                console.log('[AuthGuard] Token found, checking profile. (segments:', segments, ')');

                // Trigger push registration after a short delay to ensure session is stable
                handlePushRegistration();

                let isNewUser = false;
                if (userInfoStr) {
                    try {
                        const userInfo = JSON.parse(userInfoStr);
                        isNewUser = userInfo.isNewUser || (!userInfo.username && !userInfo.fullName);

                        // Set analytics identity
                        if (userInfo.id) {
                            analytics.setUserId(userInfo.id);
                        }
                    } catch (err) {
                        isNewUser = true;
                    }
                }

                if (isNewUser) {
                    if (!inProfileSetup && segments[0] !== 'auth') {
                        console.log('[AuthGuard] Incomplete profile, redirecting to setup');
                        router.replace('/profile-setup');
                        return; // Prevent rendering children
                    }
                } else {
                    if (inAuthGroup || inProfileSetup) {
                        console.log('[AuthGuard] Redirecting from auth to tabs');
                        router.replace('/(tabs)');
                        return; // Prevent rendering children
                    }
                }
            }
        } catch (e) {
            console.error('[AuthGuard] Check failed:', e);
        } finally {
            setIsLoading(false);
            console.log('[AuthGuard] Loading finished, isLoading:', false);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="large" color="#D4FF00" />
            </View>
        );
    }

    return <>{children}</>;
}
