import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, X, Sparkles } from 'lucide-react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface DatingTimerModalProps {
    visible: boolean;
    onClose: () => void;
    targetDate: Date;
    onTimerEnd: () => void;
}

export default function DatingTimerModal({ visible, onClose, targetDate, onTimerEnd }: DatingTimerModalProps) {
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        if (!visible) return;

        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

            if (difference <= 0) {
                onTimerEnd();
                return { hours: 0, minutes: 0, seconds: 0 };
            }

            return {
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        };

        // Initial calculation
        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);

            // Also calculate total hours including days for display if needed
            // But for < 24h, hours is fine.
        }, 1000);

        return () => clearInterval(timer);
    }, [visible, targetDate]);

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View entering={SlideInUp} style={styles.content}>
                    <LinearGradient
                        colors={['#1c1c1e', '#2c2c2e']}
                        style={styles.container}
                    >
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={24} color="#6B7280" />
                        </TouchableOpacity>

                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={['#EC4899', '#8B5CF6']}
                                style={styles.iconGradient}
                            >
                                <Clock size={40} color="white" />
                            </LinearGradient>
                        </View>

                        <Text style={styles.title}>Going Blind Soon</Text>
                        <Text style={styles.subtitle}>
                            The blind dating portal opens at 4 PM. Get ready to match anonymously!
                        </Text>

                        <View style={styles.timerContainer}>
                            <View style={styles.timerBlock}>
                                <Text style={styles.timerValue}>{String(timeLeft.hours).padStart(2, '0')}</Text>
                                <Text style={styles.timerLabel}>HRS</Text>
                            </View>
                            <Text style={styles.timerSeparator}>:</Text>
                            <View style={styles.timerBlock}>
                                <Text style={styles.timerValue}>{String(timeLeft.minutes).padStart(2, '0')}</Text>
                                <Text style={styles.timerLabel}>MIN</Text>
                            </View>
                            <Text style={styles.timerSeparator}>:</Text>
                            <View style={styles.timerBlock}>
                                <Text style={styles.timerValue}>{String(timeLeft.seconds).padStart(2, '0')}</Text>
                                <Text style={styles.timerLabel}>SEC</Text>
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <Sparkles size={16} color="#EC4899" />
                            <Text style={styles.footerText}>Prepare your best opening lines!</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        overflow: 'hidden',
    },
    container: {
        padding: 24,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    iconContainer: {
        marginBottom: 20,
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    timerBlock: {
        alignItems: 'center',
        minWidth: 50,
    },
    timerValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#D4FF00', // Lime color
        fontVariant: ['tabular-nums'],
    },
    timerLabel: {
        fontSize: 10,
        color: '#6B7280',
        marginTop: 4,
        fontWeight: '600',
    },
    timerSeparator: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#6B7280',
        marginHorizontal: 8,
        marginTop: -16,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#EC4899',
        fontWeight: '500',
    }
});
