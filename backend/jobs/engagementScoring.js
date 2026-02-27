/**
 * Engagement Score Computation Job
 * 
 * Runs every 15 minutes to compute engagement scores with time decay.
 * Formula: score = rawScore / (hoursSincePost + 2)^1.5
 */

const mongoose = require('mongoose');
const Post = require('../models/Post');

// Scoring weights
const WEIGHTS = {
    like: 1.0,
    comment: 2.5,
    share: 4.0,
    save: 3.0,
    view: 0.1,
    // Reels get bonus for watch metrics
    completion: 5.0,  // per 100% completion rate
};

// Time decay parameters
const DECAY_OFFSET = 2;    // Prevents division by zero, gives new posts initial boost
const DECAY_EXPONENT = 1.5; // Higher = faster decay

/**
 * Calculate raw engagement score
 */
function calculateRawScore(post) {
    let score = 0;

    score += (post.likeCount || 0) * WEIGHTS.like;
    score += (post.commentCount || 0) * WEIGHTS.comment;
    score += (post.shareCount || 0) * WEIGHTS.share;
    score += (post.saveCount || 0) * WEIGHTS.save;
    score += (post.viewCount || 0) * WEIGHTS.view;

    // Reels get bonus for watch completion
    if (post.isReel && post.viewCount > 0 && post.completionSum > 0) {
        const avgCompletion = post.completionSum / post.viewCount;
        score += avgCompletion * WEIGHTS.completion;
    }

    return score;
}

/**
 * Apply time decay to score
 */
function applyTimeDecay(rawScore, createdAt) {
    const hoursSincePost = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    const decayFactor = Math.pow(hoursSincePost + DECAY_OFFSET, DECAY_EXPONENT);
    return rawScore / decayFactor;
}

/**
 * Compute and update engagement scores for all active posts
 */
async function computeEngagementScores(options = {}) {
    const {
        batchSize = 500,
        maxAge = 30,  // Only score posts from last 30 days
        verbose = false
    } = options;

    const startTime = Date.now();
    let processed = 0;
    let errors = 0;

    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - maxAge);

        // Get posts in batches
        const cursor = Post.find({
            isDeleted: false,
            status: 'ready',
            createdAt: { $gte: cutoffDate }
        }).cursor({ batchSize });

        const bulkOps = [];

        for await (const post of cursor) {
            try {
                const rawScore = calculateRawScore(post);
                const engagementScore = applyTimeDecay(rawScore, post.createdAt);

                bulkOps.push({
                    updateOne: {
                        filter: { _id: post._id },
                        update: { $set: { engagementScore: Math.round(engagementScore * 100) / 100 } }
                    }
                });

                // Execute batch
                if (bulkOps.length >= batchSize) {
                    await Post.bulkWrite(bulkOps);
                    processed += bulkOps.length;
                    bulkOps.length = 0;

                    if (verbose) {
                        console.log(`[EngagementJob] Processed ${processed} posts...`);
                    }
                }
            } catch (err) {
                errors++;
                console.error(`[EngagementJob] Error processing post ${post._id}:`, err.message);
            }
        }

        // Process remaining
        if (bulkOps.length > 0) {
            await Post.bulkWrite(bulkOps);
            processed += bulkOps.length;
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[EngagementJob] Completed: ${processed} posts updated in ${duration}s (${errors} errors)`);

        return { processed, errors, duration };
    } catch (error) {
        console.error('[EngagementJob] Fatal error:', error);
        throw error;
    }
}

/**
 * Get trending hashtags
 */
async function computeTrendingHashtags(options = {}) {
    const {
        limit = 20,
        hoursBack = 24
    } = options;

    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursBack);

    try {
        const trending = await Post.aggregate([
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
            { $limit: limit }
        ]);

        console.log(`[TrendingJob] Found ${trending.length} trending hashtags`);
        return trending;
    } catch (error) {
        console.error('[TrendingJob] Error:', error);
        throw error;
    }
}

module.exports = {
    computeEngagementScores,
    computeTrendingHashtags,
    calculateRawScore,
    applyTimeDecay,
    WEIGHTS,
};
