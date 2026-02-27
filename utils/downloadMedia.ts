import { Platform, Alert, Share } from 'react-native';
import * as Linking from 'expo-linking';

// Lazy load native-only modules
const getFileSystem = () => require('expo-file-system');
const getMediaLibrary = () => require('expo-media-library');

/**
 * Download media file (image or video)
 * Handles platform differences between web and native
 */
export const downloadMedia = async (
    url: string,
    filename: string,
    mediaType: 'image' | 'video' = 'image'
): Promise<boolean> => {
    try {
        if (Platform.OS === 'web') {
            return downloadMediaWeb(url, filename);
        } else {
            return downloadMediaNative(url, filename, mediaType);
        }
    } catch (error) {
        console.error('Download error:', error);
        Alert.alert('Download Failed', 'Unable to download the file. Please try again.');
        return false;
    }
};

/**
 * Web download - creates a link with download attribute
 */
const downloadMediaWeb = async (url: string, filename: string): Promise<boolean> => {
    try {
        // For Cloudinary URLs, add fl_attachment flag for direct download
        let downloadUrl = url;
        if (url.includes('cloudinary.com') && !url.includes('fl_attachment')) {
            // Insert fl_attachment flag
            downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
        }

        // Create a temporary anchor element
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.target = '_blank';

        // Some browsers require the element to be in the DOM
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return true;
    } catch (error) {
        console.error('Web download error:', error);
        // Fallback: open in new tab
        window.open(url, '_blank');
        return true;
    }
};

/**
 * Native download - saves to device gallery/camera roll
 */
const downloadMediaNative = async (
    url: string,
    filename: string,
    mediaType: 'image' | 'video'
): Promise<boolean> => {
    try {
        const FileSystem = getFileSystem();
        const MediaLibrary = getMediaLibrary();

        // Request permissions
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission Required',
                'Please grant storage permission to save files.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Settings', onPress: () => Linking.openSettings() },
                ]
            );
            return false;
        }

        // Determine file extension
        const extension = mediaType === 'video' ? 'mp4' : 'jpg';
        const localUri = FileSystem.cacheDirectory + `${filename}.${extension}`;

        // Show downloading indicator
        Alert.alert('Downloading...', 'Please wait while the file is being saved.');

        // Download the file
        const downloadResult = await FileSystem.downloadAsync(url, localUri);

        if (downloadResult.status !== 200) {
            throw new Error('Download failed');
        }

        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);

        // Optionally create album
        const albumName = 'Vyb';
        let album = await MediaLibrary.getAlbumAsync(albumName);
        if (album === null) {
            await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }

        // Clean up cache file
        await FileSystem.deleteAsync(localUri, { idempotent: true });

        Alert.alert('Saved!', `${mediaType === 'video' ? 'Video' : 'Photo'} saved to your gallery.`);
        return true;
    } catch (error) {
        console.error('Native download error:', error);

        // Offer share as alternative
        Alert.alert(
            'Download Failed',
            'Would you like to share this file instead?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Share',
                    onPress: () => shareMedia(url, filename)
                },
            ]
        );
        return false;
    }
};

/**
 * Share media file using native share sheet
 */
export const shareMedia = async (url: string, title: string = 'Share'): Promise<boolean> => {
    try {
        if (Platform.OS === 'web') {
            // Web Share API
            if (navigator.share) {
                await navigator.share({
                    title,
                    url,
                });
                return true;
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(url);
                Alert.alert('Link Copied', 'The media link has been copied to clipboard.');
                return true;
            }
        } else {
            // Native share
            const result = await Share.share({
                message: url,
                title,
            });
            return result.action !== Share.dismissedAction;
        }
    } catch (error) {
        console.error('Share error:', error);
        return false;
    }
};

/**
 * Extract filename from URL
 */
export const getFilenameFromUrl = (url: string): string => {
    try {
        const urlParts = url.split('/');
        const filename = urlParts[urlParts.length - 1];
        // Remove query params
        return filename.split('?')[0];
    } catch {
        return 'media_' + Date.now();
    }
};
