import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const segments = useSegments();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, [segments]);

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
                    router.replace('/onboarding');
                }
            } else {
                // User is logged in
                let isNewUser = false;
                if (userInfoStr) {
                    const userInfo = JSON.parse(userInfoStr);
                    // Check if backend marked user as new
                    // OR if key profile fields are missing (fallback check)
                    isNewUser = userInfo.isNewUser || (!userInfo.username && !userInfo.fullName);
                }

                if (isNewUser) {
                    // User needs to setup profile
                    // If trying to go anywhere ELSE, redirect to profile-setup
                    if (!inProfileSetup && segments[0] !== 'auth') {
                        console.log('[AuthGuard] Incomplete profile, redirecting to setup');
                        router.replace('/profile-setup');
                    }
                } else {
                    // User is fully setup
                    // If they try to go to onboarding/auth/profile-setup, redirect to home
                    if (inAuthGroup || inProfileSetup) {
                        router.replace('/(tabs)');
                    }
                }
            }
        } catch (e) {
            console.error('[AuthGuard] Check failed:', e);
        } finally {
            setIsLoading(false);
        }
    };

    // Optional: Show loading screen while checking
    // if (isLoading) {
    //   return (
    //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    //       <ActivityIndicator size="large" color="#D4FF00" />
    //     </View>
    //   );
    // }

    return <>{children}</>;
}
