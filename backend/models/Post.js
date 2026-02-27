const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Unified media array (replaces images[] + videos[])
  media: [{
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    publicId: String,
    width: Number,
    height: Number,
    duration: Number,  // video only (seconds)
    trimStart: Number, // video only
    trimEnd: Number,   // video only
    thumbnail: String, // video poster
    order: { type: Number, default: 0 }
  }],

  // Cover thumbnail for carousel/video posts
  thumbnail: String,

  caption: String,

  // Hashtags extracted from caption
  hashtags: [{
    type: String,
    index: true
  }],

  // Tagged users
  taggedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Location
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },

  // Visibility control
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public',
    index: true
  },

  // Post status (processing pipeline)
  status: {
    type: String,
    enum: ['processing', 'ready', 'failed', 'scheduled', 'flagged', 'draft'],
    default: 'processing',
    index: true
  },

  // Scheduled publishing
  scheduledFor: Date,

  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },

  // Reels-specific
  isReel: {
    type: Boolean,
    default: false,
    index: true
  },
  aspectRatio: String,  // '9:16' for reels

  // === PRECOMPUTED COUNTERS (use $inc for atomic updates) ===
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },
  saveCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  engagementScore: { type: Number, default: 0, index: true },

  // Reels watch metrics
  watchTimeSum: { type: Number, default: 0 },    // Total watch time (seconds)
  completionSum: { type: Number, default: 0 },   // Sum of completion %

  // Legacy: Keep likes array for existing functionality
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  // Enhanced comments with nesting support
  comments: [{
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    parentId: mongoose.Schema.Types.ObjectId,  // null = top-level
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likeCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],

  // === LEGACY FIELDS (for backward compatibility) ===
  images: [{ type: String }],
  videos: [{
    url: { type: String },
    publicId: String,
    duration: Number,
    thumbnail: String,
    width: Number,
    height: Number
  }],
  mediaType: {
    type: String,
    enum: ['image', 'video', 'mixed'],
    default: 'image'
  },
  image: { type: String },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
});

// === VIRTUALS ===

// Backward compat: allImages
postSchema.virtual('allImages').get(function () {
  // New unified media
  if (this.media && this.media.length > 0) {
    return this.media.filter(m => m.type === 'image').map(m => m.url);
  }
  // Legacy images
  if (this.images && this.images.length > 0) {
    return this.images;
  }
  if (this.image) {
    return [this.image];
  }
  return [];
});

// Backward compat: allVideos
postSchema.virtual('allVideos').get(function () {
  // New unified media
  if (this.media && this.media.length > 0) {
    return this.media.filter(m => m.type === 'video');
  }
  // Legacy videos
  return this.videos || [];
});

// Unified media getter (handles both new and legacy)
postSchema.virtual('allMedia').get(function () {
  // New unified media
  if (this.media && this.media.length > 0) {
    return this.media.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // Legacy fallback
  const media = [];
  const images = this.allImages || [];
  images.forEach((url, idx) => {
    media.push({ type: 'image', url, order: idx });
  });
  if (this.videos && this.videos.length > 0) {
    this.videos.forEach((video, idx) => {
      media.push({
        type: 'video',
        url: video.url,
        thumbnail: video.thumbnail,
        duration: video.duration,
        order: images.length + idx
      });
    });
  }
  return media;
});

// Average completion rate for reels
postSchema.virtual('avgCompletionRate').get(function () {
  if (this.viewCount > 0 && this.completionSum > 0) {
    return this.completionSum / this.viewCount;
  }
  return 0;
});

// === METHODS ===

// Extract hashtags from caption
postSchema.methods.extractHashtags = function () {
  if (!this.caption) return [];
  const regex = /#[\w\u0080-\uFFFF]+/g;
  const matches = this.caption.match(regex) || [];
  return [...new Set(matches.map(tag => tag.toLowerCase().slice(1)))];
};

// === PRE-SAVE HOOKS ===

postSchema.pre('save', async function () {
  // Auto-extract hashtags
  if (this.isModified('caption')) {
    this.hashtags = this.extractHashtags();
  }

  // Auto-detect reel (vertical video)
  if (this.media && this.media.length === 1 && this.media[0].type === 'video') {
    const m = this.media[0];
    if (m.width && m.height && m.height > m.width) {
      this.isReel = true;
      this.aspectRatio = '9:16';
    }
  }
});

// === STATIC METHODS ===

// Get feed posts (non-deleted, ready)
postSchema.statics.getFeed = function (query = {}) {
  return this.find({
    isDeleted: false,
    status: 'ready',
    ...query
  })
    .populate('user', 'username fullName profileImage isVerified')
    .sort({ engagementScore: -1, createdAt: -1 });
};

// Increment counter atomically
postSchema.statics.incrementCounter = async function (postId, field, amount = 1) {
  return this.findByIdAndUpdate(postId, { $inc: { [field]: amount } }, { new: true });
};

// === INDEXES ===
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ hashtags: 1, createdAt: -1 });
postSchema.index({ isReel: 1, engagementScore: -1 });
postSchema.index({ status: 1, scheduledFor: 1 });

// Ensure virtuals are included in JSON
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);
