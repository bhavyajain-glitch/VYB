import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

// Maximum video duration in seconds (15 minutes)
// Maximum video duration in seconds (15 minutes)
export const MAX_VIDEO_DURATION = 900;
// Maximum video size in bytes (500MB)
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024;

/**
 * Helper to read blob as base64
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            let result = reader.result as string;
            resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Pick video from gallery (Web)
 */
export const pickVideoWeb = async (): Promise<{ uri: string; base64: string; duration?: number } | null> => {
    if (Platform.OS !== 'web') return null;

    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/mp4,video/quicktime,video/webm,video/*';

        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    // Get video duration using HTML5 video element
                    const videoUrl = URL.createObjectURL(file);
                    const video = document.createElement('video');
                    video.preload = 'metadata';

                    const duration = await new Promise<number>((res, rej) => {
                        video.onloadedmetadata = () => {
                            URL.revokeObjectURL(videoUrl);
                            res(video.duration);
                        };
                        video.onerror = rej;
                        video.src = videoUrl;
                    });

                    if (duration > MAX_VIDEO_DURATION) {
                        Alert.alert('Video Too Long', `Maximum video duration is ${MAX_VIDEO_DURATION / 60} minutes.`);
                        resolve(null);
                        return;
                    }

                    // Convert to base64
                    const base64 = await blobToBase64(file);
                    const uri = URL.createObjectURL(file);

                    resolve({ uri, base64, duration });
                } catch (error) {
                    console.error('Error processing video:', error);
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        };

        input.click();
    });
};

/**
 * Pick media (image or video) from gallery (Web)
 */
export const pickMediaWeb = async (): Promise<{ uri: string; type: 'image' | 'video'; base64?: string; duration?: number } | null> => {
    if (Platform.OS !== 'web') return null;

    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*,.heic,.heif';

        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (file) {
                console.log('File selected:', file.name, file.type, file.size);
                const isVideo = file.type.startsWith('video/');
                const uri = URL.createObjectURL(file);

                if (isVideo && file.size > MAX_VIDEO_SIZE) {
                    Alert.alert('Video Too Large', `Maximum video size is ${MAX_VIDEO_SIZE / (1024 * 1024)}MB.`);
                    return resolve(null);
                }

                try {
                    if (isVideo) {
                        // Get video duration
                        const video = document.createElement('video');
                        video.preload = 'metadata';


                        console.log('Checking duration...');
                        const duration = await new Promise<number>((res, rej) => {
                            // Valid URL needed for duration check
                            video.onloadedmetadata = () => {
                                console.log('Duration loaded:', video.duration);
                                res(video.duration);
                            };
                            video.onerror = (e) => {
                                console.error('Video load error', e);
                                rej(e);
                            };
                            video.src = uri;
                        });

                        if (duration > MAX_VIDEO_DURATION) {
                            Alert.alert('Video Too Long', `Maximum video duration is ${MAX_VIDEO_DURATION / 60} minutes.`);
                            resolve(null);
                            return;
                        }


                        // Use the URI created above, consistently
                        // Skip base64 for now to speed up selection - we can generate it later
                        const base64 = undefined; // await blobToBase64(file);

                        resolve({ uri, type: 'video', base64, duration });
                    } else {
                        // Image - return URI for further processing
                        const persistentUri = URL.createObjectURL(file);
                        resolve({ uri: persistentUri, type: 'image' });
                    }
                } catch (error) {
                    console.error('Error processing media:', error);
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        };

        input.click();
    });
};

/**
 * Pick video from gallery (Native - iOS/Android)
 */
export const pickVideoNative = async (): Promise<{ uri: string; base64?: string; duration?: number } | null> => {
    if (Platform.OS === 'web') return null;

    try {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            allowsEditing: false,
            quality: 1,
            videoMaxDuration: MAX_VIDEO_DURATION,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];

            // Check duration if available
            if (asset.duration && asset.duration > MAX_VIDEO_DURATION * 1000) {
                Alert.alert('Video Too Long', `Maximum video duration is ${MAX_VIDEO_DURATION / 60} minutes.`);
                return null;
            }

            return {
                uri: asset.uri,
                duration: asset.duration ? asset.duration / 1000 : undefined, // Convert ms to seconds
            };
        }

        return null;
    } catch (error) {
        console.error('Error picking video:', error);
        return null;
    }
};

/**
 * Record video using camera (Native)
 */
export const recordVideoNative = async (): Promise<{ uri: string; duration?: number } | null> => {
    if (Platform.OS === 'web') return null;

    try {
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['videos'],
            allowsEditing: false,
            quality: 1,
            videoMaxDuration: MAX_VIDEO_DURATION,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            return {
                uri: asset.uri,
                duration: asset.duration ? asset.duration / 1000 : undefined,
            };
        }

        return null;
    } catch (error) {
        console.error('Error recording video:', error);
        return null;
    }
};

/**
 * Unified video picker - picks based on platform
 */
export const pickVideo = async (): Promise<{ uri: string; base64?: string; duration?: number } | null> => {
    if (Platform.OS === 'web') {
        return pickVideoWeb();
    }
    return pickVideoNative();
};

/**
 * Convert video URI to base64 (Native)
 * Note: For large videos, you may want to upload the file directly instead
 */
export const videoUriToBase64 = async (uri: string): Promise<string> => {
    if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        return blobToBase64(blob);
    }

    // For native, we'll use expo-file-system
    const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
    });

    return `data:video/mp4;base64,${base64}`;
};

/**
 * Get video thumbnail from Cloudinary URL
 */
export const getVideoThumbnail = (videoUrl: string): string => {
    // Replace video file extension with jpg and add transformation
    if (videoUrl.includes('cloudinary.com')) {
        return videoUrl
            .replace('/video/upload/', '/video/upload/so_0,w_640,h_360,c_fill/')
            .replace(/\.(mp4|mov|webm|avi)$/i, '.jpg');
    }
    return videoUrl;
};
