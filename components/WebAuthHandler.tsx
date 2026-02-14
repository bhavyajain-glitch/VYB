// components/WebAuthHandler.tsx
// This component runs at the root level and captures OAuth tokens from URL on web
// Solves the issue where Google redirects to the root URL but the token parser was only on /auth

import { useEffect, useState } from 'react';
import { Platform, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../app/services/api';

export default function WebAuthHandler({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isProcessingAuth, setIsProcessingAuth] = useState(false);

    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const handleWebRedirect = async () => {
            // Check URL hash (implicit flow) and query params
            const hash = window.location.hash;
            const search = window.location.search;
            let idToken: string | null = null;

            // Try to extract id_token from hash fragment (e.g., #id_token=xxx&...)
            if (hash) {
                const hashParams = new URLSearchParams(hash.substring(1));
                idToken = hashParams.get('id_token');
            }

            // Try query params (authorization code flow fallback)
            if (!idToken && search) {
                const queryParams = new URLSearchParams(search);
                idToken = queryParams.get('id_token');
            }

            if (idToken) {
                console.log('[WebAuthHandler] Found id_token in URL, processing login...');
                setIsProcessingAuth(true);

                // Clear the URL to prevent re-processing
                window.history.replaceState({}, document.title, window.location.pathname);

                try {
                    const resp = await authAPI.googleLogin(idToken);

                    if (!resp.data || !resp.data.token) {
                        throw new Error('Server returned success but no token!');
                    }

                    const { token, isNewUser, user } = resp.data;
                    console.log('[WebAuthHandler] Login successful, saving session...');

                    // Save token and user info
                    await AsyncStorage.setItem('userToken', token);
                    await AsyncStorage.setItem('userInfo', JSON.stringify(user));

                    console.log('[WebAuthHandler] Navigating to:', isNewUser ? 'Profile Setup' : 'Tabs');

                    // Use setTimeout to ensure state updates complete before navigation
                    setTimeout(() => {
                        if (isNewUser) {
                            router.replace('/profile-setup');
                        } else {
                            router.replace('/(tabs)');
                        }
                    }, 100);
                } catch (error: any) {
                    console.error('[WebAuthHandler] Login error:', error);
                    setIsProcessingAuth(false);
                    // Navigate to auth page with error state
                    router.replace('/auth');
                }
            }
        };

        handleWebRedirect();
    }, []);

    // Show loading screen while processing OAuth
    if (isProcessingAuth) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D4FF00" />
                <Text style={styles.loadingText}>Signing you in...</Text>
            </View>
        );
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
    },
});
