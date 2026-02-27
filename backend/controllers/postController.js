const Post = require('../models/Post');
const User = require('../models/User');
const EngagementEvent = require('../models/EngagementEvent');
const cache = require('../utils/cache');

// @desc    Get Feed Posts (with pagination, ranking)
// @route   GET /api/posts?page=1&limit=10
exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      user: { $nin: req.user.blockedUsers },
      isDeleted: false,
      status: 'ready'
    })
      .populate('user', 'username fullName profileImage isVerified college followers')
      .sort({ engagementScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit + 1);

    const hasMore = posts.length > limit;
    const postsToReturn = hasMore ? posts.slice(0, limit) : posts;

    res.json({
      posts: postsToReturn,
      hasMore,
      page,
      limit
    });
  } catch (error) {
    console.error('Get Posts Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get Explore Feed (trending, non-following) - CACHED
// @route   GET /api/posts/explore
exports.getExplorePosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Try cache first (explore feed is shared across users, filtered by blockedUsers client-side)
    const cacheKey = cache.cacheKeys.exploreFeed(page);
    const cached = await cache.get(cacheKey);

    if (cached) {
      // Filter out blocked users client-side
      const blockedIds = req.user.blockedUsers.map(id => id.toString());
      cached.posts = cached.posts.filter(p => !blockedIds.includes(p.user._id.toString()));
      return res.json(cached);
    }

    const posts = await Post.find({
      isDeleted: false,
      status: 'ready',
      visibility: 'public'
    })
      .populate('user', 'username fullName profileImage isVerified')
      .sort({ engagementScore: -1 })
      .skip(skip)
      .limit(limit);

    const result = { posts, page, limit };

    // Cache for 15 minutes
    await cache.set(cacheKey, result, cache.TTL.EXPLORE_FEED);

    res.json(result);
  } catch (error) {
    console.error('Get Explore Posts Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get Following Feed (personalized, cached)
// @route   GET /api/posts/following
exports.getFollowingFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    // Try user-specific cache first
    const cacheKey = cache.cacheKeys.followingFeed(userId, page);
    const cached = await cache.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Get users the current user is following
    const currentUser = await User.findById(userId).select('following blockedUsers');
    const followingIds = currentUser.following || [];
    const blockedIds = (currentUser.blockedUsers || []).map(id => id.toString());

    if (followingIds.length === 0) {
      return res.json({ posts: [], hasMore: false, page, limit });
    }

    // Get posts from followed users (not blocked)
    const posts = await Post.find({
      user: { $in: followingIds, $nin: currentUser.blockedUsers },
      isDeleted: false,
      status: 'ready',
      visibility: { $in: ['public', 'followers'] }
    })
      .populate('user', 'username fullName profileImage isVerified')
      .sort({ engagementScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit + 1);

    const hasMore = posts.length > limit;
    const postsToReturn = hasMore ? posts.slice(0, limit) : posts;

    const result = { posts: postsToReturn, hasMore, page, limit };

    // Cache for 5 minutes (user-specific)
    await cache.set(cacheKey, result, cache.TTL.FOLLOWING_FEED);

    res.json(result);
  } catch (error) {
    console.error('Get Following Feed Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get Reels Feed - CACHED
// @route   GET /api/posts/reels
exports.getReels = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Try cache first
    const cacheKey = cache.cacheKeys.reelsFeed(page);
    const cached = await cache.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const reels = await Post.find({
      isReel: true,
      isDeleted: false,
      status: 'ready',
      visibility: 'public'
    })
      .populate('user', 'username fullName profileImage isVerified')
      .sort({ engagementScore: -1 })
      .skip(skip)
      .limit(limit);

    const result = { reels, page, limit };

    // Cache for 10 minutes
    await cache.set(cacheKey, result, cache.TTL.REELS_FEED);

    res.json(result);
  } catch (error) {
    console.error('Get Reels Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a Post (unified media array)
// @route   POST /api/posts
exports.createPost = async (req, res) => {
  try {
    const {
      media,           // New unified format
      images, videos,  // Legacy support
      image,           // Legacy single image
      caption,
      visibility = 'public',
      location,
      taggedUsers,
      scheduledFor
    } = req.body;

    // Build unified media array
    let mediaArray = [];

    if (media && Array.isArray(media) && media.length > 0) {
      // New format
      mediaArray = media.map((m, idx) => ({
        url: m.url,
        type: m.type || 'image',
        publicId: m.publicId,
        width: m.width,
        height: m.height,
        duration: m.duration,
        thumbnail: m.thumbnail,
        order: m.order ?? idx
      }));
    } else {
      // Legacy format conversion
      if (images && Array.isArray(images)) {
        images.forEach((url, idx) => {
          mediaArray.push({ url, type: 'image', order: idx });
        });
      } else if (image) {
        mediaArray.push({ url: image, type: 'image', order: 0 });
      }

      if (videos && Array.isArray(videos)) {
        videos.forEach((v, idx) => {
          mediaArray.push({
            url: v.url,
            type: 'video',
            publicId: v.publicId,
            duration: v.duration,
            thumbnail: v.thumbnail,
            width: v.width,
            height: v.height,
            order: mediaArray.length + idx
          });
        });
      }
    }

    // Validate
    if (mediaArray.length === 0) {
      return res.status(400).json({ message: 'At least one image or video is required' });
    }
    if (mediaArray.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 media items per post' });
    }

    // Create post
    const postData = {
      user: req.user.id,
      media: mediaArray,
      caption,
      visibility,
      status: scheduledFor ? 'scheduled' : 'ready',
      scheduledFor: scheduledFor || null,
      // Cover thumbnail
      thumbnail: mediaArray[0]?.thumbnail || mediaArray[0]?.url,
    };

    if (location) postData.location = location;
    if (taggedUsers) postData.taggedUsers = taggedUsers;

    // Legacy compat
    const imageUrls = mediaArray.filter(m => m.type === 'image').map(m => m.url);
    const videoItems = mediaArray.filter(m => m.type === 'video');
    postData.images = imageUrls;
    postData.videos = videoItems;
    postData.image = imageUrls[0] || videoItems[0]?.thumbnail;
    postData.mediaType = videoItems.length > 0
      ? (imageUrls.length > 0 ? 'mixed' : 'video')
      : 'image';

    const post = await Post.create(postData);
    await post.populate('user', 'username fullName profileImage');

    res.json(post);
  } catch (error) {
    console.error("Create Post Error:", error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get Single Post
// @route   GET /api/posts/:id
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false })
      .populate('user', 'username profileImage isVerified')
      .populate('comments.user', 'username profileImage')
      .populate('taggedUsers', 'username profileImage');

    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Track view
    await Post.incrementCounter(post._id, 'viewCount');
    await EngagementEvent.track(req.user.id, post._id, 'view');

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get Posts by Specific User
// @route   GET /api/posts/user/:userId
exports.getUserPosts = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const isOwnProfile = targetUserId === req.user.id.toString();

    const query = {
      user: targetUserId,
      isDeleted: false,
      status: 'ready'
    };

    // Respect visibility
    if (!isOwnProfile) {
      const targetUser = await User.findById(targetUserId);
      const isFollowing = targetUser?.followers?.includes(req.user.id);

      if (!isFollowing) {
        query.visibility = 'public';
      } else {
        query.visibility = { $in: ['public', 'followers'] };
      }
    }

    const posts = await Post.find(query)
      .populate('user', 'username fullName profileImage')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add Comment (with nesting support)
// @route   POST /api/posts/:id/comment
exports.addComment = async (req, res) => {
  try {
    const { text, parentId } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });

    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const newComment = {
      user: req.user.id,
      text,
      parentId: parentId || null,
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    // Atomic counter increment
    await Post.incrementCounter(post._id, 'commentCount');
    await EngagementEvent.track(req.user.id, post._id, 'comment', { text: text.substring(0, 100) });

    const populatedPost = await post.populate('comments.user', 'username profileImage');
    const addedComment = populatedPost.comments[populatedPost.comments.length - 1];

    res.json(addedComment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Pin/Unpin a Comment (post owner only)
// @route   PUT /api/posts/:id/comments/:commentId/pin
exports.togglePinComment = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const post = await Post.findOne({ _id: postId, isDeleted: false });

    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Only post owner can pin comments
    if (post.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Only post owner can pin comments' });
    }

    // Find the comment
    const commentIndex = post.comments.findIndex(c => c._id.toString() === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const comment = post.comments[commentIndex];
    const wasAlreadyPinned = comment.isPinned;

    // Unpin all other comments first (only one pinned at a time)
    post.comments.forEach(c => {
      c.isPinned = false;
    });

    // Toggle pin on target comment
    post.comments[commentIndex].isPinned = !wasAlreadyPinned;

    await post.save();

    res.json({
      isPinned: post.comments[commentIndex].isPinned,
      commentId
    });
  } catch (error) {
    console.error('Toggle Pin Comment Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Like/Unlike Post (with atomic counter)
// @route   PUT /api/posts/:id/like
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const likeIds = post.likes.map(id => id.toString());
    const userId = req.user.id.toString();
    const isLiked = likeIds.includes(userId);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== userId);
      await Post.incrementCounter(post._id, 'likeCount', -1);
      await EngagementEvent.track(req.user.id, post._id, 'unlike');
    } else {
      // Like
      post.likes.push(req.user.id);
      await Post.incrementCounter(post._id, 'likeCount', 1);
      await EngagementEvent.track(req.user.id, post._id, 'like');
    }

    await post.save();
    res.json({ likes: post.likes, likeCount: post.likeCount + (isLiked ? -1 : 1) });
  } catch (error) {
    console.error('Toggle Like Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Track video watch progress
// @route   POST /api/posts/:id/watch
exports.trackWatch = async (req, res) => {
  try {
    const { watchTime, completionPercent } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Update watch metrics
    await Post.findByIdAndUpdate(post._id, {
      $inc: {
        watchTimeSum: watchTime || 0,
        completionSum: completionPercent || 0
      }
    });

    // Track milestone events
    if (completionPercent >= 25 && completionPercent < 50) {
      await EngagementEvent.track(req.user.id, post._id, 'video_25');
    } else if (completionPercent >= 50 && completionPercent < 75) {
      await EngagementEvent.track(req.user.id, post._id, 'video_50');
    } else if (completionPercent >= 75 && completionPercent < 100) {
      await EngagementEvent.track(req.user.id, post._id, 'video_75');
    } else if (completionPercent >= 100) {
      await EngagementEvent.track(req.user.id, post._id, 'video_complete');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Track Watch Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Soft Delete Post
// @route   DELETE /api/posts/:id
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Only owner can delete
    if (post.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Soft delete
    post.isDeleted = true;
    await post.save();

    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete Post Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Track Share Action
// @route   POST /api/posts/:id/share
exports.trackShare = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Atomic counter increment
    await Post.incrementCounter(postId, 'shareCount', 1);
    await EngagementEvent.track(req.user.id, postId, 'share');

    res.json({ success: true, shareCount: (post.shareCount || 0) + 1 });
  } catch (error) {
    console.error('Track Share Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle Bookmark/Save Post
// @route   PUT /api/posts/:id/bookmark
exports.toggleBookmark = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const user = await User.findById(userId);
    const savedIds = user.savedPosts.map(id => id.toString());
    const isSaved = savedIds.includes(postId);

    if (isSaved) {
      user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
      await Post.incrementCounter(postId, 'saveCount', -1);
      await EngagementEvent.track(userId, postId, 'unsave');
    } else {
      user.savedPosts.push(postId);
      await Post.incrementCounter(postId, 'saveCount', 1);
      await EngagementEvent.track(userId, postId, 'save');
    }

    await user.save();
    res.json({ saved: !isSaved, savedPosts: user.savedPosts });
  } catch (error) {
    console.error('Toggle Bookmark Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get Saved/Bookmarked Posts
// @route   GET /api/posts/saved
exports.getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedPosts',
      match: { isDeleted: false, status: 'ready' },
      populate: { path: 'user', select: 'username fullName profileImage' }
    });

    res.json(user.savedPosts || []);
  } catch (error) {
    console.error('Get Saved Posts Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get Posts by Hashtag
// @route   GET /api/posts/hashtag/:tag
exports.getPostsByHashtag = async (req, res) => {
  try {
    const tag = req.params.tag.toLowerCase().replace('#', '');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      hashtags: tag,
      isDeleted: false,
      status: 'ready',
      visibility: 'public'
    })
      .populate('user', 'username fullName profileImage')
      .sort({ engagementScore: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ posts, tag, page, limit });
  } catch (error) {
    console.error('Get Posts By Hashtag Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Seed Dummy Posts (For Demo)
// @route   POST /api/posts/seed
exports.seedPosts = async (req, res) => {
  try {
    const post = await Post.create({
      user: req.user.id,
      media: [{
        url: 'https://images.unsplash.com/photo-1540575467063-178a50da6a3a?w=800',
        type: 'image',
        order: 0
      }],
      caption: '🎭✨ Unwind 2026 Day 1 was INSANE! #UnwindFest #ADYPU',
      status: 'ready'
    });
    res.json({ message: 'Seeded successfully', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get Current User Draft
// @route   GET /api/posts/draft
exports.getUserDraft = async (req, res) => {
  try {
    const draft = await Post.findOne({ user: req.user.id, status: 'draft' });
    res.json(draft);
  } catch (error) {
    console.error('Get User Draft Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Save/Autosave Draft
// @route   POST /api/posts/draft
exports.saveDraft = async (req, res) => {
  try {
    const { caption, media, visibility, location, taggedUsers, scheduledFor } = req.body;

    // Find existing draft or create new one
    let draft = await Post.findOne({ user: req.user.id, status: 'draft' });

    const draftData = {
      caption,
      media: media || [],
      visibility: visibility || 'public',
      location,
      taggedUsers,
      scheduledFor,
      status: 'draft',
      user: req.user.id
    };

    if (draft) {
      draft = await Post.findByIdAndUpdate(draft._id, draftData, { new: true });
    } else {
      draft = await Post.create(draftData);
    }

    res.json(draft);
  } catch (error) {
    console.error('Save Draft Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete Draft
// @route   DELETE /api/posts/draft
exports.deleteDraft = async (req, res) => {
  try {
    await Post.deleteOne({ user: req.user.id, status: 'draft' });
    res.json({ message: 'Draft deleted' });
  } catch (error) {
    console.error('Delete Draft Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// @desc    Get Post Analytics (Owner only)
// @route   GET /api/posts/:id/analytics
exports.getPostAnalytics = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Only owner can see analytics
    if (post.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these insights' });
    }

    // 1. Get Summary Stats from Post
    const summary = {
      views: post.viewCount || 0,
      likes: post.likeCount || 0,
      comments: post.commentCount || 0,
      shares: post.shareCount || 0,
      saves: post.saveCount || 0,
      watchTime: post.watchTimeSum || 0,
      completionRate: post.avgCompletionRate || 0
    };

    // 2. Get Event Breakdown from EngagementEvent
    const breakdown = await EngagementEvent.getPostAnalytics(post._id);
    const breakdownObj = {};
    breakdown.forEach(item => { breakdownObj[item._id] = item.count; });

    // 3. Get Daily Views (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await EngagementEvent.aggregate([
      {
        $match: {
          postId: post._id,
          eventType: 'view',
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          views: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Fill in missing days
    const stats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = dailyStats.find(s => s._id === dateStr);
      stats.push({
        date: dateStr,
        views: match ? match.views : 0
      });
    }

    res.json({
      summary,
      breakdown: breakdownObj,
      dailyViews: stats
    });
  } catch (error) {
    console.error('Get Post Analytics Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
