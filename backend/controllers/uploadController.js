const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Constants for video uploads
const MAX_VIDEO_DURATION = 900; // 15 minutes in seconds
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB limit
const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB chunks for upload_large

/**
 * @desc    Upload image to Cloudinary
 * @route   POST /api/upload
 * @access  Private
 */
exports.uploadImage = async (req, res) => {
  try {
    const { image, folder = 'campusconnect' } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'No image provided' });
    }

    // Validate base64 format
    if (!image.startsWith('data:image')) {
      return res.status(400).json({ message: 'Invalid image format. Must be base64 data URL.' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 1024, height: 1024, crop: 'limit' }, // Limit max size
        { quality: 'auto:good' }, // Auto optimize quality
        { fetch_format: 'auto' } // Auto format (webp for supported browsers)
      ]
    });

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });

  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    res.status(500).json({
      message: 'Image upload failed',
      error: error.message
    });
  }
};

/**
 * @desc    Upload video to Cloudinary with chunked upload
 * @route   POST /api/upload/video
 * @access  Private
 */
exports.uploadVideo = async (req, res) => {
  let tempFilePath = null;

  try {
    const { video, folder = 'campusconnect/videos' } = req.body;

    if (!video) {
      return res.status(400).json({ message: 'No video provided' });
    }

    // Check if it's a base64 data URL or a file path/URL
    let uploadSource = video;

    if (video.startsWith('data:video') || video.startsWith('data:application')) {
      // Convert base64 to temp file for chunked upload
      const base64Data = video.replace(/^data:.*?;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Check size before processing
      if (buffer.length > MAX_VIDEO_SIZE) {
        return res.status(400).json({
          message: `Video too large. Maximum size is ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`,
          maxSize: MAX_VIDEO_SIZE
        });
      }

      // Write to temp file for chunked upload
      const uniqueId = crypto.randomBytes(8).toString('hex');
      tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}_${uniqueId}.mp4`);
      fs.writeFileSync(tempFilePath, buffer);
      uploadSource = tempFilePath;
      console.log(`📝 Temp file created: ${tempFilePath} (${(buffer.length / (1024 * 1024)).toFixed(2)}MB)`);
    }

    console.log('📹 Starting video upload to Cloudinary (chunked)...');

    // Use upload_large for chunked uploads - handles large files and network interruptions
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_large(uploadSource, {
        folder: folder,
        resource_type: 'video',
        chunk_size: CHUNK_SIZE,
        timeout: 300000,
        eager: [
          { streaming_profile: 'auto', format: 'm3u8' },
          { quality: 'auto', format: 'mp4' }
        ],
        eager_async: true,
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      }, (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload_large error callback:', error);
          reject(error);
        } else {
          resolve(result);
        }
      });
    });

    if (!result || !result.public_id) {
      console.error('❌ Cloudinary returned invalid result:', result);
      throw new Error('Cloudinary failed to return a valid result');
    }

    // Check video duration
    if (result.duration && result.duration > MAX_VIDEO_DURATION) {
      // Delete the uploaded video if too long
      await cloudinary.uploader.destroy(result.public_id, { resource_type: 'video' });
      return res.status(400).json({
        message: `Video duration exceeds limit. Maximum is ${MAX_VIDEO_DURATION / 60} minutes.`,
        maxDuration: MAX_VIDEO_DURATION,
        actualDuration: result.duration
      });
    }

    console.log('✅ Video upload successful:', result.public_id);

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,
      width: result.width,
      height: result.height,
      format: result.format,
      // Generate thumbnail URL
      thumbnail: cloudinary.url(result.public_id, {
        resource_type: 'video',
        format: 'jpg',
        transformation: [
          { width: 640, height: 360, crop: 'fill' },
          { quality: 'auto' }
        ]
      })
    });

  } catch (error) {
    console.error('Cloudinary Video Upload Error:', error);

    // Provide helpful error messages for common issues
    let errorMessage = 'Video upload failed';
    let errorDetails = error.message;

    if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      errorMessage = 'Upload timed out. Please try again with a stable connection.';
    } else if (error.message?.includes('chunk')) {
      errorMessage = 'Upload interrupted. Please try again.';
    } else if (error.http_code === 413) {
      errorMessage = 'Video file too large for your Cloudinary plan.';
    }

    res.status(500).json({
      message: errorMessage,
      error: errorDetails,
      retryable: true
    });
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (e) {
        console.error('Failed to clean up temp file:', e);
      }
    }
  }
};

/**
 * @desc    Delete image from Cloudinary
 * @route   DELETE /api/upload/:publicId
 * @access  Private
 */
exports.deleteImage = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'image' } = req.query;

    if (!publicId) {
      return res.status(400).json({ message: 'Public ID required' });
    }

    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

    res.json({ success: true, message: 'Media deleted' });

  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    res.status(500).json({ message: 'Failed to delete media' });
  }
};

/**
 * @desc    Generate download URL for media
 * @route   GET /api/upload/download/:publicId
 * @access  Private
 */
exports.getDownloadUrl = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'image' } = req.query;

    if (!publicId) {
      return res.status(400).json({ message: 'Public ID required' });
    }

    // Generate URL with attachment flag for direct download
    const downloadUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      flags: 'attachment',
      // For videos, use mp4 format for download
      format: resourceType === 'video' ? 'mp4' : undefined
    });

    res.json({
      success: true,
      downloadUrl,
      publicId,
      resourceType
    });

  } catch (error) {
    console.error('Generate Download URL Error:', error);
    res.status(500).json({ message: 'Failed to generate download URL' });
  }
};
