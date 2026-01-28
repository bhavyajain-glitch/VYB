import { Platform } from 'react-native';

/**
 * Helper to read blob as base64 and ensure valid image MIME type for backend
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        let result = reader.result as string;
        // Fix for HEIC or generic types appearing as application/octet-stream
        if (result.startsWith('data:application/octet-stream') || result.startsWith('data:binary/octet-stream')) {
            result = result.replace(/^data:.*?;base64,/, 'data:image/jpeg;base64,'); 
        } else if (!result.startsWith('data:image/')) {
             // Force image prefix if missing
             result = result.replace(/^data:.*?;base64,/, 'data:image/jpeg;base64,');
        }
        resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Enhanced Web Image Compressor (Resize + Compress) with Fallback
 * Handles HEIC and standard images.
 */
export const processWebImage = async (uri: string): Promise<string> => {
  if (Platform.OS !== 'web') return uri; 
  
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    console.log('Processing Web Image:', blob.type, blob.size);

    // Check if it is HEIC or formatted that canvas might not support
    if (blob.type === 'image/heic' || blob.type === 'image/heif' || !blob.type.startsWith('image/')) {
        console.log('Detected HEIC or non-standard image, using direct base64...');
        return await blobToBase64(blob);
    }

    return new Promise((resolve, reject) => {
        const img = new (window as any).Image();
        img.src = uri;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1024; 
            const scale = MAX_WIDTH / img.width;
            
            if (scale < 1) {
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scale;
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
            }

            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            console.log('Canvas compression success');
            resolve(dataUrl);
        };
        img.onerror = async () => {
            console.log('Canvas failed to load image, falling back to base64...');
            try {
                const base64 = await blobToBase64(blob);
                resolve(base64);
            } catch (e) {
                reject(e);
            }
        };
    });
  } catch (error) {
      console.error('Image processing failed:', error);
      throw error;
  }
};

/**
 * Custom Web File Picker to bypass Expo's restrictions
 * Opens a native HTML file input.
 */
export const pickImageWebCustom = async (): Promise<string | null> => {
    if (Platform.OS !== 'web') return null;

    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.heic,.heif'; // Explicitly allow HEIC
      
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          resolve(url);
        } else {
          resolve(null);
        }
      };
      
      input.click();
    });
  };
