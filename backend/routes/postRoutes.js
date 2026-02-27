const express = require('express');
const router = express.Router();
const {
    getPosts,
    getExplorePosts,
    getFollowingFeed,
    getReels,
    createPost,
    seedPosts,
    getUserPosts,
    addComment,
    togglePinComment,
    getPostById,
    toggleLike,
    toggleBookmark,
    getSavedPosts,
    getPostsByHashtag,
    trackWatch,
    trackShare,
    saveDraft,
    getUserDraft,
    deleteDraft,
    deletePost,
    getPostAnalytics
} = require('../controllers/postController');
const { reportPost, getReports, reviewReport } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Feed routes
router.get('/', protect, getPosts);
router.get('/explore', protect, getExplorePosts);
router.get('/following', protect, getFollowingFeed);
router.get('/reels', protect, getReels);
router.get('/saved', protect, getSavedPosts);
router.get('/hashtag/:tag', protect, getPostsByHashtag);

// Drafts
router.get('/draft', protect, getUserDraft);
router.post('/draft', protect, saveDraft);
router.delete('/draft', protect, deleteDraft);

// CRUD
router.post('/', protect, createPost);
router.get('/user/:userId', protect, getUserPosts);
router.get('/:id', protect, getPostById);
router.delete('/:id', protect, deletePost);
router.get('/:id/analytics', protect, getPostAnalytics);

// Engagement
router.post('/:id/comment', protect, addComment);
router.put('/:id/comments/:commentId/pin', protect, togglePinComment);
router.put('/:id/like', protect, toggleLike);
router.put('/:id/bookmark', protect, toggleBookmark);
router.post('/:id/watch', protect, trackWatch);
router.post('/:id/share', protect, trackShare);

// Moderation
router.post('/:id/report', protect, reportPost);
router.get('/admin/reports', protect, adminOnly, getReports);
router.put('/admin/reports/:reportId', protect, adminOnly, reviewReport);

// Dev
router.post('/seed', protect, seedPosts);

module.exports = router;
