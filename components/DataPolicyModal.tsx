import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { Shield, Camera, Mic, Smartphone, CheckCircle2 } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const LIME = '#D4FF00';

interface DataPolicyModalProps {
    visible: boolean;
    onAccept: () => void;
    onDecline: () => void;
}

export const DataPolicyModal: React.FC<DataPolicyModalProps> = ({ visible, onAccept, onDecline }) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <Shield size={28} color="black" />
                        </View>
                        <Text style={styles.title}>Your Privacy & Data</Text>
                        <Text style={styles.subtitle}>Important information about how Vyb handles your data</Text>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <Text style={styles.sectionTitle}>Why we collect data</Text>
                        <Text style={styles.description}>
                            To provide a safe and personalized campus experience, Vyb needs to collect and process certain information.
                        </Text>

                        <View style={styles.dataItem}>
                            <Camera size={20} color="#6B7280" style={styles.dataIcon} />
                            <View style={styles.dataTextContainer}>
                                <Text style={styles.dataTitle}>Camera & Photos</Text>
                                <Text style={styles.dataDescription}>Used to allow you to upload profile pictures, share posts, and create stories.</Text>
                            </View>
                        </View>

                        <View style={styles.dataItem}>
                            <Mic size={20} color="#6B7280" style={styles.dataIcon} />
                            <View style={styles.dataTextContainer}>
                                <Text style={styles.dataTitle}>Microphone</Text>
                                <Text style={styles.dataDescription}>Used for recording audio when you create video posts or stories.</Text>
                            </View>
                        </View>

                        <View style={styles.dataItem}>
                            <Smartphone size={20} color="#6B7280" style={styles.dataIcon} />
                            <View style={styles.dataTextContainer}>
                                <Text style={styles.dataTitle}>Device Information</Text>
                                <Text style={styles.dataDescription}>We collect basic device info (model, OS) to ensure app stability and prevent fraud.</Text>
                            </View>
                        </View>

                        <View style={styles.dataItem}>
                            <CheckCircle2 size={20} color="#6B7280" style={styles.dataIcon} />
                            <View style={styles.dataTextContainer}>
                                <Text style={styles.dataTitle}>Personal Details</Text>
                                <Text style={styles.dataDescription}>Your name, age, and college info are used to build your campus identity and matches.</Text>
                            </View>
                        </View>

                        <Text style={styles.footerNote}>
                            We do not sell your personal data. You can request account deletion at any time from your profile settings, which will remove your data from our systems.
                        </Text>
                    </ScrollView>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
                            <Text style={styles.acceptButtonText}>I Understand & Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
                            <Text style={styles.declineButtonText}>Decline</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 24,
        width: '100%',
        maxWidth: 400,
        maxHeight: height * 0.8,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10
    },
    header: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: LIME,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center'
    },
    content: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 12
    },
    description: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 20,
        lineHeight: 20
    },
    dataItem: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-start'
    },
    dataIcon: {
        marginTop: 2,
        marginRight: 12
    },
    dataTextContainer: {
        flex: 1
    },
    dataTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: 'black',
        marginBottom: 2
    },
    dataDescription: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18
    },
    footerNote: {
        fontSize: 12,
        color: '#9CA3AF',
        fontStyle: 'italic',
        marginTop: 10,
        marginBottom: 20,
        textAlign: 'center'
    },
    actions: {
        padding: 24,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0'
    },
    acceptButton: {
        backgroundColor: 'black',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center'
    },
    acceptButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    },
    declineButton: {
        paddingVertical: 10,
        alignItems: 'center'
    },
    declineButtonText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '500'
    }
});
