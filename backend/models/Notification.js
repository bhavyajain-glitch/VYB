const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
        // Contains: postId, commentId, etc.
    },
    type: {
        type: String,
        enum: [
            'like',       // Someone liked your post
            'comment',    // Someone commented on your post
            'follow',     // Someone followed you
            'mention',    // Someone mentioned you (@username)
            'tag',        // Someone tagged you in a post
            'share',      // Someone shared your post
            'save',       // Someone saved your post
            'match',      // Dating match
            'blind',      // Blind date
            'chat',       // New chat message
            'expiry',     // Subscription/slot expiry
            'promo',      // Promotional
            'admin',      // Admin message
            'report',     // Your post was reported
        ],
        default: 'admin',
        index: true,
    },
    read: {
        type: Boolean,
        default: false,
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

