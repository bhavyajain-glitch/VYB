import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, ActivityIndicator, Platform, PanResponder, Animated } from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { X, Check, Play, Pause, Scissors } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMELINE_MARGIN = 20;
const TIMELINE_WIDTH = SCREEN_WIDTH - (TIMELINE_MARGIN * 2);

interface VideoTrimmerProps {
    visible: boolean;
    onClose: () => void;
    uri: string;
    duration: number; // in seconds
    onSave: (startTime: number, endTime: number) => void;
    initialStartTime?: number;
    initialEndTime?: number;
}

export default function VideoTrimmer({
    visible,
    onClose,
    uri,
    duration,
    onSave,
    initialStartTime = 0,
    initialEndTime
}: VideoTrimmerProps) {
    const [startTime, setStartTime] = useState(initialStartTime);
    const [endTime, setEndTime] = useState(initialEndTime || Math.min(duration, 60)); // Default to 60s or duration
    const [isPlaying, setIsPlaying] = useState(false);
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const videoRef = useRef<Video>(null);

    const startValue = useRef(new Animated.Value((initialStartTime / duration) * TIMELINE_WIDTH)).current;
    const endValue = useRef(new Animated.Value(((initialEndTime || Math.min(duration, 60)) / duration) * TIMELINE_WIDTH)).current;

    useEffect(() => {
        if (visible && uri) {
            generateThumbnails();
            setStartTime(initialStartTime);
            setEndTime(initialEndTime || Math.min(duration, 60));
            startValue.setValue((initialStartTime / duration) * TIMELINE_WIDTH);
            endValue.setValue(((initialEndTime || Math.min(duration, 60)) / duration) * TIMELINE_WIDTH);
        }
    }, [visible, uri]);

    const generateThumbnails = async () => {
        try {
            const frames = 8;
            const newThumbnails = [];
            for (let i = 0; i < frames; i++) {
                const time = (duration / frames) * i * 1000;
                const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(uri, { time });
                newThumbnails.push(thumbUri);
            }
            setThumbnails(newThumbnails);
        } catch (e) {
            console.warn('Thumbnail generic failed', e);
        }
    };

    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;
        setCurrentTime(status.positionMillis / 1000);

        // Loop playback within trimmed range
        if (status.positionMillis / 1000 >= endTime) {
            videoRef.current?.setPositionAsync(startTime * 1000);
        }
    };

    const panResponderStart = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                let newX = gestureState.moveX - TIMELINE_MARGIN;
                if (newX < 0) newX = 0;
                if (newX > (endValue as any)._value - 20) newX = (endValue as any)._value - 20;

                startValue.setValue(newX);
                const newStartTime = (newX / TIMELINE_WIDTH) * duration;
                setStartTime(newStartTime);
                videoRef.current?.setPositionAsync(newStartTime * 1000);
            },
        })
    ).current;

    const panResponderEnd = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                let newX = gestureState.moveX - TIMELINE_MARGIN;
                if (newX > TIMELINE_WIDTH) newX = TIMELINE_WIDTH;
                if (newX < (startValue as any)._value + 20) newX = (startValue as any)._value + 20;

                endValue.setValue(newX);
                const newEndTime = (newX / TIMELINE_WIDTH) * duration;
                setEndTime(newEndTime);
                videoRef.current?.setPositionAsync(newEndTime * 1000);
            },
        })
    ).current;

    const handleSave = () => {
        onSave(startTime, endTime);
        onClose();
    };

    const togglePlayback = () => {
        if (isPlaying) {
            videoRef.current?.pauseAsync();
        } else {
            videoRef.current?.playAsync();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={styles.container}>
                <LinearGradient colors={['#111', '#000']} style={styles.background} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
                        <X size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Trim Video</Text>
                    <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
                        <Check size={24} color="#D4FF00" />
                    </TouchableOpacity>
                </View>

                {/* Video Preview */}
                <View style={styles.previewContainer}>
                    <Video
                        ref={videoRef}
                        source={{ uri }}
                        style={styles.video}
                        resizeMode="contain"
                        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                        shouldPlay={isPlaying}
                        isMuted={false}
                    />
                    <TouchableOpacity style={styles.playOverlay} onPress={togglePlayback}>
                        {!isPlaying && <Play size={48} color="white" fill="white" />}
                    </TouchableOpacity>
                </View>

                {/* Timeline Controls */}
                <View style={styles.controls}>
                    <View style={styles.timeInfo}>
                        <Text style={styles.timeLabel}>Start: {startTime.toFixed(1)}s</Text>
                        <Text style={[styles.timeLabel, { color: '#D4FF00' }]}>
                            Duration: {(endTime - startTime).toFixed(1)}s
                        </Text>
                        <Text style={styles.timeLabel}>End: {endTime.toFixed(1)}s</Text>
                    </View>

                    <View style={styles.timelineWrapper}>
                        {/* Thumbnail Strip */}
                        <View style={styles.thumbnailStrip}>
                            {thumbnails.map((thumb, i) => (
                                <View key={i} style={styles.thumbnailContainer}>
                                    <View style={styles.thumbnailPlaceholder} />
                                    <Animated.Image source={{ uri: thumb }} style={styles.thumbnail} />
                                </View>
                            ))}
                        </View>

                        {/* Selection Overlay */}
                        <View style={styles.selectionOverlay}>
                            <Animated.View
                                style={[
                                    styles.selectionBox,
                                    {
                                        left: startValue,
                                        width: Animated.subtract(endValue, startValue)
                                    }
                                ]}
                            />
                        </View>

                        {/* Handles */}
                        <Animated.View
                            {...panResponderStart.panHandlers}
                            style={[styles.handle, styles.handleLeft, { left: startValue }]}
                        >
                            <View style={styles.handleBar} />
                        </Animated.View>

                        <Animated.View
                            {...panResponderEnd.panHandlers}
                            style={[styles.handle, styles.handleRight, { left: endValue }]}
                        >
                            <View style={styles.handleBar} />
                        </Animated.View>
                    </View>

                    <View style={styles.hintBox}>
                        <Scissors size={14} color="#888" />
                        <Text style={styles.hintText}>Drag handles to trim video</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    headerBtn: {
        padding: 8,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    previewContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controls: {
        paddingBottom: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: TIMELINE_MARGIN,
        backgroundColor: '#111',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 30,
    },
    timeInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    timeLabel: {
        color: '#888',
        fontSize: 12,
        fontWeight: '600',
    },
    timelineWrapper: {
        height: 60,
        width: TIMELINE_WIDTH,
        position: 'relative',
        justifyContent: 'center',
    },
    thumbnailStrip: {
        flexDirection: 'row',
        height: 50,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#222',
    },
    thumbnailContainer: {
        flex: 1,
        height: '100%',
    },
    thumbnailPlaceholder: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#333',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    selectionOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
    selectionBox: {
        height: 50,
        borderTopWidth: 2,
        borderBottomWidth: 2,
        borderColor: '#D4FF00',
        backgroundColor: 'rgba(212, 255, 0, 0.1)',
        top: 0,
    },
    handle: {
        position: 'absolute',
        width: 20,
        height: 60,
        backgroundColor: '#D4FF00',
        borderRadius: 4,
        top: -5,
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 8,
    },
    handleLeft: {
        marginLeft: -10,
    },
    handleRight: {
        marginLeft: -10,
    },
    handleBar: {
        width: 2,
        height: 20,
        backgroundColor: 'black',
        borderRadius: 1,
    },
    hintBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 20,
    },
    hintText: {
        color: '#666',
        fontSize: 12,
    },
});
