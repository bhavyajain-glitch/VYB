import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VideoPlayerProps {
    uri: string;
    thumbnail?: string;
    autoPlay?: boolean;
    showControls?: boolean;
    style?: object;
    onFullScreen?: () => void;
    trimStart?: number; // seconds
    trimEnd?: number;   // seconds
}

export default function VideoPlayer({
    uri,
    thumbnail,
    autoPlay = false,
    showControls = true,
    style,
    onFullScreen,
    trimStart = 0,
    trimEnd,
}: VideoPlayerProps) {
    const player = useVideoPlayer(uri, player => {
        player.loop = false;
        if (autoPlay) {
            player.play();
        }
    });

    const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
    const { muted: isMuted } = useEvent(player, 'volumeChange', { muted: player.muted });
    const { currentTime } = useEvent(player, 'timeUpdate', { currentTime: player.currentTime });
    // duration might not be available immediately, we can use player.duration
    const duration = player.duration;

    // console.log('Video Player State:', { isPlaying, isMuted, currentTime, duration, uri });

    const [showControlsOverlay, setShowControlsOverlay] = useState(true);
    const controlsTimeout = useRef<any>(null);

    // Trimming logic handling
    useEffect(() => {
        if (!player) return;

        const effectiveEnd = (trimEnd && trimEnd < duration) ? trimEnd : duration;
        const effectiveStart = trimStart;

        if (currentTime >= effectiveEnd) {
            if (player.loop) {
                player.currentTime = effectiveStart;
            } else {
                player.pause();
                // Reset to start if it ends
                // player.currentTime = effectiveStart; // This might conflict with pause, let's just pause.
            }
        }

        // Ensure start time
        if (currentTime < effectiveStart && isPlaying) {
            player.currentTime = effectiveStart;
        }

    }, [currentTime, duration, trimEnd, trimStart, isPlaying, player]);

    // Apply trim start on load/change
    useEffect(() => {
        if (player && trimStart > 0 && Math.abs(player.currentTime - trimStart) > 1) {
            // Only set if significantly different to execute once effectively
            // But simpler: just initialize? useVideoPlayer doesn't support start time in setup easily yet?
            // We can just rely on the above check.
        }
    }, [player, trimStart]);


    useEffect(() => {
        if (showControlsOverlay && isPlaying) {
            controlsTimeout.current = setTimeout(() => {
                setShowControlsOverlay(false);
            }, 3000);
        }

        return () => {
            if (controlsTimeout.current) {
                clearTimeout(controlsTimeout.current);
            }
        };
    }, [showControlsOverlay, isPlaying]);

    const handlePlayPause = () => {
        if (isPlaying) {
            player.pause();
        } else {
            player.play();
        }
    };

    const handleMute = () => {
        player.muted = !isMuted;
    };

    const handleVideoPress = () => {
        setShowControlsOverlay(!showControlsOverlay);
        if (!showControlsOverlay) {
            if (controlsTimeout.current) {
                clearTimeout(controlsTimeout.current);
            }
        }
    };

    const handleFullScreen = () => {
        if (onFullScreen) {
            onFullScreen();
        } else {
            // Default fullscreen behavior of expo-video
            player.presentFullscreen();
        }
    };

    const formatTime = (seconds: number) => {
        const totalSeconds = Math.floor(seconds);
        const minutes = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate progress based on trim
    const effectiveTrimEnd = (trimEnd && trimEnd < duration) ? trimEnd : duration;
    const effectiveTrimStart = trimStart;
    const displayDuration = Math.max(0, effectiveTrimEnd - effectiveTrimStart);
    const displayPosition = Math.max(0, currentTime - effectiveTrimStart);

    const progressPercent = displayDuration > 0 ? (displayPosition / displayDuration) * 100 : 0;


    return (
        <View style={[styles.container, style]}>
            <TouchableOpacity activeOpacity={1} onPress={handleVideoPress} style={styles.videoWrapper}>
                <VideoView
                    player={player}
                    style={styles.video}
                    contentFit="contain"
                    nativeControls={false} // We implement custom controls
                />

                {/* Loading Overlay - expo-video usually handles loading internally but we don't have isLoaded event easily exposed in same way. 
                    We can check player.status or just assume ready if duration > 0 
                */}
                {duration <= 0 && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#D4FF00" />
                    </View>
                )}

                {/* Controls Overlay */}
                {showControls && showControlsOverlay && duration > 0 && (
                    <View style={styles.controlsOverlay}>
                        {/* Center Play/Pause */}
                        <TouchableOpacity style={styles.centerButton} onPress={handlePlayPause}>
                            {isPlaying ? (
                                <Pause size={48} color="white" fill="white" />
                            ) : (
                                <Play size={48} color="white" fill="white" />
                            )}
                        </TouchableOpacity>

                        {/* Bottom Controls */}
                        <View style={styles.bottomControls}>
                            {/* Progress Bar */}
                            <View style={styles.progressContainer}>
                                <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
                            </View>

                            <View style={styles.controlsRow}>
                                {/* Time */}
                                <Text style={styles.timeText}>
                                    {formatTime(displayPosition)} / {formatTime(displayDuration)}
                                </Text>

                                <View style={styles.rightControls}>
                                    {/* Mute Button */}
                                    <TouchableOpacity onPress={handleMute} style={styles.controlButton}>
                                        {isMuted ? (
                                            <VolumeX size={20} color="white" />
                                        ) : (
                                            <Volume2 size={20} color="white" />
                                        )}
                                    </TouchableOpacity>

                                    {/* Fullscreen Button */}
                                    <TouchableOpacity onPress={handleFullScreen} style={styles.controlButton}>
                                        <Maximize2 size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#000',
        borderRadius: 12,
        overflow: 'hidden',
    },
    videoWrapper: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        pointerEvents: 'none', // Allow clicks to pass through to container
    },
    controlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        paddingBottom: 16,
    },
    progressContainer: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#D4FF00',
        borderRadius: 2,
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    rightControls: {
        flexDirection: 'row',
        gap: 12,
    },
    controlButton: {
        padding: 4,
    },
});
