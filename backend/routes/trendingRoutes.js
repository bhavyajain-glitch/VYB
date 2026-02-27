const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { getTrendingHashtags } = require('../jobs/scheduler');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get trending hashtags
// @route   GET /api/trending/hashtags
router.get('/hashtags', protect, async (req, res) => {
    try {
        // Get from scheduler cache
        let trending = getTrendingHashtags();

        // Fallback: compute on-demand if cache is empty
        if (!trending || trending.length === 0) {
            const cutoffDate = new Date();
            cutoffDate.setHours(cutoffDate.getHours() - 24);

            trending = await Post.aggregate([
                {
                    $match: {
                        isDeleted: false,
                        status: 'ready',
                        createdAt: { $gte: cutoffDate },
                        hashtags: { $exists: true, $ne: [] }
                    }
                },
                { $unwind: '$hashtags' },
                {
                    $group: {
                        _id: '$hashtags',
                        count: { $sum: 1 },
                        totalEngagement: { $sum: '$engagementScore' }
                    }
                },
                {
                    $project: {
                        tag: '$_id',
                        count: 1,
                        score: { $add: ['$count', { $multiply: ['$totalEngagement', 0.1] }] }
                    }
                },
                { $sort: { score: -1 } },
                { $limit: 20 }
            ]);
        }

        res.json(trending);
    } catch (error) {
        console.error('Get Trending Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get trending posts
// @route   GET /api/trending/posts
router.get('/posts', protect, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const hoursBack = parseInt(req.query.hours) || 24;

        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - hoursBack);

        const posts = await Post.find({
            isDeleted: false,
            status: 'ready',
            visibility: 'public',
            createdAt: { $gte: cutoffDate }
        })
            .populate('user', 'username fullName profileImage isVerified')
            .sort({ engagementScore: -1 })
            .limit(limit);

        res.json(posts);
    } catch (error) {
        console.error('Get Trending Posts Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
