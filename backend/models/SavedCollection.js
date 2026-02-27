const mongoose = require('mongoose');

/**
 * SavedCollection - Organized saved posts into collections
 */
const savedCollectionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        maxlength: 50
    },
    description: {
        type: String,
        maxlength: 200
    },
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    coverImage: String,  // First post thumbnail or custom
    isPrivate: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound unique: user can't have duplicate collection names
savedCollectionSchema.index({ user: 1, name: 1 }, { unique: true });

// Update timestamp on save
savedCollectionSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Static: Add post to collection
savedCollectionSchema.statics.addPost = async function (userId, collectionName, postId) {
    return this.findOneAndUpdate(
        { user: userId, name: collectionName },
        {
            $addToSet: { posts: postId },
            $setOnInsert: { user: userId, name: collectionName }
        },
        { upsert: true, new: true }
    );
};

// Static: Remove post from collection
savedCollectionSchema.statics.removePost = async function (userId, collectionName, postId) {
    return this.findOneAndUpdate(
        { user: userId, name: collectionName },
        { $pull: { posts: postId } },
        { new: true }
    );
};

module.exports = mongoose.model('SavedCollection', savedCollectionSchema);
