const express = require('express');
const router = express.Router();
const { uploadImage, uploadVideo, deleteImage, getDownloadUrl } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.post('/', protect, uploadImage);
router.post('/video', protect, uploadVideo);
router.get('/download/:publicId', protect, getDownloadUrl);
router.delete('/:publicId', protect, deleteImage);

module.exports = router;
