const mongoose = require('mongoose');

/**
 * ReportPost - User reports for content moderation
 */
const reportPostSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        index: true
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    reason: {
        type: String,
        enum: ['spam', 'nudity', 'violence', 'harassment', 'hate_speech', 'misinformation', 'other'],
        required: true
    },
    description: {
        type: String,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['pending', 'reviewing', 'actioned', 'dismissed'],
        default: 'pending',
        index: true
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    actionTaken: {
        type: String,
        enum: ['none', 'warning', 'removed', 'user_banned'],
        default: 'none'
    },
    reviewNotes: String,
    reviewedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Prevent duplicate reports
reportPostSchema.index({ postId: 1, reportedBy: 1 }, { unique: true });

// Static: Check if post should be auto-flagged (3+ reports in 24h)
reportPostSchema.statics.checkAutoFlag = async function (postId) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const count = await this.countDocuments({
        postId,
        createdAt: { $gte: oneDayAgo }
    });

    if (count >= 3) {
        // Auto-flag the post
        const Post = mongoose.model('Post');
        const User = mongoose.model('User');
        const Notification = mongoose.model('Notification');

        await Post.findByIdAndUpdate(postId, { status: 'flagged' });

        // Notify all admin users
        try {
            const admins = await User.find({ isAdmin: true }).select('_id');
            if (admins.length > 0) {
                const notifications = admins.map(admin => ({
                    userId: admin._id,
                    title: '⚠️ Post Auto-Flagged',
                    body: `A post received ${count} reports in 24 hours and was automatically flagged for review.`,
                    type: 'admin',
                    data: { postId, reportCount: count }
                }));
                await Notification.insertMany(notifications, { ordered: false });
                console.log(`[AutoFlag] Notified ${admins.length} admins about flagged post ${postId}`);
            }
        } catch (notifyError) {
            console.error('[AutoFlag] Failed to notify admins:', notifyError.message);
        }

        return true;
    }
    return false;
};

// Static: Get pending reports for admin
reportPostSchema.statics.getPendingReports = function (limit = 50) {
    return this.find({ status: 'pending' })
        .populate('postId', 'media caption user')
        .populate('reportedBy', 'username')
        .sort({ createdAt: -1 })
        .limit(limit);
};

module.exports = mongoose.model('ReportPost', reportPostSchema);
