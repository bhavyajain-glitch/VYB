/**
 * Job Scheduler
 * 
 * Uses node-cron to run background jobs at scheduled intervals.
 * Start this alongside your main server or as a separate worker process.
 */

const cron = require('node-cron');
const { computeEngagementScores, computeTrendingHashtags } = require('./engagementScoring');
const { cleanupExpiredSessions } = require('./cleanupBlindSessions');

// Store trending hashtags in memory (or use Redis in production)
let trendingHashtags = [];

/**
 * Get cached trending hashtags
 */
function getTrendingHashtags() {
    return trendingHashtags;
}

/**
 * Initialize all scheduled jobs
 */
function initScheduler() {
    console.log('[Scheduler] Initializing background jobs...');

    // Engagement Score Computation - Every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        console.log('[Scheduler] Running engagement score computation...');
        try {
            await computeEngagementScores({ verbose: false });
        } catch (error) {
            console.error('[Scheduler] Engagement job failed:', error.message);
        }
    });

    // Trending Hashtags - Every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
        console.log('[Scheduler] Computing trending hashtags...');
        try {
            trendingHashtags = await computeTrendingHashtags({ limit: 20, hoursBack: 24 });
        } catch (error) {
            console.error('[Scheduler] Trending job failed:', error.message);
        }
    });

    // Scheduled Posts Publisher - Every minute
    cron.schedule('* * * * *', async () => {
        try {
            const Post = require('../models/Post');
            const User = require('../models/User');
            const Notification = require('../models/Notification');
            const now = new Date();

            const duePosts = await Post.find({
                status: 'scheduled',
                scheduledFor: { $lte: now }
            }).populate('user', 'username followers');

            if (duePosts.length > 0) {
                console.log(`[Scheduler] Publishing ${duePosts.length} scheduled posts...`);

                for (const post of duePosts) {
                    post.status = 'ready';
                    await post.save();

                    // Notify followers
                    const author = post.user;
                    if (author.followers && author.followers.length > 0) {
                        const notifications = author.followers.map(followerId => ({
                            userId: followerId,
                            actorId: author._id,
                            title: 'New Post 📸',
                            body: `${author.username} shared a new post`,
                            type: 'share',
                            data: { postId: post._id.toString() }
                        }));

                        // Batch insert for efficiency
                        await Notification.insertMany(notifications, { ordered: false });
                        console.log(`[Scheduler] Notified ${author.followers.length} followers for post ${post._id}`);
                    }
                }
            }
        } catch (error) {
            console.error('[Scheduler] Scheduled posts job failed:', error.message);
        }
    });

    // Blind Session Cleanup - Every 5 minutes (existing job)
    cron.schedule('*/5 * * * *', async () => {
        try {
            await cleanupExpiredSessions();
        } catch (error) {
            console.error('[Scheduler] Blind session cleanup failed:', error.message);
        }
    });

    // Run initial trending computation
    computeTrendingHashtags({ limit: 20, hoursBack: 24 })
        .then(tags => {
            trendingHashtags = tags;
            console.log('[Scheduler] Initial trending hashtags loaded');
        })
        .catch(err => console.error('[Scheduler] Initial trending failed:', err.message));

    console.log('[Scheduler] All jobs scheduled successfully');
}

module.exports = {
    initScheduler,
    getTrendingHashtags,
};
