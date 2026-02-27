const mongoose = require('mongoose');

/**
 * EngagementEvent - Track all user engagement for analytics
 * Used for: feed ranking, creator analytics, moderation
 */
const engagementEventSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        index: true
    },
    eventType: {
        type: String,
        enum: [
            'view',           // Post viewed
            'like',           // User liked
            'unlike',         // User unliked
            'comment',        // User commented
            'share',          // User shared
            'save',           // User saved
            'unsave',         // User unsaved
            'video_25',       // Video 25% watched
            'video_50',       // Video 50% watched
            'video_75',       // Video 75% watched
            'video_complete', // Video fully watched
        ],
        required: true,
        index: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
        // Examples:
        // { watchTime: 15.5 }  for video events
        // { commentId: '...' } for comment events
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Compound indexes for analytics queries
engagementEventSchema.index({ postId: 1, eventType: 1, createdAt: -1 });
engagementEventSchema.index({ userId: 1, eventType: 1, createdAt: -1 });
engagementEventSchema.index({ eventType: 1, createdAt: -1 });

// Static: Track an event
engagementEventSchema.statics.track = async function (userId, postId, eventType, metadata = {}) {
    return this.create({ userId, postId, eventType, metadata });
};

// Static: Get post analytics
engagementEventSchema.statics.getPostAnalytics = async function (postId, startDate, endDate) {
    const match = { postId: new mongoose.Types.ObjectId(postId) };
    if (startDate && endDate) {
        match.createdAt = { $gte: startDate, $lte: endDate };
    }

    return this.aggregate([
        { $match: match },
        { $group: { _id: '$eventType', count: { $sum: 1 } } }
    ]);
};

// Static: Get creator analytics (all posts by user)
engagementEventSchema.statics.getCreatorAnalytics = async function (userId, days = 7) {
    const Post = mongoose.model('Post');
    const postIds = await Post.find({ user: userId, isDeleted: false }).distinct('_id');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.aggregate([
        { $match: { postId: { $in: postIds }, createdAt: { $gte: startDate } } },
        { $group: { _id: '$eventType', count: { $sum: 1 } } }
    ]);
};

module.exports = mongoose.model('EngagementEvent', engagementEventSchema);
